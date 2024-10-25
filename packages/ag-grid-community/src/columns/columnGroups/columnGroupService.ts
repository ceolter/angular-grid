import type { NamedBean } from '../../context/bean';
import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { AgColumn } from '../../entities/agColumn';
import { createUniqueColumnGroupId, isColumnGroup } from '../../entities/agColumnGroup';
import { AgColumnGroup } from '../../entities/agColumnGroup';
import { AgProvidedColumnGroup } from '../../entities/agProvidedColumnGroup';
import { isProvidedColumnGroup } from '../../entities/agProvidedColumnGroup';
import type { ColDef, ColGroupDef } from '../../entities/colDef';
import type { ColumnEventType } from '../../events';
import type { ColumnPinnedType, HeaderColumnId } from '../../interfaces/iColumn';
import type { ColumnAnimationService } from '../../rendering/columnAnimationService';
import { _last } from '../../utils/array';
import { _exists } from '../../utils/generic';
import { depthFirstOriginalTreeSearch } from '../columnFactory';
import type { ColumnKeyCreator } from '../columnKeyCreator';
import type { ColumnModel } from '../columnModel';
import type { GroupInstanceIdCreator } from '../groupInstanceIdCreator';
import { depthFirstAllColumnTreeSearch } from '../visibleColsService';
import type { VisibleColsService } from '../visibleColsService';

export interface CreateGroupsParams {
    // all displayed columns sorted - this is the columns the grid should show
    columns: AgColumn[];
    // creates unique id's for the group
    idCreator: GroupInstanceIdCreator;
    // whether it's left, right or center col
    pinned: ColumnPinnedType;
    // we try to reuse old groups if we can, to allow gui to do animation
    oldDisplayedGroups?: (AgColumn | AgColumnGroup)[];
    // set `isStandaloneStructure` to true if this structure will not be used
    // by the grid UI. This is useful for export modules (gridSerializer).
    isStandaloneStructure?: boolean;
}

export class ColumnGroupService extends BeanStub implements NamedBean {
    beanName = 'columnGroupSvc' as const;

    private colModel: ColumnModel;
    private visibleCols: VisibleColsService;
    private colAnimation?: ColumnAnimationService;

    public wireBeans(beans: BeanCollection): void {
        this.colModel = beans.colModel;
        this.visibleCols = beans.visibleCols;
        this.colAnimation = beans.colAnimation;
    }

    public getColumnGroupState(): { groupId: string; open: boolean }[] {
        const columnGroupState: { groupId: string; open: boolean }[] = [];
        const gridBalancedTree = this.colModel.getColTree();

        depthFirstOriginalTreeSearch(null, gridBalancedTree, (node) => {
            if (isProvidedColumnGroup(node)) {
                columnGroupState.push({
                    groupId: node.getGroupId(),
                    open: node.isExpanded(),
                });
            }
        });

        return columnGroupState;
    }

    public resetColumnGroupState(source: ColumnEventType): void {
        const primaryColumnTree = this.colModel.getColDefColTree();
        if (!primaryColumnTree) {
            return;
        }

        const stateItems: { groupId: string; open: boolean | undefined }[] = [];

        depthFirstOriginalTreeSearch(null, primaryColumnTree, (child) => {
            if (isProvidedColumnGroup(child)) {
                const colGroupDef = child.getColGroupDef();
                const groupState = {
                    groupId: child.getGroupId(),
                    open: !colGroupDef ? undefined : colGroupDef.openByDefault,
                };
                stateItems.push(groupState);
            }
        });

        this.setColumnGroupState(stateItems, source);
    }

