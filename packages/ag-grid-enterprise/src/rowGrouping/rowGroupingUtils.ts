import type {
    AgColumn,
    BeanCollection,
    ColumnModel,
    FuncColsService,
    GridOptionsService,
    RowNode,
} from 'ag-grid-community';

export function isRowGroupColLocked(
    funcColsService: FuncColsService,
    gos: GridOptionsService,
    column: AgColumn
): boolean {
    const groupLockGroupColumns = gos.get('groupLockGroupColumns');
    if (!column.isRowGroupActive() || groupLockGroupColumns === 0) {
        return false;
    }

    if (groupLockGroupColumns === -1) {
        return true;
    }

    const rowGroupCols = funcColsService.rowGroupCols;
    const colIndex = rowGroupCols.findIndex((groupCol) => groupCol.getColId() === column.getColId());
    return groupLockGroupColumns > colIndex;
}

export function setRowNodeGroupValue(
    rowNode: RowNode,
    columnModel: ColumnModel,
    colKey: string | AgColumn,
    newValue: any
): void {
    const column = columnModel.getCol(colKey)!;

    if (!rowNode.groupData) {
        rowNode.groupData = {};
    }

    const columnId = column.getColId();
    const oldValue = rowNode.groupData[columnId];

    if (oldValue === newValue) {
        return;
    }

    rowNode.groupData[columnId] = newValue;
    rowNode.dispatchCellChangedEvent(column, newValue, oldValue);
}

export function setRowNodeGroup(rowNode: RowNode, beans: BeanCollection, group: boolean): void {
    if (rowNode.group === group) {
        return;
    }

    // if we used to be a group, and no longer, then close the node
    if (rowNode.group && !group) {
        rowNode.expanded = false;
    }

    rowNode.group = group;
    rowNode.updateHasChildren();
    beans.selectionService?.checkRowSelectable(rowNode);
    rowNode.dispatchRowEvent('groupChanged');
}
