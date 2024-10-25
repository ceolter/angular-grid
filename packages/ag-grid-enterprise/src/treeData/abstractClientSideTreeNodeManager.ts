import type {
    ChangedPath,
    InitialGroupOrderComparatorParams,
    IsGroupOpenByDefaultParams,
    WithoutGridCommon,
} from 'ag-grid-community';
import { AbstractClientSideNodeManager, RowNode, _ROW_ID_PREFIX_ROW_GROUP, _warn } from 'ag-grid-community';

import { setRowNodeGroup } from '../rowGrouping/rowGroupingUtils';
import { TreeNode } from './treeNode';
import type { TreeRow } from './treeRow';
import {
    clearTreeRowFlags,
    isTreeRowCommitted,
    isTreeRowExpandedInitialized,
    isTreeRowKeyChanged,
    isTreeRowPathChanged,
    isTreeRowUpdated,
    markTreeRowCommitted,
    markTreeRowPathChanged,
    setTreeRowExpandedInitialized,
    setTreeRowKeyChanged,
    setTreeRowUpdated,
} from './treeRow';

interface TreeCommitDetails<TData = any> {
    rootNode: AbstractClientSideNodeManager.RootNode<TData>;
    changedPath: ChangedPath | undefined;
    treeData: boolean;
    expandByDefault: number;
    isGroupOpenByDefault: IsGroupOpenByDefaultCallback;
}

const getExpandedInitialValue = (details: TreeCommitDetails, oldRow: RowNode | null, row: RowNode): boolean => {
    if (
        oldRow !== row &&
        oldRow !== null &&
        oldRow.group &&
        isTreeRowExpandedInitialized(oldRow) &&
        !details.isGroupOpenByDefault // If we have a callback, we use that instead
    ) {
        // When removing a group and so it gets replaced by a filler or new node, its expanded state is retained. See AG-12591
        return oldRow.expanded;
    }

    const userCallback = details.isGroupOpenByDefault;
    return userCallback
        ? userCallback({
              rowNode: row,
              field: row.field!,
              key: row.key!,
              level: row.level,
              rowGroupColumn: row.rowGroupColumn!,
          }) == true
        : details.expandByDefault === -1 || row.level < details.expandByDefault;
};

export type IsGroupOpenByDefaultCallback =
    | ((params: WithoutGridCommon<IsGroupOpenByDefaultParams>) => boolean)
    | undefined;

export type InitialGroupOrderComparatorCallback =
    | ((params: WithoutGridCommon<InitialGroupOrderComparatorParams>) => number)
    | undefined;

export abstract class AbstractClientSideTreeNodeManager<TData> extends AbstractClientSideNodeManager<TData> {
    private oldGroupDisplayColIds: string = '';

    /** Rows that are pending deletion, this.commitDeletedRows() will finalize removal. */
    private rowsPendingDestruction: Set<TreeRow> | null = null;

    /** The root node of the tree. */
    public treeRoot: TreeNode | null = null;

    public override get treeData(): boolean {
        return this.gos.get('treeData');
    }

    public override activate(rootNode: RowNode<TData>): void {
        super.activate(rootNode);
        (this.treeRoot ??= new TreeNode(null, '', -1)).setRow(rootNode);
    }

    public override destroy(): void {
        super.destroy();

        // Forcefully deallocate memory
        this.treeRoot = null!;
        this.oldGroupDisplayColIds = null!;
        this.rowsPendingDestruction = null!;
    }

    public override deactivate(): void {
        const treeRoot = this.treeRoot;
        if (treeRoot) {
            const rootRow = treeRoot.row;
            if (rootRow !== null) {
                treeRoot.removeRow(rootRow);
                clearTreeRowFlags(rootRow);
            }
            this.treeDestroy(treeRoot);
        }
        this.commitDestroyedRows();

        super.deactivate();
    }

    /** Called by ClientSideRowModel if group data need to be recomputed due to group columns change */
    public afterColumnsChanged(): void {
        const rootNode = this.rootNode;
        if (rootNode && this.gos.get('treeData')) {
            const newGroupDisplayColIds =
                this.beans.showRowGroupCols
                    ?.getShowRowGroupCols()
                    ?.map((c) => c.getId())
                    .join('-') ?? '';

            // if the group display cols have changed, then we need to update rowNode.groupData
            // (regardless of tree data or row grouping)
            if (this.oldGroupDisplayColIds !== newGroupDisplayColIds) {
                this.oldGroupDisplayColIds = newGroupDisplayColIds;

                this.checkAllGroupDataAfterColsChanged(rootNode.childrenAfterGroup);
            }
        } else {
            this.oldGroupDisplayColIds = '';
        }
    }