    public setColumnGroupState(
        stateItems: { groupId: string; open: boolean | undefined }[],
        source: ColumnEventType
    ): void {
        const gridBalancedTree = this.colModel.getColTree();
        if (!gridBalancedTree) {
            return;
        }

        this.colAnimation?.start();

        const impactedGroups: AgProvidedColumnGroup[] = [];

        stateItems.forEach((stateItem) => {
            const groupKey = stateItem.groupId;
            const newValue = stateItem.open;
            const providedColumnGroup = this.getProvidedColGroup(groupKey);

            if (!providedColumnGroup) {
                return;
            }
            if (providedColumnGroup.isExpanded() === newValue) {
                return;
            }

            providedColumnGroup.setExpanded(newValue);
            impactedGroups.push(providedColumnGroup);
        });

        this.visibleCols.refresh(source, true);

        if (impactedGroups.length) {
            this.eventSvc.dispatchEvent({
                type: 'columnGroupOpened',
                columnGroup: impactedGroups.length === 1 ? impactedGroups[0] : undefined,
                columnGroups: impactedGroups,
            });
        }

        this.colAnimation?.finish();
    }

    // called by headerRenderer - when a header is opened or closed
    public setColumnGroupOpened(
        key: AgProvidedColumnGroup | string | null,
        newValue: boolean,
        source: ColumnEventType
    ): void {
        let keyAsString: string;

        if (isProvidedColumnGroup(key)) {
            keyAsString = key.getId();
        } else {
            keyAsString = key || '';
        }
        this.setColumnGroupState([{ groupId: keyAsString, open: newValue }], source);
    }

    public getProvidedColGroup(key: string): AgProvidedColumnGroup | null {
        let res: AgProvidedColumnGroup | null = null;

        depthFirstOriginalTreeSearch(null, this.colModel.getColTree(), (node) => {
            if (isProvidedColumnGroup(node)) {
                if (node.getId() === key) {
                    res = node;
                }
            }
        });

        return res;
    }

    public getGroupAtDirection(columnGroup: AgColumnGroup, direction: 'After' | 'Before'): AgColumnGroup | null {
        // pick the last displayed column in this group
        const requiredLevel = columnGroup.getProvidedColumnGroup().getLevel() + columnGroup.getPaddingLevel();
        const colGroupLeafColumns = columnGroup.getDisplayedLeafColumns();
        const col: AgColumn | null = direction === 'After' ? _last(colGroupLeafColumns) : colGroupLeafColumns[0];
        const getDisplayColMethod: 'getColAfter' | 'getColBefore' = `getCol${direction}` as any;

        while (true) {
            // keep moving to the next col, until we get to another group
            const column = this.visibleCols[getDisplayColMethod](col);

            if (!column) {
                return null;
            }

            const groupPointer = this.getColGroupAtLevel(column, requiredLevel);

            if (groupPointer !== columnGroup) {
                return groupPointer;
            }
        }
    }

    public getColGroupAtLevel(column: AgColumn, level: number): AgColumnGroup | null {
        // get group at same level as the one we are looking for
        let groupPointer: AgColumnGroup = column.getParent()!;
        let originalGroupLevel: number;
        let groupPointerLevel: number;

        while (true) {
            const groupPointerProvidedColumnGroup = groupPointer.getProvidedColumnGroup();
            originalGroupLevel = groupPointerProvidedColumnGroup.getLevel();
            groupPointerLevel = groupPointer.getPaddingLevel();

            if (originalGroupLevel + groupPointerLevel <= level) {
                break;
            }
            groupPointer = groupPointer.getParent()!;
        }

        return groupPointer;
    }

    public updateOpenClosedVisibility(): void {
        const allColumnGroups = this.visibleCols.getAllTrees();

        depthFirstAllColumnTreeSearch(allColumnGroups, false, (child) => {
            if (isColumnGroup(child)) {
                child.calculateDisplayedColumns();
            }
        });
    }

    // returns the group with matching colId and instanceId. If instanceId is missing,
    // matches only on the colId.
    public getColumnGroup(colId: string | AgColumnGroup, partId?: number): AgColumnGroup | null {
        if (!colId) {
            return null;
        }
        if (isColumnGroup(colId)) {
            return colId;
        }

        const allColumnGroups = this.visibleCols.getAllTrees();
        const checkPartId = typeof partId === 'number';
        let result: AgColumnGroup | null = null;

        depthFirstAllColumnTreeSearch(allColumnGroups, false, (child) => {
            if (isColumnGroup(child)) {
                const columnGroup = child;
                let matched: boolean;

                if (checkPartId) {
                    matched = colId === columnGroup.getGroupId() && partId === columnGroup.getPartId();
                } else {
                    matched = colId === columnGroup.getGroupId();
                }

                if (matched) {
                    result = columnGroup;
                }
            }
        });

        return result;
    }

