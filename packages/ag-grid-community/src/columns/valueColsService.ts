import { _exists, _logWarn } from 'ag-grid-community';
import type { AgColumn, BeanCollection, ColDef, ColumnStateParams, IAggFunc } from 'ag-grid-community';

import type { NamedBean } from '../context/bean';
import type { ColumnEventType } from '../events';
import { _removeFromArray } from '../utils/array';
import { BaseColsService } from './baseColsService';
import type { ColumnOrderState, ColumnServiceEventName } from './baseColsService';
import { dispatchColumnChangedEvent } from './columnEventUtils';
import type { ColKey, Maybe } from './columnModel';
import type { ModifyColumnsNoEventsCallback } from './columnStateService';
import type { GetValueFn } from './columnUtils';

export class ValueColsService extends BaseColsService implements NamedBean {
    beanName = 'valueColsService' as const;

    public override wireBeans(beans: BeanCollection): void {
        this.colModel = beans.columnModel;
        this.aggFuncSvc = beans.aggFuncService;
        this.visibleCols = beans.visibleColsService;
    }

    private modifyColumnsNoEventsCallbacks: ModifyColumnsNoEventsCallback = {
        addCol: (column) => this.columns.push(column),
        removeCol: (column) => _removeFromArray(this.columns, column),
    };

    protected override getEventName(): ColumnServiceEventName {
        return 'columnPivotChanged';
    }

    public override setColumns(colKeys: ColKey[], source: ColumnEventType): void {
        this._setColumns(colKeys, source, (added, column) => this.setValueActive(added, column, source));
    }

    public override addColumns(colKeys: ColKey[], source: ColumnEventType): void {
        this._addColumns(colKeys, source, (column) => this.setValueActive(true, column, source));
    }

    public override removeColumns(colKeys: ColKey[], source: ColumnEventType): void {
        this._removeColumns(colKeys, source, (column) => this.setValueActive(false, column, source));
    }

    public override extractCols(source: ColumnEventType, oldProvidedCols: AgColumn[] | undefined): void {
        this.columns = this._extractColsCommon(
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

    public setColumnAggFunc(
        key: Maybe<ColKey>,
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

        dispatchColumnChangedEvent(this.eventService, this.eventName, [column], source);
    }

    public override orderColumns(columnStateAccumulator: ColumnOrderState): ColumnOrderState {
        return columnStateAccumulator;
    }

    public override syncColumnWithState(
        column: AgColumn,
        source: ColumnEventType,
        getValue: GetValueFn<keyof ColumnStateParams, keyof ColumnStateParams>
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
                    _logWarn(33, {});
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