    private checkAllGroupDataAfterColsChanged(rowNodes: RowNode[] | null | undefined) {
        if (rowNodes) {
            for (let i = 0, len = rowNodes.length ?? 0; i < len; ++i) {
                const rowNode = rowNodes[i];
                this.setGroupData(rowNode, rowNode.treeNode?.key ?? rowNode.key ?? rowNode.id!);
                this.checkAllGroupDataAfterColsChanged(rowNode.childrenAfterGroup);
            }
        }
    }

    /** Add or updates the row to a non-root node, preparing the tree correctly for the commit. */
    protected treeSetRow(node: TreeNode, newRow: RowNode, update: boolean): void {
        const { level, row: oldRow } = node;
        if (level < 0) {
            return; // Cannot overwrite the root row
        }

        let invalidate = false;
        if (oldRow !== newRow) {
            const prevNode = newRow.treeNode as TreeNode | null;
            if (prevNode !== null && prevNode !== node) {
                // The new row is somewhere else in the tree, we need to move it.
                prevNode.removeRow(newRow);
                prevNode.invalidate();
            }

            if (oldRow === null) {
                // No previous row, just set the new row.
                node.setRow(newRow);
                invalidate = true;
            } else if (!oldRow.data) {
                // We are replacing a filler row with a real row.
                node.setRow(newRow);
                this.treeDestroyRow(oldRow, true); // Delete the filler node
                invalidate = true;
            } else {
                // We have a new non-filler row, but we had already one, this is a duplicate
                if (node.addDuplicateRow(newRow)) {
                    invalidate = true;
                }
            }
        }

        if (update && !isTreeRowUpdated(newRow)) {
            setTreeRowUpdated(newRow);
            invalidate = true;
        }

        if (invalidate) {
            node.invalidate();
        }

        this.rowsPendingDestruction?.delete(newRow); // This row is not deleted.
    }

    /**
     * Overwrites the row property of a non-root node to null.
     * @returns The previous row, if any, that was overwritten.
     */
    protected treeRemove(node: TreeNode, oldRow: RowNode): void {
        const { parent, level } = node;

        if (level < 0) {
            return; // Cannot overwrite a null node or the root row
        }

        let invalidate = false;

        if (node.removeRow(oldRow)) {
            invalidate = true;
            if (parent) {
                parent.childrenChanged = true;
            }
            this.treeDestroyRow(oldRow, !oldRow.data);
        }

        if (invalidate) {
            node.invalidate();
        }
    }

    /** Commit the changes performed to the tree */
    protected treeCommit(changedPath?: ChangedPath): void {
        const { treeRoot, rootNode } = this;
        if (!treeRoot || !rootNode) {
            return;
        }

        const treeData = this.gos.get('treeData');

        const details: TreeCommitDetails<TData> = {
            rootNode,
            changedPath,
            treeData,
            expandByDefault: this.gos.get('groupDefaultExpanded'),
            isGroupOpenByDefault: this.gos.getCallback('isGroupOpenByDefault'),
        };

        this.treeCommitChildren(details, treeRoot);

        const rootRow = treeRoot.row;
        if (rootRow) {
            if (treeData) {
                rootRow.leafGroup = false; // no pivoting with tree data
            }

            if (treeRoot.childrenChanged) {
                if (treeRoot.updateChildrenAfterGroup(treeData)) {
                    markTreeRowPathChanged(rootRow);
                }
            }

            if (isTreeRowPathChanged(rootRow)) {
                if (details.changedPath?.isActive()) {
                    details.changedPath.addParentNode(rootRow);
                }
            }

            markTreeRowCommitted(rootRow);

            rootRow.updateHasChildren();
        }

        this.commitDestroyedRows();

        this.beans.selectionSvc?.updateSelectableAfterGrouping(changedPath);
    }

    /** Calls commitChild for each invalidated child, recursively. We commit only the invalidated paths. */
    private treeCommitChildren(details: TreeCommitDetails, parent: TreeNode): void {
        while (true) {
            const child = parent.dequeueInvalidated();
            if (child === null) {
                break;
            }
            if (child.parent === parent) {
                this.treeCommitChild(details, parent, child);
            }
        }

        // Ensure the childrenAfterGroup array is up to date with treeData flag
        parent.childrenChanged ||= (details.treeData ? parent.size : 0) !== parent.row!.childrenAfterGroup?.length;
    }

