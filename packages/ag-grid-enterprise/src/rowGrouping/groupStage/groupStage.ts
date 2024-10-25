import type {
    AgColumn,
    BeanCollection,
    ChangedPath,
    ClientSideRowModelStage,
    ColumnModel,
    FuncColsService,
    GridOptions,
    IRowNodeStage,
    ISelectionService,
    IShowRowGroupColsService,
    InitialGroupOrderComparatorParams,
    IsGroupOpenByDefaultParams,
    KeyCreatorParams,
    NamedBean,
    RowNodeTransaction,
    StageExecuteParams,
    ValueService,
    WithoutGridCommon,
} from 'ag-grid-community';
import {
    BeanStub,
    RowNode,
    _ROW_ID_PREFIX_ROW_GROUP,
    _areEqual,
    _exists,
    _removeFromArray,
    _warn,
} from 'ag-grid-community';

import { setRowNodeGroup } from '../rowGroupingUtils';
import { BatchRemover } from './batchRemover';
import type { GroupRow } from './groupRow';
import { sortGroupChildren } from './sortGroupChildren';

interface GroupInfo {
    key: string; // e.g. 'Ireland'
    field: string | null; // e.g. 'country'
    rowGroupColumn: AgColumn | null;
    leafNode?: RowNode;
}

interface GroupingDetails {
    pivotMode: boolean;
    expandByDefault: number;
    changedPath: ChangedPath;
    rootNode: RowNode;
    groupedCols: AgColumn[];
    groupedColCount: number;
    transactions: RowNodeTransaction[];
    rowNodesOrderChanged: boolean;

    groupAllowUnbalanced: boolean;
    isGroupOpenByDefault: (params: WithoutGridCommon<IsGroupOpenByDefaultParams>) => boolean;
    initialGroupOrderComparator: (params: WithoutGridCommon<InitialGroupOrderComparatorParams>) => number;

    keyCreators: (((params: KeyCreatorParams) => string) | undefined)[];
}

export class GroupStage extends BeanStub implements NamedBean, IRowNodeStage {
    beanName = 'groupStage' as const;

    public refreshProps: Set<keyof GridOptions<any>> = new Set([
        'groupDefaultExpanded',
        'groupAllowUnbalanced',
        'initialGroupOrderComparator',
        'groupHideOpenParents',
        'groupDisplayType',
    ]);
    public step: ClientSideRowModelStage = 'group';

    private columnModel: ColumnModel;
    private funcColsService: FuncColsService;
    private valueService: ValueService;
    private selectionService?: ISelectionService;
    private showRowGroupColsService: IShowRowGroupColsService;

    public wireBeans(beans: BeanCollection) {
        this.columnModel = beans.columnModel;
        this.funcColsService = beans.funcColsService;
        this.valueService = beans.valueService;
        this.selectionService = beans.selectionService;
        this.showRowGroupColsService = beans.showRowGroupColsService!;
    }

    // when grouping, these items are of note:
    // rowNode.parent: RowNode: set to the parent
    // rowNode.childrenAfterGroup: RowNode[] = the direct children of this group
    // rowNode.childrenMapped: string=>RowNode = children mapped by group key (when groups) or an empty map if leaf group (this is then used by pivot)
    // for leaf groups, rowNode.childrenAfterGroup = rowNode.allLeafChildren;

    private oldGroupingDetails: GroupingDetails;
    private oldGroupDisplayColIds: string;

    public execute(params: StageExecuteParams): void {
        const details = this.createGroupingDetails(params);

        if (details.transactions) {
            this.handleTransaction(details);
        } else {
            const afterColsChanged = params.afterColumnsChanged === true;
            this.shotgunResetEverything(details, afterColsChanged);
        }

        const changedPath = params.changedPath!;

        this.positionLeafsAndGroups(changedPath);
        this.orderGroups(details);

        this.selectionService?.updateSelectableAfterGrouping(changedPath);
    }

