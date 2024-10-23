import type {
    AgColumn,
    BeanCollection,
    ColDef,
    ColKey,
    ColumnEventType,
    ColumnStateParams,
    IAggFunc,
    IColsService,
    NamedBean,
} from 'ag-grid-community';
import { BaseColsService, _exists, _removeFromArray, _warn } from 'ag-grid-community';

export class ValueColsService extends BaseColsService implements NamedBean, IColsService {
    beanName = 'valueColsService' as const;

    public override wireBeans(beans: BeanCollection): void {
        this.columnModel = beans.columnModel;
        this.aggFuncService = beans.aggFuncService;
        this.visibleColsService = beans.visibleColsService;
    }

    private modifyColumnsNoEventsCallbacks = {
        addCol: (column: AgColumn) => this.columns.push(column),
        removeCol: (column: AgColumn) => _removeFromArray(this.columns, column),
    };

    public postConstruct(): void {
        this.columnProcessors = {
            set: (column: AgColumn, added: boolean, source: ColumnEventType) =>
                this.setValueActive(added, column, source),
            add: (column: AgColumn, added: boolean, source: ColumnEventType) =>
                this.setValueActive(true, column, source),
            remove: (column: AgColumn, added: boolean, source: ColumnEventType) =>
                this.setValueActive(false, column, source),
        };
    }

    protected override getEventName(): 'columnValueChanged' {
        return 'columnValueChanged';
    }

    public override extractCols(source: ColumnEventType, oldProvidedCols: AgColumn[] | undefined): void {
        this.columns = this.extractColumnsCommon(
            oldProvidedCols,
            this.columns,
            (col, flag) => col.setValueActive(flag, source),
            // aggFunc doesn't have index variant, cos order of value cols doesn't matter, so always return null
            () => undefined,
            () => undefined,
            // aggFunc is a string, so return it's existence
            (colDef: ColDef) => {
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
            (colDef: ColDef) => {
                // return false if any of the following: null, undefined, empty string
                return colDef.initialAggFunc != null && colDef.initialAggFunc != '';
            }
        );

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
    }

    public setColumnAggFunc(key: ColKey, aggFunc: string | IAggFunc | null | undefined, source: ColumnEventType): void {
        if (!key) {
            return;
        }

        const column = this.columnModel.getColDefCol(key);
        if (!column) {
            return;
        }

        column.setAggFunc(aggFunc);

        this.dispatchColumnChangedEvent(this.eventService, this.getEventName(), [column], source);
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

        if (active && !column.getAggFunc() && this.aggFuncService) {
            const initialAggFunc = this.aggFuncService.getDefaultAggFunc(column);
            column.setAggFunc(initialAggFunc);
        }
    }
}