    /** Commit the changes performed to a node and its children */
    private treeCommitChild(details: TreeCommitDetails, parent: TreeNode, node: TreeNode): void {
        if (node.isEmptyFillerNode()) {
            this.treeClear(node);
            return; // Removed. No need to process children.
        }

        this.treeCommitPreOrder(details, parent, node);
        this.treeCommitChildren(details, node);
        this.treeCommitPostOrder(details, parent, node);
    }

    private treeCommitPreOrder(details: TreeCommitDetails, parent: TreeNode, node: TreeNode): void {
        let row = node.row;

        if (row === null) {
            row = this.createFillerRow(node);
            node.setRow(row);
        } else {
            row = node.sortFirstDuplicateRow()!; // The main row must have the smallest sourceRowIndex of duplicates

            if (row.allChildrenCount === undefined) {
                row.allChildrenCount = null; // initialize to null if this field wasn't initialized yet
            }
        }

        if (details.treeData) {
            row.parent = parent.row;
            if (node.oldRow !== row) {
                // We need to update children rows parents, as the row changed
                for (const child of node.enumChildren()) {
                    const childRow = child.row;
                    if (childRow !== null) {
                        childRow.parent = row;
                    }
                }
            }

            const key = node.key;
            if (row.key !== key) {
                row.key = key;
                setTreeRowKeyChanged(row);
                this.setGroupData(row, key);
            } else if (!row.groupData) {
                this.setGroupData(row, key);
            }
        } else {
            row.parent = details.rootNode;
        }
    }

    private treeCommitPostOrder(details: TreeCommitDetails, parent: TreeNode, node: TreeNode): void {
        const row = node.row!;
        const oldRow = node.oldRow;
        const treeData = details.treeData;

        if (node.isEmptyFillerNode()) {
            this.treeClear(node);
            return; // Removed. No need to process further
        }

        if (node.childrenChanged) {
            if (node.updateChildrenAfterGroup(treeData)) {
                markTreeRowPathChanged(row);
            }
        }

        if (node.leafChildrenChanged) {
            node.updateAllLeafChildren();
        }

        const newRowPosition = node.getRowPosition();
        if (node.oldSourceRowIndex !== newRowPosition) {
            node.oldSourceRowIndex = newRowPosition;
            parent.childrenChanged = true; // The order of children in parent might have changed
        }

        const hasChildren = !!row.childrenAfterGroup?.length;
        const group = hasChildren || !row.data;
        const oldGroup = row.group;

        if (oldGroup !== group) {
            markTreeRowPathChanged(row);
            setRowNodeGroup(row, this.beans, group); // Internally calls updateHasChildren
            if (!group && !row.expanded) {
                setTreeRowExpandedInitialized(row, false);
            }
        } else if (row.hasChildren() !== hasChildren) {
            markTreeRowPathChanged(row);
            row.updateHasChildren();
        }

        if (group && !isTreeRowExpandedInitialized(row)) {
            row.expanded = getExpandedInitialValue(details, oldRow, row);
            setTreeRowExpandedInitialized(row, true);
        }

        if (isTreeRowUpdated(row)) {
            markTreeRowPathChanged(parent.row!);

            if (isTreeRowKeyChanged(row)) {
                // hack - if we didn't do this, then renaming a tree item (ie changing rowNode.key) wouldn't get
                // refreshed into the gui.
                // this is needed to kick off the event that rowComp listens to for refresh. this in turn
                // then will get each cell in the row to refresh - which is what we need as we don't know which
                // columns will be displaying the rowNode.key info.
                row.setData(row.data);
            }
        }

        if (oldRow !== row) {
            node.oldRow = row;
            if (oldRow !== null && (oldGroup || node.size !== 0)) {
                markTreeRowPathChanged(row);
            }
            parent.childrenChanged = true;
            markTreeRowPathChanged(parent.row!);
        }

        if (isTreeRowPathChanged(row)) {
            if (treeData && details.changedPath?.isActive()) {
                details.changedPath.addParentNode(row);
            } else {
                markTreeRowPathChanged(details.rootNode);
            }
        }

        markTreeRowCommitted(row);

        if (node.duplicateRows?.size && !node.duplicateRowsWarned) {
            node.duplicateRowsWarned = true;
            _warn(186, {
                rowId: row.id,
                rowData: row.data,
                duplicateRowsData: Array.from(node.duplicateRows).map((r) => r.data),
            });
        }
    }