    private positionLeafsAndGroups(changedPath: ChangedPath) {
        changedPath.forEachChangedNodeDepthFirst((group: GroupRow) => {
            if (group.childrenAfterGroup) {
                const leafNodes: RowNode[] = [];
                const groupNodes: RowNode[] = [];
                let unbalancedNode: RowNode | undefined;

                group.childrenAfterGroup.forEach((row) => {
                    if (!row.childrenAfterGroup?.length) {
                        leafNodes.push(row);
                    } else {
                        if (row.key === '' && !unbalancedNode) {
                            unbalancedNode = row;
                        } else {
                            groupNodes.push(row);
                        }
                    }
                });

                if (unbalancedNode) {
                    groupNodes.push(unbalancedNode);
                }

                group.childrenAfterGroup = [...leafNodes, ...groupNodes];
            }
        }, false);
    }

    private createGroupingDetails(params: StageExecuteParams): GroupingDetails {
        const { rowNode, changedPath, rowNodeTransactions, rowNodesOrderChanged } = params;

        const groupedCols = this.funcColsService.rowGroupCols;

        const details: GroupingDetails = {
            expandByDefault: this.gos.get('groupDefaultExpanded'),
            groupedCols: groupedCols!,
            rootNode: rowNode,
            pivotMode: this.columnModel.isPivotMode(),
            groupedColCount: groupedCols?.length ?? 0,
            transactions: rowNodeTransactions!,
            rowNodesOrderChanged: !!rowNodesOrderChanged,
            // if no transaction, then it's shotgun, changed path would be 'not active' at this point anyway
            changedPath: changedPath!,
            groupAllowUnbalanced: this.gos.get('groupAllowUnbalanced'),
            isGroupOpenByDefault: this.gos.getCallback('isGroupOpenByDefault') as any,
            initialGroupOrderComparator: this.gos.getCallback('initialGroupOrderComparator') as any,
            keyCreators: groupedCols?.map((column) => column.getColDef().keyCreator) ?? [],
        };

        return details;
    }

    private handleTransaction(details: GroupingDetails): void {
        details.transactions.forEach((tran) => {
            const batchRemover = new BatchRemover();

            // the order here of [add, remove, update] needs to be the same as in ClientSideNodeManager,
            // as the order is important when a record with the same id is added and removed in the same
            // transaction.
            if (tran.remove?.length) {
                this.removeNodes(tran.remove as RowNode[], details, batchRemover);
            }
            if (tran.update?.length) {
                this.moveNodesInWrongPath(tran.update as RowNode[], details, batchRemover);
            }
            if (tran.add?.length) {
                this.insertNodes(tran.add as RowNode[], details);
            }

            // must flush here, and not allow another transaction to be applied,
            // as each transaction must finish leaving the data in a consistent state.
            const parentsWithChildrenRemoved = batchRemover.getAllParents().slice();
            batchRemover.flush();
            this.removeEmptyGroups(parentsWithChildrenRemoved, details);
        });

        if (details.rowNodesOrderChanged) {
            this.sortChildren(details);
        }
    }

    // this is used when doing delta updates, eg Redux, keeps nodes in right order
    private sortChildren(details: GroupingDetails): void {
        details.changedPath.forEachChangedNodeDepthFirst(
            (node) => {
                const didSort = sortGroupChildren(node.childrenAfterGroup);
                if (didSort) {
                    details.changedPath.addParentNode(node);
                }
            },
            false,
            true
        );
    }

    private orderGroups(details: GroupingDetails): void {
        const comparator = details.initialGroupOrderComparator;
        if (_exists(comparator)) {
            recursiveSort(details.rootNode);
        }

        function recursiveSort(rowNode: RowNode): void {
            const doSort =
                _exists(rowNode.childrenAfterGroup) &&
                // we only want to sort groups, so we do not sort leafs (a leaf group has leafs as children)
                !rowNode.leafGroup;

            if (doSort) {
                rowNode.childrenAfterGroup!.sort((nodeA, nodeB) => comparator!({ nodeA, nodeB }));
                rowNode.childrenAfterGroup!.forEach((childNode: RowNode) => recursiveSort(childNode));
            }
        }
    }

    private getExistingPathForNode(node: RowNode, details: GroupingDetails): GroupInfo[] {
        const res: GroupInfo[] = [];

        // the node is not part of the path so we start with the parent.
        let pointer = node.parent;
        while (pointer && pointer !== details.rootNode) {
            res.push({
                key: pointer.key!,
                rowGroupColumn: pointer.rowGroupColumn,
                field: pointer.field,
            });
            pointer = pointer.parent;
        }
        res.reverse();
        return res;
    }

