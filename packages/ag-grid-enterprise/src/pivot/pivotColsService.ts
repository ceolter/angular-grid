import type { AgColumn, ColDef, ColumnEventType, ColumnStateParams, IColsService, NamedBean } from 'ag-grid-community';
import { BaseColsService, _removeFromArray } from 'ag-grid-community';

export class PivotColsService extends BaseColsService implements NamedBean, IColsService {
    beanName = 'pivotColsService' as const;
    eventName = 'columnPivotChanged' as const;
    override columnProcessors = {
        set: (column: AgColumn, added: boolean, source: ColumnEventType) => column.setPivotActive(true, source),
        add: (column: AgColumn, added: boolean, source: ColumnEventType) => column.setPivotActive(true, source),
        remove: (column: AgColumn, added: boolean, source: ColumnEventType) => column.setPivotActive(false, source),
    } as const;

    override columnOrdering = {
        enableProp: 'pivot',
        initialEnableProp: 'initialPivot',
        indexProp: 'pivotIndex',
        initialIndexProp: 'initialPivotIndex',
    } as const;

    override columnExtractors = {
        setFlagFunc: (col: AgColumn, flag: boolean, source: ColumnEventType) => col.setPivotActive(flag, source),
        getIndexFunc: (colDef: ColDef) => colDef.pivotIndex,
        getInitialIndexFunc: (colDef: ColDef) => colDef.initialPivotIndex,
        getValueFunc: (colDef: ColDef) => colDef.pivot,
        getInitialValueFunc: (colDef: ColDef) => colDef.initialPivot,
    } as const;

    private modifyColumnsNoEventsCallbacks = {
        addCol: (column: AgColumn) => this.columns.push(column),
        removeCol: (column: AgColumn) => _removeFromArray(this.columns, column),
    };

    public syncColumnWithState(
        column: AgColumn,
        source: ColumnEventType,
        getValue: <U extends keyof ColumnStateParams, S extends keyof ColumnStateParams>(
            key1: U,
            key2?: S
        ) => { value1: ColumnStateParams[U] | undefined; value2: ColumnStateParams[S] | undefined },
        rowIndex: { [key: string]: number } | null
    ): void {
        const { value1: pivot, value2: pivotIndex } = getValue('pivot', 'pivotIndex');
        if (pivot !== undefined || pivotIndex !== undefined) {
            if (typeof pivotIndex === 'number' || pivot) {
                if (!column.isPivotActive()) {
                    column.setPivotActive(true, source);
                    this.modifyColumnsNoEventsCallbacks.addCol(column);
                }
                if (rowIndex && typeof pivotIndex === 'number') {
                    rowIndex[column.getId()] = pivotIndex;
                }
            } else {
                if (column.isPivotActive()) {
                    column.setPivotActive(false, source);
                    this.modifyColumnsNoEventsCallbacks.removeCol(column);
                }
            }
        }
    }
}