    public createColumnGroups(params: CreateGroupsParams): (AgColumn | AgColumnGroup)[] {
        const { columns, idCreator, pinned, oldDisplayedGroups, isStandaloneStructure } = params;
        const oldColumnsMapped = this.mapOldGroupsById(oldDisplayedGroups!);

        /**
         * The following logic starts at the leaf level of columns, iterating through them to build their parent
         * groups when the parents match.
         *
         * The created groups are then added to an array, and similarly iterated on until we reach the top level.
         *
         * When row groups have no original parent, it's added to the result.
         */
        const topLevelResultCols: (AgColumn | AgColumnGroup)[] = [];

        // this is an array of cols or col groups at one level of depth, starting from leaf and ending at root
        let groupsOrColsAtCurrentLevel: (AgColumn | AgColumnGroup)[] = columns as AgColumn[];
        while (groupsOrColsAtCurrentLevel.length) {
            // store what's currently iterating so the function can build the next level of col groups
            const currentlyIterating = groupsOrColsAtCurrentLevel;
            groupsOrColsAtCurrentLevel = [];

            // store the index of the last row which was different from the previous row, this is used as a slice
            // index for finding the children to group together
            let lastGroupedColIdx = 0;

            // create a group of children from lastGroupedColIdx to the provided `to` parameter
            const createGroupToIndex = (to: number) => {
                const from = lastGroupedColIdx;
                lastGroupedColIdx = to;

                const previousNode = currentlyIterating[from];
                const previousNodeProvided = isColumnGroup(previousNode)
                    ? previousNode.getProvidedColumnGroup()
                    : previousNode;
                const previousNodeParent = previousNodeProvided.getOriginalParent() as AgProvidedColumnGroup | null;

                if (previousNodeParent == null) {
                    // if the last node was different, and had a null parent, then we add all the nodes to the final
                    // results)
                    for (let i = from; i < to; i++) {
                        topLevelResultCols.push(currentlyIterating[i]);
                    }
                    return;
                }

                // the parent differs from the previous node, so we create a group from the previous node
                // and add all to the result array, except the current node.
                const newGroup = this.createColumnGroup(
                    previousNodeParent,
                    idCreator,
                    oldColumnsMapped,
                    pinned,
                    isStandaloneStructure
                );

                for (let i = from; i < to; i++) {
                    newGroup.addChild(currentlyIterating[i]);
                }
                groupsOrColsAtCurrentLevel.push(newGroup);
            };

            for (let i = 1; i < currentlyIterating.length; i++) {
                const thisNode = currentlyIterating[i];
                const thisNodeProvided = isColumnGroup(thisNode) ? thisNode.getProvidedColumnGroup() : thisNode;
                const thisNodeParent = thisNodeProvided.getOriginalParent();

                const previousNode = currentlyIterating[lastGroupedColIdx];
                const previousNodeProvided = isColumnGroup(previousNode)
                    ? previousNode.getProvidedColumnGroup()
                    : previousNode;
                const previousNodeParent = previousNodeProvided.getOriginalParent();

                if (thisNodeParent !== previousNodeParent) {
                    createGroupToIndex(i);
                }
            }

            if (lastGroupedColIdx < currentlyIterating.length) {
                createGroupToIndex(currentlyIterating.length);
            }
        }

        if (!isStandaloneStructure) {
            this.setupParentsIntoCols(topLevelResultCols, null);
        }
        return topLevelResultCols;
    }