    private moveNodesInWrongPath(
        childNodes: RowNode[],
        details: GroupingDetails,
        batchRemover: BatchRemover | undefined
    ): void {
        childNodes.forEach((childNode) => {
            // we add node, even if parent has not changed, as the data could have
            // changed, hence aggregations will be wrong
            if (details.changedPath.isActive()) {
                details.changedPath.addParentNode(childNode.parent);
            }

            const infoToKeyMapper = (item: GroupInfo) => item.key;
            const oldPath: string[] = this.getExistingPathForNode(childNode, details).map(infoToKeyMapper);
            const newPath: string[] = this.getGroupInfo(childNode, details).map(infoToKeyMapper);

            const nodeInCorrectPath = _areEqual(oldPath, newPath);

            if (!nodeInCorrectPath) {
                this.moveNode(childNode, details, batchRemover);
            }
        });
    }

    private moveNode(childNode: RowNode, details: GroupingDetails, batchRemover: BatchRemover | undefined): void {
        this.removeNodesFromParents([childNode], details, batchRemover);
        this.insertOneNode(childNode, details, batchRemover);

        // hack - if we didn't do this, then renaming a tree item (ie changing rowNode.key) wouldn't get
        // refreshed into the gui.
        // this is needed to kick off the event that rowComp listens to for refresh. this in turn
        // then will get each cell in the row to refresh - which is what we need as we don't know which
        // columns will be displaying the rowNode.key info.
        childNode.setData(childNode.data);

        // we add both old and new parents to changed path, as both will need to be refreshed.
        // we already added the old parent (in calling method), so just add the new parent here
        if (details.changedPath.isActive()) {
            const newParent = childNode.parent;
            details.changedPath.addParentNode(newParent);
        }
    }

    private removeNodes(
        leafRowNodes: RowNode[],
        details: GroupingDetails,
        batchRemover: BatchRemover | undefined
    ): void {
        this.removeNodesFromParents(leafRowNodes, details, batchRemover);
        if (details.changedPath.isActive()) {
            leafRowNodes.forEach((rowNode) => details.changedPath.addParentNode(rowNode.parent));
        }
    }

    private forEachParentGroup(details: GroupingDetails, group: RowNode, callback: (parent: RowNode) => void): void {
        let pointer: RowNode | null = group;
        while (pointer && pointer !== details.rootNode) {
            callback(pointer);
            pointer = pointer.parent;
        }
    }

    private removeNodesFromParents(
        nodesToRemove: RowNode[],
        details: GroupingDetails,
        provided: BatchRemover | undefined
    ): void {
        // this method can be called with BatchRemover as optional. if it is missed, we created a local version
        // and flush it at the end. if one is provided, we add to the provided one and it gets flushed elsewhere.
        const batchRemoverIsLocal = provided == null;
        const batchRemoverToUse = provided ? provided : new BatchRemover();

        nodesToRemove.forEach((nodeToRemove) => {
            this.removeFromParent(nodeToRemove, batchRemoverToUse);

            // remove from allLeafChildren. we clear down all parents EXCEPT the Root Node, as
            // the ClientSideNodeManager is responsible for the Root Node.
            this.forEachParentGroup(details, nodeToRemove.parent!, (parentNode) => {
                batchRemoverToUse.removeFromAllLeafChildren(parentNode, nodeToRemove);
            });
        });

        if (batchRemoverIsLocal) {
            batchRemoverToUse.flush();
        }
    }

    private removeEmptyGroups(possibleEmptyGroups: RowNode[], details: GroupingDetails): void {
        // we do this multiple times, as when we remove groups, that means the parent of just removed
        // group can then be empty. to get around this, if we remove, then we check everything again for
        // newly emptied groups. the max number of times this will execute is the depth of the group tree.
        let checkAgain = true;

        const groupShouldBeRemoved = (rowNode: RowNode): boolean => {
            // because of the while loop below, it's possible we already moved the node,
            // so double check before trying to remove again.
            const mapKey = this.getChildrenMappedKey(rowNode.key!, rowNode.rowGroupColumn);
            const parentRowNode = rowNode.parent;
            const groupAlreadyRemoved = parentRowNode?.childrenMapped ? !parentRowNode.childrenMapped[mapKey] : true;

            if (groupAlreadyRemoved) {
                // if not linked, then group was already removed
                return false;
            }
            // if still not removed, then we remove if this group is empty
            return !!rowNode.group && (rowNode.childrenAfterGroup?.length ?? 0) === 0;
        };

        while (checkAgain) {
            checkAgain = false;
            const batchRemover = new BatchRemover();
            possibleEmptyGroups.forEach((possibleEmptyGroup) => {
                // remove empty groups
                this.forEachParentGroup(details, possibleEmptyGroup, (rowNode) => {
                    if (groupShouldBeRemoved(rowNode)) {
                        checkAgain = true;

                        this.removeFromParent(rowNode, batchRemover);
                        // we remove selection on filler nodes here, as the selection would not be removed
                        // from the RowNodeManager, as filler nodes don't exist on the RowNodeManager
                        this.selectionService?.setSelectedParams({
                            rowNode,
                            newValue: false,
                            source: 'rowGroupChanged',
                        });
                    }
                });
            });
            batchRemover.flush();
        }
    }

