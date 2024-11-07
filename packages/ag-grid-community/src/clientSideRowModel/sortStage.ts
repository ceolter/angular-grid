import type { ColumnModel } from '../columns/columnModel';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { GridOptions } from '../entities/gridOptions';
import type { RowNode } from '../entities/rowNode';
import { _isColumnsSortingCoupledToGroup } from '../gridOptionsUtils';
import type { PostSortRowsParams } from '../interfaces/iCallbackParams';
import type { ClientSideRowModelStage, IChangedRowNodes } from '../interfaces/iClientSideRowModel';
import type { IColsService } from '../interfaces/iColsService';
import type { WithoutGridCommon } from '../interfaces/iCommon';
import type { IGroupHideOpenParentsService } from '../interfaces/iGroupHideOpenParentsService';
import type { IRowNode } from '../interfaces/iRowNode';
import type { IRowNodeStage, StageExecuteParams } from '../interfaces/iRowNodeStage';
import type { SortOption } from '../interfaces/iSortOption';
import type { RowNodeTransaction } from '../interfaces/rowNodeTransaction';
import type { RowNodeSorter, SortedRowNode } from '../sort/rowNodeSorter';
import type { SortService } from '../sort/sortService';
import type { ChangedPath } from '../utils/changedPath';
import { _exists, _missing } from '../utils/generic';

function updateChildIndexes(rowNode: RowNode): void {
    if (_missing(rowNode.childrenAfterSort)) {
        return;
    }

    const listToSort = rowNode.childrenAfterSort;
    for (let i = 0; i < listToSort.length; i++) {
        const child = listToSort[i];
        const firstChild = i === 0;
        const lastChild = i === rowNode.childrenAfterSort.length - 1;
        child.setFirstChild(firstChild);
        if (child.lastChild !== lastChild) {
            child.lastChild = lastChild;
            child.dispatchRowEvent('lastChildChanged');
        }
        if (child.childIndex !== i) {
            child.childIndex = i;
            child.dispatchRowEvent('childIndexChanged');
        }
    }
}

export function updateRowNodeAfterSort(rowNode: RowNode): void {
    if (rowNode.sibling) {
        rowNode.sibling.childrenAfterSort = rowNode.childrenAfterSort;
    }

    updateChildIndexes(rowNode);
}

export class SortStage extends BeanStub implements NamedBean, IRowNodeStage {
    beanName = 'sortStage' as const;

    public refreshProps: Set<keyof GridOptions<any>> = new Set(['postSortRows', 'groupDisplayType', 'accentedSort']);
    public step: ClientSideRowModelStage = 'sort';

    private sortSvc: SortService;
    private colModel: ColumnModel;
    private rowGroupColsSvc?: IColsService;
    private rowNodeSorter: RowNodeSorter;
    private groupHideOpenParentsSvc?: IGroupHideOpenParentsService;

    public wireBeans(beans: BeanCollection): void {
        this.sortSvc = beans.sortSvc!;
        this.colModel = beans.colModel;
        this.rowGroupColsSvc = beans.rowGroupColsSvc;
        this.rowNodeSorter = beans.rowNodeSorter!;
        this.groupHideOpenParentsSvc = beans.groupHideOpenParentsSvc;
    }

    public execute(params: StageExecuteParams): void {
        const sortOptions: SortOption[] = this.sortSvc.getSortOptions();

        const sortActive = _exists(sortOptions) && sortOptions.length > 0;
        const deltaSort =
            sortActive &&
            !!params.changedRowNodes &&
            // in time we can remove this check, so that delta sort is always
            // on if transactions are present. it's off for now so that we can
            // selectively turn it on and test it with some select users before
            // rolling out to everyone.
            this.gos.get('deltaSort');

        const sortContainsGroupColumns = sortOptions.some((opt) => {
            const isSortingCoupled = _isColumnsSortingCoupledToGroup(this.gos);
            if (isSortingCoupled) {
                return opt.column.isPrimary() && opt.column.isRowGroupActive();
            }
            return !!opt.column.getColDef().showRowGroup;
        });
        this.sort(
            sortOptions,
            sortActive,
            deltaSort,
            params.changedRowNodes,
            params.changedPath,
            sortContainsGroupColumns
        );
    }