    public createProvidedColumnGroup(
        primaryColumns: boolean,
        colGroupDef: ColGroupDef,
        level: number,
        existingColumns: AgColumn[],
        columnKeyCreator: ColumnKeyCreator,
        existingGroups: AgProvidedColumnGroup[],
        source: ColumnEventType,
        recursivelyCreateColumns: (
            defs: (ColDef | ColGroupDef)[] | null,
            level: number,
            primaryColumns: boolean,
            existingColsCopy: AgColumn[],
            columnKeyCreator: ColumnKeyCreator,
            existingGroups: AgProvidedColumnGroup[],
            source: ColumnEventType
        ) => (AgColumn | AgProvidedColumnGroup)[]
    ): AgProvidedColumnGroup {
        const colGroupDefMerged = this.createMergedColGroupDef(colGroupDef);
        const groupId = columnKeyCreator.getUniqueKey(colGroupDefMerged.groupId || null, null);
        const providedGroup = new AgProvidedColumnGroup(colGroupDefMerged, groupId, false, level);
        this.createBean(providedGroup);
        const existingGroupAndIndex = this.findExistingGroup(colGroupDef, existingGroups);
        // make sure we remove, so if user provided duplicate id, then we don't have more than
        // one column instance for colDef with common id
        if (existingGroupAndIndex) {
            existingGroups.splice(existingGroupAndIndex.idx, 1);
        }

        const existingGroup = existingGroupAndIndex?.group;
        if (existingGroup) {
            providedGroup.setExpanded(existingGroup.isExpanded());
        }

        const children = recursivelyCreateColumns(
            colGroupDefMerged.children,
            level + 1,
            primaryColumns,
            existingColumns,
            columnKeyCreator,
            existingGroups,
            source
        );

        providedGroup.setChildren(children);

        return providedGroup;
    }

    public balanceColumnTree(
        unbalancedTree: (AgColumn | AgProvidedColumnGroup)[],
        currentDept: number,
        columnDept: number,
        columnKeyCreator: ColumnKeyCreator
    ): (AgColumn | AgProvidedColumnGroup)[] {
        const result: (AgColumn | AgProvidedColumnGroup)[] = [];

        // go through each child, for groups, recurse a level deeper,
        // for columns we need to pad
        for (let i = 0; i < unbalancedTree.length; i++) {
            const child = unbalancedTree[i];
            if (isProvidedColumnGroup(child)) {
                // child is a group, all we do is go to the next level of recursion
                const originalGroup = child;
                const newChildren = this.balanceColumnTree(
                    originalGroup.getChildren(),
                    currentDept + 1,
                    columnDept,
                    columnKeyCreator
                );
                originalGroup.setChildren(newChildren);
                result.push(originalGroup);
            } else {
                // child is a column - so here we add in the padded column groups if needed
                let firstPaddedGroup: AgProvidedColumnGroup | undefined;
                let currentPaddedGroup: AgProvidedColumnGroup | undefined;

                // this for loop will NOT run any loops if no padded column groups are needed
                for (let j = columnDept - 1; j >= currentDept; j--) {
                    const newColId = columnKeyCreator.getUniqueKey(null, null);
                    const colGroupDefMerged = this.createMergedColGroupDef(null);

                    const paddedGroup = new AgProvidedColumnGroup(colGroupDefMerged, newColId, true, currentDept);
                    this.createBean(paddedGroup);

                    if (currentPaddedGroup) {
                        currentPaddedGroup.setChildren([paddedGroup]);
                    }

                    currentPaddedGroup = paddedGroup;

                    if (!firstPaddedGroup) {
                        firstPaddedGroup = currentPaddedGroup;
                    }
                }

                // likewise this if statement will not run if no padded groups
                if (firstPaddedGroup && currentPaddedGroup) {
                    result.push(firstPaddedGroup);
                    const hasGroups = unbalancedTree.some((leaf) => isProvidedColumnGroup(leaf));

                    if (hasGroups) {
                        currentPaddedGroup.setChildren([child]);
                        continue;
                    } else {
                        currentPaddedGroup.setChildren(unbalancedTree);
                        break;
                    }
                }

                result.push(child);
            }
        }

        return result;
    }

    public findDepth(balancedColumnTree: (AgColumn | AgProvidedColumnGroup)[]): number {
        let depth = 0;
        let pointer = balancedColumnTree;

        while (pointer && pointer[0] && isProvidedColumnGroup(pointer[0])) {
            depth++;
            pointer = (pointer[0] as AgProvidedColumnGroup).getChildren();
        }
        return depth;
    }