    // removes the node from the parent by:
    // a) removing from childrenAfterGroup (using batchRemover if present, otherwise immediately)
    // b) removing from childrenMapped (immediately)
    // c) setRowTop(null) - as the rowRenderer uses this to know the RowNode is no longer needed
    // d) setRowIndex(null) - as the rowNode will no longer be displayed.
    private removeFromParent(child: RowNode, batchRemover?: BatchRemover) {
        if (child.parent) {
            if (batchRemover) {
                batchRemover.removeFromChildrenAfterGroup(child.parent, child);
            } else {
                _removeFromArray(child.parent.childrenAfterGroup!, child);
                child.parent.updateHasChildren();
            }
        }
        const mapKey = this.getChildrenMappedKey(child.key!, child.rowGroupColumn);
        if (child.parent?.childrenMapped) {
            delete child.parent.childrenMapped[mapKey];
        }
        // this is important for transition, see rowComp removeFirstPassFuncs. when doing animation and
        // remove, if rowTop is still present, the rowComp thinks it's just moved position.
        child.setRowTop(null);
        child.setRowIndex(null);
    }

    /**
     * This is idempotent, but relies on the `key` field being the same throughout a RowNode's lifetime
     */
    private addToParent(child: RowNode, parent: RowNode | null) {
        const mapKey = this.getChildrenMappedKey(child.key!, child.rowGroupColumn);
        if (parent?.childrenMapped) {
            if (parent.childrenMapped[mapKey] !== child) {
                parent.childrenMapped[mapKey] = child;
                parent.childrenAfterGroup!.push(child);
                setRowNodeGroup(parent, this.beans, true); // calls `.updateHasChildren` internally
            }
        }
    }

    private areGroupColsEqual(d1: GroupingDetails, d2: GroupingDetails): boolean {
        if (d1 == null || d2 == null || d1.pivotMode !== d2.pivotMode) {
            return false;
        }

        return _areEqual(d1.groupedCols, d2.groupedCols) && _areEqual(d1.keyCreators, d2.keyCreators);
    }

    private checkAllGroupDataAfterColsChanged(details: GroupingDetails): void {
        const recurse = (rowNodes: RowNode[] | null) => {
            if (!rowNodes) {
                return;
            }
            rowNodes.forEach((rowNode) => {
                const isLeafNode = !rowNode.group;
                if (isLeafNode) {
                    return;
                }
                const groupInfo: GroupInfo = {
                    field: rowNode.field,
                    key: rowNode.key!,
                    rowGroupColumn: rowNode.rowGroupColumn,
                    leafNode: rowNode.allLeafChildren?.[0],
                };
                this.setGroupData(rowNode, groupInfo);
                recurse(rowNode.childrenAfterGroup);
            });
        };

        recurse(details.rootNode.childrenAfterGroup);
    }

    private shotgunResetEverything(details: GroupingDetails, afterColumnsChanged: boolean): void {
        if (this.noChangeInGroupingColumns(details, afterColumnsChanged)) {
            return;
        }

        // groups are about to get disposed, so need to deselect any that are selected
        this.selectionService?.filterFromSelection?.((node: RowNode) => node && !node.group);

        const { groupedCols } = details;
        const rootNode: GroupRow = details.rootNode;
        // because we are not creating the root node each time, we have the logic
        // here to change leafGroup once.
        rootNode.leafGroup = groupedCols.length === 0;

        // we are doing everything from scratch, so reset childrenAfterGroup and childrenMapped from the rootNode
        rootNode.childrenAfterGroup = [];
        rootNode.childrenMapped = {};
        rootNode.updateHasChildren();

        const sibling: GroupRow = rootNode.sibling;
        if (sibling) {
            sibling.childrenAfterGroup = rootNode.childrenAfterGroup;
            sibling.childrenMapped = rootNode.childrenMapped;
        }

        this.insertNodes(rootNode.allLeafChildren!, details);
    }