    private sort(
        sortOptions: SortOption[],
        sortActive: boolean,
        useDeltaSort: boolean,
        changedRowNodes: IChangedRowNodes | undefined,
        changedPath: ChangedPath | undefined,
        sortContainsGroupColumns: boolean
    ): void {
        const groupMaintainOrder = this.gos.get('groupMaintainOrder');
        const groupColumnsPresent = this.colModel.getCols().some((c) => c.isRowGroupActive());

        const isPivotMode = this.colModel.isPivotMode();
        const postSortFunc = this.gos.getCallback('postSortRows');

        const callback = (rowNode: RowNode) => {
            // we clear out the 'pull down open parents' first, as the values mix up the sorting
            this.groupHideOpenParentsSvc?.pullDownGroupDataForHideOpenParents(rowNode.childrenAfterAggFilter, true);

            // It's pointless to sort rows which aren't being displayed. in pivot mode we don't need to sort the leaf group children.
            const skipSortingPivotLeafs = isPivotMode && rowNode.leafGroup;

            // Javascript sort is non deterministic when all the array items are equals, ie Comparator always returns 0,
            // so to ensure the array keeps its order, add an additional sorting condition manually, in this case we
            // are going to inspect the original array position. This is what sortedRowNodes is for.
            const skipSortingGroups =
                groupMaintainOrder && groupColumnsPresent && !rowNode.leafGroup && !sortContainsGroupColumns;
            if (skipSortingGroups) {
                const nextGroup = this.rowGroupColsSvc?.columns?.[rowNode.level + 1];
                // if the sort is null, then sort was explicitly removed, so remove sort from this group.
                const wasSortExplicitlyRemoved = nextGroup?.getSort() === null;

                const childrenToBeSorted = rowNode.childrenAfterAggFilter!.slice(0);
                if (rowNode.childrenAfterSort && !wasSortExplicitlyRemoved) {
                    const indexedOrders: { [key: string]: number } = {};
                    rowNode.childrenAfterSort.forEach((node, idx) => {
                        indexedOrders[node.id!] = idx;
                    });
                    childrenToBeSorted.sort(
                        (row1, row2) => (indexedOrders[row1.id!] ?? 0) - (indexedOrders[row2.id!] ?? 0)
                    );
                }
                rowNode.childrenAfterSort = childrenToBeSorted;
            } else if (!sortActive || skipSortingPivotLeafs) {
                // if there's no sort to make, skip this step
                rowNode.childrenAfterSort = rowNode.childrenAfterAggFilter!.slice(0);
            } else if (useDeltaSort && changedRowNodes) {
                rowNode.childrenAfterSort = this.doDeltaSort(rowNode, changedRowNodes, changedPath, sortOptions);
            } else {
                rowNode.childrenAfterSort = this.rowNodeSorter.doFullSort(rowNode.childrenAfterAggFilter!, sortOptions);
            }

            updateRowNodeAfterSort(rowNode);

            if (postSortFunc) {
                const params: WithoutGridCommon<PostSortRowsParams> = { nodes: rowNode.childrenAfterSort };
                postSortFunc(params);
            }
        };

        changedPath?.forEachChangedNodeDepthFirst(callback);
    }

    private calculateDirtyNodes(rowNodeTransactions?: RowNodeTransaction[] | null): { [nodeId: string]: true } {
        const dirtyNodes: { [nodeId: string]: true } = {};

        const addNodesFunc = (rowNodes: IRowNode[]) => {
            if (rowNodes) {
                rowNodes.forEach((rowNode) => (dirtyNodes[rowNode.id!] = true));
            }
        };

        // all leaf level nodes in the transaction were impacted
        if (rowNodeTransactions) {
            rowNodeTransactions.forEach((tran) => {
                addNodesFunc(tran.add);
                addNodesFunc(tran.update);
                addNodesFunc(tran.remove);
            });
        }

        return dirtyNodes;
    }

    private doDeltaSort(
        rowNode: RowNode,
        changedRowNodes: IChangedRowNodes,
        changedPath: ChangedPath | undefined,
        sortOptions: SortOption[]
    ): RowNode[] {
        const unsortedRows = rowNode.childrenAfterAggFilter!;
        const oldSortedRows = rowNode.childrenAfterSort;
        if (!oldSortedRows) {
            return this.rowNodeSorter.doFullSort(unsortedRows, sortOptions);
        }

        const untouchedRows = new Set<string>();
        const touchedRows: SortedRowNode[] = [];

        const updates = changedRowNodes.updates;
        for (let i = 0, len = unsortedRows.length; i < len; ++i) {
            const row = unsortedRows[i];
            if (updates.has(row) || (changedPath && !changedPath.canSkip(row))) {
                touchedRows.push({
                    currentPos: touchedRows.length,
                    rowNode: row,
                });
            } else {
                untouchedRows.add(row.id!);
            }
        }

        const sortedUntouchedRows = oldSortedRows
            .filter((child) => untouchedRows.has(child.id!))
            .map((rowNode: RowNode, currentPos: number): SortedRowNode => ({ currentPos, rowNode }));

        touchedRows.sort((a, b) => this.rowNodeSorter.compareRowNodes(sortOptions, a, b));

        return this.mergeSortedArrays(sortOptions, touchedRows, sortedUntouchedRows);
    }

    // Merge two sorted arrays into each other
    private mergeSortedArrays(sortOptions: SortOption[], arr1: SortedRowNode[], arr2: SortedRowNode[]): RowNode[] {
        const res: RowNode[] = [];
        let i = 0;
        let j = 0;
        const arr1Length = arr1.length;
        const arr2Length = arr2.length;
        const rowNodeSorter = this.rowNodeSorter;

        // Traverse both array, adding them in order
        while (i < arr1Length && j < arr2Length) {
            const a = arr1[i];
            const b = arr2[j];
            // Check if current element of first array is smaller than current element
            // of second array. If yes, store first array element and increment first array index.
            // Otherwise do same with second array
            const compareResult = rowNodeSorter.compareRowNodes(sortOptions, a, b);
            let chosen: SortedRowNode;
            if (compareResult < 0) {
                chosen = a;
                ++i;
            } else {
                chosen = b;
                ++j;
            }
            res.push(chosen.rowNode);
        }

        // add remaining from arr1
        while (i < arr1Length) {
            res.push(arr1[i++].rowNode);
        }

        // add remaining from arr2
        while (j < arr2Length) {
            res.push(arr2[j++].rowNode);
        }

        return res;
    }
}
