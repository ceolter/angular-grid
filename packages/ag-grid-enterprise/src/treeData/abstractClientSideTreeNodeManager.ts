import type {
    ChangedPath,
    InitialGroupOrderComparatorParams,
    IsGroupOpenByDefaultParams,
    RefreshModelState,
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
    activeChangedPath: ChangedPath | null;
    deltaUpdate: boolean;
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

    public override activate(state: RefreshModelState<TData>): void {
        super.activate(state);

        const rootNode = state.rootNode;
        const treeRoot = (this.treeRoot ??= new TreeNode(null, '', -1));
        treeRoot.setRow(rootNode);
        treeRoot.invalidate();
    }

    public override destroy(): void {
        super.destroy();

        // Forcefully deallocate memory
        this.treeRoot = null;
        this.rowsPendingDestruction = null;
        this.oldGroupDisplayColIds = '';
    }

    public override deactivate(state: RefreshModelState<TData>): void {
        const treeRoot = this.treeRoot;
        if (treeRoot) {
            const unlinkChild = (node: TreeNode): void => {
                const row = node.row;
                if (row && !row.data) {
                    this.rowNodeDeleted(row); // Delete filler node
                    state.remove(row);
                }
                for (const child of node.enumChildren()) {
                    unlinkChild(child);
                }
                node.unlink(); // Unlink the tree node
            };

            for (const child of treeRoot.enumChildren()) {
                unlinkChild(child);
            }

            treeRoot.unlink();
            this.treeRoot = null;
        }

        clearTreeRowFlags(state.rootNode);

        this.commitDestroyedRows(null);

        super.deactivate(state);

        this.oldGroupDisplayColIds = '';
    }

    /** Add or updates the row to a non-root node, preparing the tree correctly for the commit. */
    protected treeSetRow(node: TreeNode, newRow: RowNode, created: boolean): boolean {
        const { level, row: oldRow } = node;
        if (level < 0) {
            return false; // Cannot overwrite the root row
        }

        let invalidate = false;
        if (oldRow !== newRow) {
            const prevNode = newRow.treeNode as TreeNode | null;
            if (prevNode !== null && prevNode !== node) {
                // The new row is somewhere else in the tree, we need to move it.
                prevNode.clearRow(newRow);
                prevNode.invalidate();
            }

            if (oldRow === null) {
                // No previous row, just set the new row.
                node.setRow(newRow);
                invalidate = true;
            } else if (!oldRow.data) {
                // We are replacing a filler row with a real row.
                node.setRow(newRow);
                this.addRowToDestroy(oldRow); // Delete the filler node
                invalidate = true;
            } else {
                // We have a new non-filler row, but we had already one, this is a duplicate
                if (node.addDuplicateRow(newRow)) {
                    invalidate = true;
                }
            }
        }

        if (!created && !isTreeRowUpdated(newRow)) {
            setTreeRowUpdated(newRow);
            invalidate = true;
        }

        if (invalidate) {
            node.invalidate();
        }

        this.rowsPendingDestruction?.delete(newRow); // This row is not deleted.

        return invalidate;
    }

    /**
     * Overwrites the row property of a non-root node to null.
     * @returns The previous row, if any, that was overwritten.
     */
    protected treeRemove(node: TreeNode, oldRow: RowNode): void {
        const { parent, level } = node;

        if (level < 0) {
            return; // Cannot remove the root node
        }

        let invalidate = false;

        if (node.clearRow(oldRow)) {
            invalidate = true;
            if (parent) {
                parent.childrenChanged = true;
            }
            this.addRowToDestroy(oldRow);
        }

        if (invalidate) {
            node.invalidate();
        }
    }

    /** Commit the changes performed to the tree */
    private treeCommit(state: RefreshModelState<TData>): void {
        const { treeRoot, rootNode } = this;
        if (!treeRoot || !rootNode) {
            return;
        }

        let activeChangedPath: ChangedPath | null = state.changedPath;
        if (!activeChangedPath.active) {
            activeChangedPath = null;
        }

        const deltaUpdate = !!state.deltaUpdate;

        const details: TreeCommitDetails<TData> = {
            rootNode,
            deltaUpdate,
            activeChangedPath,
            expandByDefault: this.gos.get('groupDefaultExpanded'),
            isGroupOpenByDefault: this.gos.getCallback('isGroupOpenByDefault'),
        };

        this.treeCommitChildren(details, treeRoot, false);

        const rootRow = treeRoot.row;
        if (rootRow) {
            if (this.treeData) {
                rootRow.leafGroup = false; // no pivoting with tree data
            }

            if (treeRoot.childrenChanged) {
                if (treeRoot.updateChildrenAfterGroup(this.treeData)) {
                    markTreeRowPathChanged(rootRow);
                }
            }

            if (this.treeData || !activeChangedPath) {
                rootRow.childrenAfterGroup = treeRoot.childrenAfterGroup;
            }

            if (activeChangedPath && isTreeRowPathChanged(rootRow)) {
                activeChangedPath.addParentNode(rootRow);
            }

            markTreeRowCommitted(rootRow);

            rootRow.updateHasChildren();
        }

        this.beans.selectionSvc?.updateSelectableAfterGrouping(state.changedPath);
    }

    /** Calls commitChild for each invalidated child, recursively. We commit only the invalidated paths. */
    private treeCommitChildren(details: TreeCommitDetails, parent: TreeNode, collapsed: boolean): void {
        while (true) {
            const child = parent.dequeueInvalidated();
            if (child === null) {
                break;
            }
            if (child.parent === parent) {
                this.treeCommitChild(details, child, collapsed || !(parent.row?.expanded ?? true));
            }
        }

        // Ensure the childrenAfterGroup array is up to date with treeData flag
        parent.childrenChanged ||= (this.treeData ? parent.size : 0) !== parent.row!.childrenAfterGroup?.length;
    }

    /** Commit the changes performed to a node and its children */
    private treeCommitChild(details: TreeCommitDetails, node: TreeNode, collapsed: boolean): void {
        if (node.isEmptyFillerNode()) {
            this.treeClearSubtree(node);
            return; // Removed. No need to process children.
        }

        this.treeCommitPreOrder(details, node);
        this.treeCommitChildren(details, node, collapsed);

        if (node.isEmptyFillerNode()) {
            this.treeClearSubtree(node);
            return; // Removed. No need to process further
        }

        this.treeCommitPostOrder(details, node, collapsed);
    }

    private treeCommitPreOrder(details: TreeCommitDetails, node: TreeNode): void {
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

        if (this.treeData) {
            row.level = node.level;
            row.parent = node.parent!.row;
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
        } else if (!details.activeChangedPath) {
            row.level = 0;
            row.parent = details.rootNode;
            row.key = node.key;
        }
    }

    private treeCommitPostOrder(details: TreeCommitDetails, node: TreeNode, collapsed: boolean): void {
        const parent = node.parent!;
        const row = node.row!;
        const oldRow = node.oldRow;

        if (node.childrenChanged) {
            if (node.updateChildrenAfterGroup(this.treeData)) {
                markTreeRowPathChanged(row);
            }
        }

        if (node.leafChildrenChanged) {
            node.updateAllLeafChildren();
        }

        const oldGroup = row.group;

        if (this.treeData || !details.activeChangedPath) {
            row.childrenAfterGroup = node.childrenAfterGroup;
            row.allLeafChildren = node.allLeafChildren;

            const hasChildren = node.childrenAfterGroup.length > 0;
            const group = hasChildren || !row.data;

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
            if (this.treeData) {
                details.activeChangedPath?.addParentNode(row);
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

        if (collapsed && row.rowIndex !== null) {
            row.clearRowTopAndRowIndex(); // Hidden.
        }

        const sourceIdx = node.getNewSourceIdx();
        const prevRowIdx = node.sourceIdx;
        if (prevRowIdx !== sourceIdx) {
            node.sourceIdx = sourceIdx;
            if (prevRowIdx !== -1) {
                // TODO: this is not optimal, it has false positives.
                // we could optimize it if we have a way to know if a node
                // is out of order, we could do this by using a linked list instead of a map, so
                // we can directly know if a node is out of order in O(1)
                parent.childrenChanged = true; // The order of children in parent might have changed
            }
        }
    }

    private createFillerRow(node: TreeNode): RowNode {
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
        id = _ROW_ID_PREFIX_ROW_GROUP + id;

        const allNodesMap = this.allNodesMap;
        let row = allNodesMap[id];
        if (row) {
            setTreeRowExpandedInitialized(row, false);
        } else {
            row = new RowNode(this.beans);
            row.id = id;
            row.key = node.key;
            row.group = true;
            row.field = null;
            row.leafGroup = false;
            row.rowGroupIndex = null;
            row.allChildrenCount = null;
            allNodesMap[id] = row;
        }

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

    protected treeReset(): void {
        const treeRoot = this.treeRoot;
        if (treeRoot) {
            treeRoot.setRow(this.rootNode);
            if (treeRoot.size > 0) {
                treeRoot.invalidate();
            }
            for (const child of treeRoot.enumChildren()) {
                this.treeClearSubtree(child);
            }
        }
    }

    /** Called to clear a subtree. */
    private treeClearSubtree(node: TreeNode): void {
        const { parent, oldRow, row, level } = node;
        if (parent !== null && oldRow !== null) {
            parent.childrenChanged = true;
            const parentRow = parent.row;
            if (parentRow !== null) {
                markTreeRowPathChanged(parentRow);
            }
        }
        if (row !== null) {
            if (level >= 0) {
                let row = node.row;
                while (row !== null && node.clearRow(row)) {
                    this.addRowToDestroy(row);
                    row = node.row;
                }
            }
        }
        for (const child of node.enumChildren()) {
            this.treeClearSubtree(child);
        }
        node.unlink();
    }

    private addRowToDestroy(row: RowNode): void {
        if (row !== this.rootNode) {
            (this.rowsPendingDestruction ??= new Set()).add(row);
        }
    }

    /**
     * destroyRow can defer the deletion to the end of the commit stage.
     * This method finalizes the deletion of rows that were marked for deletion.
     */
    private commitDestroyedRows(state: RefreshModelState<TData> | null) {
        const { rowsPendingDestruction } = this;
        if (rowsPendingDestruction !== null) {
            for (const row of rowsPendingDestruction) {
                this.rowNodeDeleted(row);
                (row.treeNode as TreeNode | null)?.unlink();
                if (state !== null && (isTreeRowCommitted(row) || row.isSelected())) {
                    state.remove(row);
                }
            }
            this.rowsPendingDestruction = null;
        }
    }

    private afterColumnsChanged(): void {
        // Check if group data need to be recomputed due to group columns change

        if (this.treeData) {
            const newGroupDisplayColIds =
                this.beans.showRowGroupCols
                    ?.getShowRowGroupCols()
                    ?.map((c) => c.getId())
                    .join('-') ?? '';

            // if the group display cols have changed, then we need to update rowNode.groupData
            // (regardless of tree data or row grouping)
            if (this.oldGroupDisplayColIds !== newGroupDisplayColIds) {
                this.oldGroupDisplayColIds = newGroupDisplayColIds;
                const rowNodes = this.rootNode?.allLeafChildren;
                if (rowNodes) {
                    for (let i = 0, len = rowNodes.length ?? 0; i < len; ++i) {
                        const rowNode = rowNodes[i];
                        const treeNode = rowNode.treeNode;
                        if (treeNode) {
                            this.setGroupData(rowNode, treeNode.key);
                        }
                    }
                }
            }
        } else {
            this.oldGroupDisplayColIds = '';
        }
    }

    public override refreshModel(state: RefreshModelState<TData>): void {
        if (state.newData || state.fullReload || !isTreeRowCommitted(state.rootNode)) {
            this.treeCommit(state);
        }

        this.commitDestroyedRows(state);

        if (state.columnsChanged && !state.newData) {
            this.afterColumnsChanged();
        }

        super.refreshModel(state);
    }
}