    private noChangeInGroupingColumns(details: GroupingDetails, afterColumnsChanged: boolean): boolean {
        let noFurtherProcessingNeeded = false;

        const groupDisplayColumns = this.showRowGroupColsService.getShowRowGroupCols();
        const newGroupDisplayColIds = groupDisplayColumns ? groupDisplayColumns.map((c) => c.getId()).join('-') : '';

        if (afterColumnsChanged) {
            // we only need to redo grouping if doing normal grouping (ie not tree data)
            // and the group cols have changed.
            noFurtherProcessingNeeded = this.areGroupColsEqual(details, this.oldGroupingDetails);

            // if the group display cols have changed, then we need to update rowNode.groupData
            // (regardless of tree data or row grouping)
            if (this.oldGroupDisplayColIds !== newGroupDisplayColIds) {
                this.checkAllGroupDataAfterColsChanged(details);
            }
        }

        this.oldGroupingDetails = details;
        this.oldGroupDisplayColIds = newGroupDisplayColIds;

        return noFurtherProcessingNeeded;
    }

    private insertNodes(newRowNodes: RowNode[], details: GroupingDetails): void {
        newRowNodes.forEach((rowNode) => {
            this.insertOneNode(rowNode, details);
            if (details.changedPath.isActive()) {
                details.changedPath.addParentNode(rowNode.parent);
            }
        });
    }

    private insertOneNode(childNode: RowNode, details: GroupingDetails, batchRemover?: BatchRemover): void {
        const path: GroupInfo[] = this.getGroupInfo(childNode, details);

        const parentGroup = this.findParentForNode(childNode, path, details, batchRemover);

        if (!parentGroup.group) {
            _warn(184, { parentGroupData: parentGroup.data, childNodeData: childNode.data });
        }
        childNode.parent = parentGroup;
        childNode.level = path.length;
        parentGroup.childrenAfterGroup!.push(childNode);
        parentGroup.updateHasChildren();
    }

    private findParentForNode(
        childNode: RowNode,
        path: GroupInfo[],
        details: GroupingDetails,
        batchRemover?: BatchRemover
    ): RowNode {
        let nextNode: RowNode = details.rootNode;

        path.forEach((groupInfo, level) => {
            nextNode = this.getOrCreateNextNode(nextNode, groupInfo, level, details);
            // node gets added to all group nodes.
            // note: we do not add to rootNode here, as the rootNode is the master list of rowNodes

            if (!batchRemover?.isRemoveFromAllLeafChildren(nextNode, childNode)) {
                nextNode.allLeafChildren!.push(childNode);
            } else {
                // if this node is about to be removed, prevent that
                batchRemover?.preventRemoveFromAllLeafChildren(nextNode, childNode);
            }
        });

        return nextNode;
    }

    private getOrCreateNextNode(
        parentGroup: RowNode,
        groupInfo: GroupInfo,
        level: number,
        details: GroupingDetails
    ): RowNode {
        const key = this.getChildrenMappedKey(groupInfo.key, groupInfo.rowGroupColumn);
        let nextNode = parentGroup?.childrenMapped?.[key];

        if (!nextNode) {
            nextNode = this.createGroup(groupInfo, parentGroup, level, details);
            // attach the new group to the parent
            this.addToParent(nextNode, parentGroup);
        }

        return nextNode;
    }

