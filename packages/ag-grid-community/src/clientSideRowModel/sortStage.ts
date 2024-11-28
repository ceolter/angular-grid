import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { GridOptions } from '../entities/gridOptions';
import type { RowNode } from '../entities/rowNode';
import { _isColumnsSortingCoupledToGroup } from '../gridOptionsUtils';
import type { PostSortRowsParams } from '../interfaces/iCallbackParams';
import type { ClientSideRowModelStage } from '../interfaces/iClientSideRowModel';
import type { WithoutGridCommon } from '../interfaces/iCommon';
import type { IRowNodeStage } from '../interfaces/iRowNodeStage';
import type { SortOption } from '../interfaces/iSortOption';
import type { RowNodeSorter, SortedRowNode } from '../sort/rowNodeSorter';
import { _exists, _missing } from '../utils/generic';
import type { RefreshModelState } from './refreshModelState';

export function updateRowNodeAfterSort(rowNode: RowNode): void {
    if (rowNode.sibling) {
        rowNode.sibling.childrenAfterSort = rowNode.childrenAfterSort;
    }

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

export class SortStage extends BeanStub implements NamedBean, IRowNodeStage {
    beanName = 'sortStage' as const;

    public refreshProps: Set<keyof GridOptions<any>> = new Set(['postSortRows', 'groupDisplayType', 'accentedSort']);
    public step: ClientSideRowModelStage = 'sort';

    public execute(state: RefreshModelState): void {
        const beans = this.beans;
        const { gos, sortSvc, colModel, rowGroupColsSvc, groupHideOpenParentsSvc, rowNodeSorter } = beans;
        const sortOptions: SortOption[] = sortSvc!.getSortOptions();

        const sortActive = _exists(sortOptions) && sortOptions.length > 0;

        const sortContainsGroupColumns = sortOptions.some(({ column }) => {
            const isSortingCoupled = _isColumnsSortingCoupledToGroup(beans.gos);
            if (isSortingCoupled) {
                return column.isPrimary() && column.isRowGroupActive();
            }
            return !!column.getColDef().showRowGroup;
        });

        const deltaSort =
            sortActive &&
            state.changedPath.active &&
            // in time we can remove this check, so that delta sort is always
            // on delta update (transactions or immutable data). it's off for now so that we can
            // selectively turn it on and test it with some select users before
            // rolling out to everyone.
            this.gos.get('deltaSort');

        const groupMaintainOrder = gos.get('groupMaintainOrder');
        const groupColumnsPresent = colModel.getCols().some((c) => c.isRowGroupActive());

        const isPivotMode = colModel.isPivotMode();
        const postSortFunc = gos.getCallback('postSortRows');

        const callback = (rowNode: RowNode) => {
            // we clear out the 'pull down open parents' first, as the values mix up the sorting
            groupHideOpenParentsSvc?.pullDownGroupDataForHideOpenParents(rowNode.childrenAfterAggFilter, true);

            // It's pointless to sort rows which aren't being displayed. in pivot mode we don't need to sort the leaf group children.
            const skipSortingPivotLeafs = isPivotMode && rowNode.leafGroup;

            // Javascript sort is non deterministic when all the array items are equals, ie Comparator always returns 0,
            // so to ensure the array keeps its order, add an additional sorting condition manually, in this case we
            // are going to inspect the original array position. This is what sortedRowNodes is for.
            const skipSortingGroups =
                groupMaintainOrder && groupColumnsPresent && !rowNode.leafGroup && !sortContainsGroupColumns;
            let newChildrenAfterSort: RowNode[];
            if (skipSortingGroups) {
                const nextGroup = rowGroupColsSvc?.columns?.[rowNode.level + 1];
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
                newChildrenAfterSort = childrenToBeSorted;
            } else if (!sortActive || skipSortingPivotLeafs) {
                // if there's no sort to make, skip this step
                newChildrenAfterSort = rowNode.childrenAfterAggFilter!.slice(0);
            } else if (deltaSort) {
                newChildrenAfterSort = doDeltaSort(rowNodeSorter!, rowNode, state, sortOptions);
            } else {
                newChildrenAfterSort = rowNodeSorter!.doFullSort(rowNode.childrenAfterAggFilter!, sortOptions);
            }
            rowNode.childrenAfterSort = newChildrenAfterSort;

            updateRowNodeAfterSort(rowNode);

            if (postSortFunc) {
                const params: WithoutGridCommon<PostSortRowsParams> = { nodes: rowNode.childrenAfterSort };
                postSortFunc(params);
            }
        };

        state.changedPath.forEachChangedNodeDepthFirst(callback);
    }
}

function doDeltaSort(
    rowNodeSorter: RowNodeSorter,
    rowNode: RowNode,
    state: RefreshModelState,
    sortOptions: SortOption[]
): RowNode[] {
    const unsortedRows = rowNode.childrenAfterAggFilter!;
    const oldSortedRows = rowNode.childrenAfterSort;
    if (!oldSortedRows) {
        return rowNodeSorter.doFullSort(unsortedRows, sortOptions);
    }

    const untouchedRows = new Set<string>();
    const touchedRows: SortedRowNode[] = [];

    const updates = state.updates;
    const changedPath = state.changedPath;
    for (let i = 0, len = unsortedRows.length; i < len; ++i) {
        const row = unsortedRows[i];
        if (updates.has(row) || !changedPath.canSkip(row)) {
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

    touchedRows.sort((a, b) => rowNodeSorter.compareRowNodes(sortOptions, a, b));

    return mergeSortedArrays(rowNodeSorter, sortOptions, touchedRows, sortedUntouchedRows);
}

// Merge two sorted arrays into each other
function mergeSortedArrays(
    rowNodeSorter: RowNodeSorter,
    sortOptions: SortOption[],
    arr1: SortedRowNode[],
    arr2: SortedRowNode[]
): RowNode[] {
    const res: RowNode[] = [];
    let i = 0;
    let j = 0;
    const arr1Length = arr1.length;
    const arr2Length = arr2.length;

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
