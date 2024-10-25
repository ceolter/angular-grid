import type {
    AgColumn,
    BeanCollection,
    ColumnEventType,
    ColumnModel,
    ColumnState,
    ColumnStateService,
    IAggFunc,
    IAggFuncService,
    NamedBean,
} from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

import type { ColumnModelItem } from './columnModelItem';

export class ModelItemUtils extends BeanStub implements NamedBean {
    beanName = 'modelItemUtils' as const;

    private aggFuncSvc?: IAggFuncService;
    private colModel: ColumnModel;
    private colState: ColumnStateService;

    public wireBeans(beans: BeanCollection) {
        this.aggFuncSvc = beans.aggFuncSvc;
        this.colModel = beans.colModel;
        this.colState = beans.colState;
    }

    public selectAllChildren(colTree: ColumnModelItem[], selectAllChecked: boolean, eventType: ColumnEventType): void {
        const cols = this.extractAllLeafColumns(colTree);
        this.setAllColumns(cols, selectAllChecked, eventType);
    }

    public setColumn(col: AgColumn, selectAllChecked: boolean, eventType: ColumnEventType): void {
        this.setAllColumns([col], selectAllChecked, eventType);
    }

    public setAllColumns(cols: AgColumn[], selectAllChecked: boolean, eventType: ColumnEventType): void {
        if (this.colModel.isPivotMode()) {
            this.setAllPivot(cols, selectAllChecked, eventType);
        } else {
            this.setAllVisible(cols, selectAllChecked, eventType);
        }
    }

    private extractAllLeafColumns(allItems: ColumnModelItem[]): AgColumn[] {
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

    private setAllVisible(columns: AgColumn[], visible: boolean, eventType: ColumnEventType): void {
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
            this.colState.applyColumnState({ state: colStateItems }, eventType);
        }
    }

    private setAllPivot(columns: AgColumn[], value: boolean, eventType: ColumnEventType): void {
        this.setAllPivotActive(columns, value, eventType);
    }

    private setAllPivotActive(columns: AgColumn[], value: boolean, eventType: ColumnEventType): void {
        const colStateItems: ColumnState[] = [];

        const turnOnAction = (col: AgColumn) => {
            // don't change any column that's already got a function active
            if (col.isAnyFunctionActive()) {
                return;
            }

            if (col.isAllowValue()) {
                const aggFunc =
                    typeof col.getAggFunc() === 'string' ? col.getAggFunc() : this.aggFuncSvc?.getDefaultAggFunc(col);
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
            this.colState.applyColumnState({ state: colStateItems }, eventType);
        }
    }

    public updateColumns(params: {
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
    }): void {
        const { columns, visibleState, pivotState, eventType } = params;
        const state: ColumnState[] = columns.map((column) => {
            const colId = column.getColId();
            if (this.colModel.isPivotMode()) {
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
        this.colState.applyColumnState({ state }, eventType);
    }

    public createPivotState(column: AgColumn): {
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
}
