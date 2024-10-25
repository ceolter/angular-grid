import type {
    AgColumn,
    ColDef,
    ColKey,
    ColumnEventType,
    ColumnStateParams,
    IAggFunc,
    IColsService,
    NamedBean,
} from 'ag-grid-community';
import { BaseColsService, _exists, _removeFromArray, _warn } from 'ag-grid-community';

export class ValueColsSvc extends BaseColsService implements NamedBean, IColsService {
    beanName = 'valueColsSvc' as const;
    eventName = 'columnValueChanged' as const;

    override columnProcessors = {
        set: (column: AgColumn, added: boolean, source: ColumnEventType) => this.setValueActive(added, column, source),
        add: (column: AgColumn, added: boolean, source: ColumnEventType) => this.setValueActive(true, column, source),
        remove: (column: AgColumn, added: boolean, source: ColumnEventType) =>
            this.setValueActive(false, column, source),
    } as const;

    override columnExtractors = {
        setFlagFunc: (col: AgColumn, flag: boolean, source: ColumnEventType) => col.setValueActive(flag, source),
        getIndexFunc: () => undefined,
        getInitialIndexFunc: () => undefined,
        getValueFunc: (colDef: ColDef) => {
            const aggFunc = colDef.aggFunc;
            // null or empty string means clear
            if (aggFunc === null || aggFunc === '') {
                return null;
            }
            if (aggFunc === undefined) {
                return;
            }

            return !!aggFunc;
        },
        getInitialValueFunc: (colDef: ColDef) => {
            // return false if any of the following: null, undefined, empty string
            return colDef.initialAggFunc != null && colDef.initialAggFunc != '';
        },
    } as const;

    private modifyColumnsNoEventsCallbacks = {
        addCol: (column: AgColumn) => this.columns.push(column),
        removeCol: (column: AgColumn) => _removeFromArray(this.columns, column),
    };

    public override extractCols(source: ColumnEventType, oldProvidedCols: AgColumn[] | undefined): AgColumn[] {
        this.columns = super.extractCols(source, oldProvidedCols);

        // all new columns added will have aggFunc missing, so set it to what is in the colDef
        this.columns.forEach((col) => {
            const colDef = col.getColDef();
            // if aggFunc provided, we always override, as reactive property
            if (colDef.aggFunc != null && colDef.aggFunc != '') {
                col.setAggFunc(colDef.aggFunc);
            } else {
                // otherwise we use initialAggFunc only if no agg func set - which happens when new column only
                if (!col.getAggFunc()) {
                    col.setAggFunc(colDef.initialAggFunc);
                }
            }
        });

        return this.columns;
    }

    public setColumnAggFunc(
        key: ColKey | undefined,
        aggFunc: string | IAggFunc | null | undefined,
        source: ColumnEventType
    ): void {
        if (!key) {
            return;
        }

        const column = this.colModel.getColDefCol(key);
        if (!column) {
            return;
        }

        column.setAggFunc(aggFunc);

        this.dispatchColumnChangedEvent(this.eventSvc, this.eventName, [column], source);
    }

    public override syncColumnWithState(
        column: AgColumn,
        source: ColumnEventType,
        getValue: <U extends keyof ColumnStateParams, S extends keyof ColumnStateParams>(
            key1: U,
            key2?: S
        ) => { value1: ColumnStateParams[U] | undefined; value2: ColumnStateParams[S] | undefined }
    ): void {
        // noop
        const aggFunc = getValue('aggFunc').value1;
        if (aggFunc !== undefined) {
            if (typeof aggFunc === 'string') {
                column.setAggFunc(aggFunc);
                if (!column.isValueActive()) {
                    column.setValueActive(true, source);
                    this.modifyColumnsNoEventsCallbacks.addCol(column);
                }
            } else {
                if (_exists(aggFunc)) {
                    // stateItem.aggFunc must be a string
                    _warn(33);
                }
                // Note: we do not call column.setAggFunc(null), so that next time we aggregate
                // by this column (eg drag the column to the agg section int he toolpanel) it will
                // default to the last aggregation function.

                if (column.isValueActive()) {
                    column.setValueActive(false, source);
                    this.modifyColumnsNoEventsCallbacks.removeCol(column);
                }
            }
        }
    }

    private setValueActive(active: boolean, column: AgColumn, source: ColumnEventType): void {
        if (active === column.isValueActive()) {
            return;
        }

        column.setValueActive(active, source);

        if (active && !column.getAggFunc() && this.aggFuncSvc) {
            const initialAggFunc = this.aggFuncSvc.getDefaultAggFunc(column);
            column.setAggFunc(initialAggFunc);
        }
    }
}
