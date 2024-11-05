import type { IRowNode } from 'ag-grid-community';

function getRowKey<TData = any>(row: IRowNode<TData> | null | undefined): string | null | undefined {
    return row ? row.key : undefined;
}

export function getRowSnapshot<TData = any>(row: IRowNode<TData>) {
    const {
        allChildrenCount,
        allLeafChildren,
        childIndex,
        childrenAfterFilter,
        childrenAfterGroup,
        childrenAfterSort,
        detail,
        displayed,
        expanded,
        firstChild,
        footer,
        group,
        groupData,
        id,
        key,
        lastChild,
        leafGroup,
        level,
        master,
        parent,
        rowGroupIndex,
        rowPinned,
        selectable,
        sibling,
        uiLevel,
        rowIndex,
    } = row;

    return {
        allChildrenCount: allChildrenCount as typeof allChildrenCount | undefined,
        allLeafChildren: allLeafChildren?.map(getRowKey),
        childIndex,
        childrenAfterFilter: childrenAfterFilter?.map(getRowKey),
        childrenAfterGroup: childrenAfterGroup?.map(getRowKey),
        childrenAfterSort: childrenAfterSort?.map(getRowKey),
        detail,
        displayed,
        expanded,
        firstChild,
        footer,
        group,
        groupData: groupData as typeof groupData | undefined,
        id,
        key,
        lastChild,
        leafGroup,
        level,
        master: master as typeof master | undefined,
        parentKey: getRowKey(parent),
        rowGroupIndex: rowGroupIndex as typeof rowGroupIndex | undefined,
        rowPinned,
        selectable,
        siblingKey: getRowKey(sibling),
        uiLevel,
        rowIndex,
    };
}

export function getRowsSnapshot(rows: IRowNode[]) {
    const result = rows.map(getRowSnapshot);
    return result;
}

export type RowSnapshot<TData = any> = ReturnType<typeof getRowSnapshot<TData>>;