    public findMaxDepth(treeChildren: (AgColumn | AgProvidedColumnGroup)[], depth: number): number {
        let maxDeptThisLevel = depth;

        for (let i = 0; i < treeChildren.length; i++) {
            const abstractColumn = treeChildren[i];
            if (isProvidedColumnGroup(abstractColumn)) {
                const originalGroup = abstractColumn;
                const newDept = this.findMaxDepth(originalGroup.getChildren(), depth + 1);
                if (maxDeptThisLevel < newDept) {
                    maxDeptThisLevel = newDept;
                }
            }
        }

        return maxDeptThisLevel;
    }

    private createMergedColGroupDef(colGroupDef: ColGroupDef | null): ColGroupDef {
        const colGroupDefMerged: ColGroupDef = {} as ColGroupDef;
        Object.assign(colGroupDefMerged, this.gos.get('defaultColGroupDef'));
        Object.assign(colGroupDefMerged, colGroupDef);

        return colGroupDefMerged;
    }

    private findExistingGroup(
        newGroupDef: ColGroupDef,
        existingGroups: AgProvidedColumnGroup[]
    ): { idx: number; group: AgProvidedColumnGroup } | undefined {
        const newHasId = newGroupDef.groupId != null;
        if (!newHasId) {
            return undefined;
        }

        for (let i = 0; i < existingGroups.length; i++) {
            const existingGroup = existingGroups[i];
            const existingDef = existingGroup.getColGroupDef();
            if (!existingDef) {
                continue;
            }

            if (existingGroup.getId() === newGroupDef.groupId) {
                return { idx: i, group: existingGroup };
            }
        }
        return undefined;
    }

    private createColumnGroup(
        providedGroup: AgProvidedColumnGroup,
        groupInstanceIdCreator: GroupInstanceIdCreator,
        oldColumnsMapped: { [key: string]: AgColumnGroup },
        pinned: ColumnPinnedType,
        isStandaloneStructure?: boolean
    ): AgColumnGroup {
        const groupId = providedGroup.getGroupId();
        const instanceId = groupInstanceIdCreator.getInstanceIdForKey(groupId);
        const uniqueId = createUniqueColumnGroupId(groupId, instanceId);

        let columnGroup: AgColumnGroup | null = oldColumnsMapped[uniqueId];

        // if the user is setting new colDefs, it is possible that the id's overlap, and we
        // would have a false match from above. so we double check we are talking about the
        // same original column group.
        if (columnGroup && columnGroup.getProvidedColumnGroup() !== providedGroup) {
            columnGroup = null;
        }

        if (_exists(columnGroup)) {
            // clean out the old column group here, as we will be adding children into it again
            columnGroup.reset();
        } else {
            columnGroup = new AgColumnGroup(providedGroup, groupId, instanceId, pinned);
            if (!isStandaloneStructure) {
                this.createBean(columnGroup);
            }
        }

        return columnGroup;
    }

    // returns back a 2d map of ColumnGroup as follows: groupId -> instanceId -> ColumnGroup
    private mapOldGroupsById(displayedGroups: (AgColumn | AgColumnGroup)[]): {
        [uniqueId: string]: AgColumnGroup;
    } {
        const result: { [uniqueId: HeaderColumnId]: AgColumnGroup } = {};

        const recursive = (columnsOrGroups: (AgColumn | AgColumnGroup)[] | null) => {
            columnsOrGroups!.forEach((columnOrGroup) => {
                if (isColumnGroup(columnOrGroup)) {
                    const columnGroup = columnOrGroup;
                    result[columnOrGroup.getUniqueId()] = columnGroup;
                    recursive(columnGroup.getChildren());
                }
            });
        };

        if (displayedGroups) {
            recursive(displayedGroups);
        }

        return result;
    }

    private setupParentsIntoCols(
        columnsOrGroups: (AgColumn | AgColumnGroup)[] | null,
        parent: AgColumnGroup | null
    ): void {
        columnsOrGroups!.forEach((columnsOrGroup) => {
            columnsOrGroup.setParent(parent);
            if (isColumnGroup(columnsOrGroup)) {
                const columnGroup = columnsOrGroup;
                this.setupParentsIntoCols(columnGroup.getChildren(), columnGroup);
            }
        });
    }
}
