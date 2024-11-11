import type { AgColumn, BeanCollection, ColumnEventType, ColumnState, IAggFunc } from 'ag-grid-community';
import { _applyColumnState } from 'ag-grid-community';

import type { ColumnModelItem } from './columnModelItem';

export function selectAllChildren(
    beans: BeanCollection,
    colTree: ColumnModelItem[],
    selectAllChecked: boolean,
    eventType: ColumnEventType
): void {
    const cols = extractAllLeafColumns(colTree);
    setAllColumns(beans, cols, selectAllChecked, eventType);
}

export function setAllColumns(
    beans: BeanCollection,
    cols: AgColumn[],
    selectAllChecked: boolean,
    eventType: ColumnEventType
): void {
    if (beans.colModel.isPivotMode()) {
        setAllPivot(beans, cols, selectAllChecked, eventType);
    } else {
        setAllVisible(beans, cols, selectAllChecked, eventType);
    }
}

function extractAllLeafColumns(allItems: ColumnModelItem[]): AgColumn[] {
    const res: AgColumn[] = [];

    const recursiveFunc = (items: ColumnModelItem[]) => {
        items.forEach((item) => {
            if (!item.isPassesFilter()) {
                return;
            }
            if (item.isGroup()) {
                recursiveFunc(item.getChildren());
            } else {
                res.push(item.getColumn());
            }
        });
    };

    recursiveFunc(allItems);

    return res;
}

function setAllVisible(beans: BeanCollection, columns: AgColumn[], visible: boolean, eventType: ColumnEventType): void {
    const colStateItems: ColumnState[] = [];

    columns.forEach((col) => {
        if (col.getColDef().lockVisible) {
            return;
        }
        if (col.isVisible() != visible) {
            colStateItems.push({
                colId: col.getId(),
                hide: !visible,
            });
        }
    });

    if (colStateItems.length > 0) {
        _applyColumnState(beans, { state: colStateItems }, eventType);
    }
}

function setAllPivot(beans: BeanCollection, columns: AgColumn[], value: boolean, eventType: ColumnEventType): void {
    setAllPivotActive(beans, columns, value, eventType);
}

function setAllPivotActive(
    beans: BeanCollection,
    columns: AgColumn[],
    value: boolean,
    eventType: ColumnEventType
): void {
    const colStateItems: ColumnState[] = [];

    const turnOnAction = (col: AgColumn) => {
        // don't change any column that's already got a function active
        if (col.isAnyFunctionActive()) {
            return;
        }

        if (col.isAllowValue()) {
            const aggFunc =
                typeof col.getAggFunc() === 'string' ? col.getAggFunc() : beans.aggFuncSvc?.getDefaultAggFunc(col);
            colStateItems.push({
                colId: col.getId(),
                aggFunc: aggFunc,
            });
        } else if (col.isAllowRowGroup()) {
            colStateItems.push({
                colId: col.getId(),
                rowGroup: true,
            });
        } else if (col.isAllowPivot()) {
            colStateItems.push({
                colId: col.getId(),
                pivot: true,
            });
        }
    };

    const turnOffAction = (col: AgColumn) => {
        const isActive = col.isPivotActive() || col.isRowGroupActive() || col.isValueActive();
        if (isActive) {
            colStateItems.push({
                colId: col.getId(),
                pivot: false,
                rowGroup: false,
                aggFunc: null,
            });
        }
    };

    const action = value ? turnOnAction : turnOffAction;

    columns.forEach(action);

    if (colStateItems.length > 0) {
        _applyColumnState(beans, { state: colStateItems }, eventType);
    }
}

export function updateColumns(
    beans: BeanCollection,
    params: {
        columns: AgColumn[];
        visibleState?: { [key: string]: boolean };
        pivotState?: {
            [key: string]: {
                pivot?: boolean;
                rowGroup?: boolean;
                aggFunc?: string | IAggFunc | null;
            };
        };
        eventType: ColumnEventType;
    }
): void {
    const { columns, visibleState, pivotState, eventType } = params;
    const state: ColumnState[] = columns.map((column) => {
        const colId = column.getColId();
        if (beans.colModel.isPivotMode()) {
            const pivotStateForColumn = pivotState?.[colId];
            return {
                colId,
                pivot: pivotStateForColumn?.pivot,
                rowGroup: pivotStateForColumn?.rowGroup,
                aggFunc: pivotStateForColumn?.aggFunc,
            };
        } else {
            return {
                colId,
                hide: !visibleState?.[colId],
            };
        }
    });
    _applyColumnState(beans, { state }, eventType);
}

export function createPivotState(column: AgColumn): {
    pivot?: boolean;
    rowGroup?: boolean;
    aggFunc?: string | IAggFunc | null;
} {
    return {
        pivot: column.isPivotActive(),
        rowGroup: column.isRowGroupActive(),
        aggFunc: column.isValueActive() ? column.getAggFunc() : undefined,
    };
}