    private createFillerRow(node: TreeNode): RowNode {
        const row = new RowNode(this.beans); // Create a filler node
        row.key = node.key;
        row.group = true;
        row.field = null;
        row.leafGroup = false;
        row.rowGroupIndex = null;
        row.allChildrenCount = null;

        // Generate a unique id for the filler row
        let id = node.level + '-' + node.key;
        let p = node.parent;
        while (p !== null) {
            const parent = p.parent;
            if (parent === null) {
                break;
            }
            id = `${p.level}-${p.key}-${id}`;
            p = parent;
        }
        row.id = _ROW_ID_PREFIX_ROW_GROUP + id;

        return row;
    }

    private setGroupData(row: RowNode, key: string): void {
        const groupData: Record<string, string> = {};
        row.groupData = groupData;
        const groupDisplayCols = this.beans.showRowGroupCols?.getShowRowGroupCols();
        if (groupDisplayCols) {
            for (const col of groupDisplayCols) {
                // newGroup.rowGroupColumn=null when working off GroupInfo, and we always display the group in the group column
                // if rowGroupColumn is present, then it's grid row grouping and we only include if configuration says so
                groupData[col.getColId()] = key;
            }
        }
    }

    /** Called to clear a subtree. */
    public treeClear(node: TreeNode): void {
        const { parent, oldRow, row, level } = node;
        if (parent !== null && oldRow !== null) {
            parent.childrenChanged = true;
            if (parent.row !== null) {
                markTreeRowPathChanged(parent.row);
            }
        }
        if (row !== null) {
            if (level >= 0) {
                let row = node.row;
                while (row !== null && node.removeRow(row)) {
                    this.treeDestroyRow(row, !row.data);
                    row = node.row;
                }
            }
        }
        for (const child of node.enumChildren()) {
            this.treeClear(child);
        }
        node.destroy();
    }

    /** Called by the deactivate, to destroy the whole tree. */
    private treeDestroy(node: TreeNode): void {
        const { row, level, duplicateRows } = node;
        if (row) {
            if (level >= 0 && !row.data) {
                this.treeDestroyRow(row, true); // Delete the filler node
            } else {
                clearTreeRowFlags(row); // Just clear the flags
            }
        }
        if (duplicateRows) {
            for (const row of duplicateRows) {
                if (level >= 0 && !row.data) {
                    this.treeDestroyRow(row, true); // Delete filler nodes
                } else {
                    clearTreeRowFlags(row); // Just clear the flags
                }
            }
        }
        for (const child of node.enumChildren()) {
            this.treeDestroy(child);
        }
        node.destroy();
    }

    /**
     * Finalizes the deletion of a row.
     * @param immediate If true, the row is deleted immediately.
     * If false, the row is marked for deletion, and will be deleted later with this.deleteDeletedRows()
     */
    private treeDestroyRow(row: RowNode, immediate: boolean) {
        if (!isTreeRowCommitted(row)) {
            clearTreeRowFlags(row);
            return; // Never committed, or already deleted, nothing to do.
        }

        if (!immediate) {
            (this.rowsPendingDestruction ??= new Set()).add(row);
            return; // We will delete it later with commitDeletedRows
        }

        clearTreeRowFlags(row);

        // We execute this only if the row was committed at least once before, and not already deleted.
        row.setRowIndex(null);

        // this is important for transition, see rowComp removeFirstPassFuncs. when doing animation and
        // remove, if rowTop is still present, the rowComp thinks it's just moved position.
        row.setRowTop(null);

        if (!row.data && row.isSelected()) {
            //we remove selection on filler nodes here, as the selection would not be removed
            // from the RowNodeManager, as filler nodes don't exist on the RowNodeManager
            this.beans.selectionSvc?.setSelectedParams({
                rowNode: row,
                newValue: false,
                source: 'rowGroupChanged',
            });
        }
    }

    /**
     * destroyRow can defer the deletion to the end of the commit stage.
     * This method finalizes the deletion of rows that were marked for deletion.
     */
    private commitDestroyedRows() {
        const { rowsPendingDestruction } = this;
        if (rowsPendingDestruction !== null) {
            this.rowsPendingDestruction = null;
            for (const row of rowsPendingDestruction) {
                this.treeDestroyRow(row, true);
            }
        }
    }
}