    private createGroup(groupInfo: GroupInfo, parent: RowNode, level: number, details: GroupingDetails): RowNode {
        const groupNode: GroupRow = new RowNode(this.beans);

        groupNode.group = true;
        groupNode.field = groupInfo.field;
        groupNode.rowGroupColumn = groupInfo.rowGroupColumn;

        this.setGroupData(groupNode, groupInfo);

        groupNode.key = groupInfo.key;
        groupNode.id = this.createGroupId(groupNode, parent, level);

        groupNode.level = level;
        groupNode.leafGroup = level === details.groupedColCount - 1;

        groupNode.allLeafChildren = [];

        // why is this done here? we are not updating the children count as we go,
        // i suspect this is updated in the filter stage
        groupNode.setAllChildrenCount(0);

        groupNode.rowGroupIndex = level;

        groupNode.childrenAfterGroup = [];
        groupNode.childrenMapped = {};
        groupNode.updateHasChildren();

        groupNode.parent = parent;

        this.setExpandedInitialValue(details, groupNode);

        return groupNode;
    }

    private createGroupId(node: RowNode, parent: RowNode, level: number): string {
        const createGroupId: (node: RowNode, parent: RowNode | null, level: number) => string | null = (
            node,
            parent
        ) => {
            if (!node.rowGroupColumn) {
                return null;
            } // root node
            const parentId = parent ? createGroupId(parent, parent.parent, 0) : null;
            return `${parentId == null ? '' : parentId + '-'}${node.rowGroupColumn.getColId()}-${node.key}`;
        };

        // we put 'row-group-' before the group id, so it doesn't clash with standard row id's. we also use 't-' and 'b-'
        // for top pinned and bottom pinned rows.
        return _ROW_ID_PREFIX_ROW_GROUP + createGroupId(node, parent, level);
    }

    private setGroupData(groupNode: RowNode, groupInfo: GroupInfo): void {
        groupNode.groupData = {};
        const groupDisplayCols = this.showRowGroupColsService.getShowRowGroupCols();
        groupDisplayCols.forEach((col) => {
            // newGroup.rowGroupColumn=null when working off GroupInfo, and we always display the group in the group column
            // if rowGroupColumn is present, then it's grid row grouping and we only include if configuration says so

            const groupColumn = groupNode.rowGroupColumn;
            const isRowGroupDisplayed = groupColumn !== null && col.isRowGroupDisplayed(groupColumn.getId());
            if (isRowGroupDisplayed) {
                // if maintain group value type, get the value from any leaf node.
                groupNode.groupData![col.getColId()] = this.valueService.getValue(groupColumn, groupInfo.leafNode);
            }
        });
    }

    private getChildrenMappedKey(key: string, rowGroupColumn: AgColumn | null): string {
        // grouping by columns
        return rowGroupColumn ? rowGroupColumn.getId() + '-' + key : key;
    }

    private setExpandedInitialValue(details: GroupingDetails, groupNode: RowNode): void {
        // if pivoting the leaf group is never expanded as we do not show leaf rows
        if (details.pivotMode && groupNode.leafGroup) {
            groupNode.expanded = false;
            return;
        }

        // use callback if exists
        const userCallback = details.isGroupOpenByDefault;
        if (userCallback) {
            const params: WithoutGridCommon<IsGroupOpenByDefaultParams> = {
                rowNode: groupNode,
                field: groupNode.field!,
                key: groupNode.key!,
                level: groupNode.level,
                rowGroupColumn: groupNode.rowGroupColumn!,
            };
            groupNode.expanded = userCallback(params) == true;
            return;
        }

        // use expandByDefault if exists
        if (details.expandByDefault === -1) {
            groupNode.expanded = true;
            return;
        }

        // otherwise
        groupNode.expanded = groupNode.level < details.expandByDefault;
    }

    private getGroupInfo(rowNode: RowNode, details: GroupingDetails): GroupInfo[] {
        const res: GroupInfo[] = [];
        details.groupedCols.forEach((groupCol) => {
            let key: string = this.valueService.getKeyForNode(groupCol, rowNode);
            let keyExists = key !== null && key !== undefined && key !== '';

            // unbalanced tree and pivot mode don't work together - not because of the grid, it doesn't make
            // mathematical sense as you are building up a cube. so if pivot mode, we put in a blank key where missing.
            // this keeps the tree balanced and hence can be represented as a group.
            const createGroupForEmpty = details.pivotMode || !details.groupAllowUnbalanced;
            if (createGroupForEmpty && !keyExists) {
                key = '';
                keyExists = true;
            }

            if (keyExists) {
                const item = {
                    key: key,
                    field: groupCol.getColDef().field,
                    rowGroupColumn: groupCol,
                    leafNode: rowNode,
                } as GroupInfo;
                res.push(item);
            }
        });
        return res;
    }
}
