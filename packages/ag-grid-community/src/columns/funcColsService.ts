import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { ColDef, IAggFunc } from '../entities/colDef';
import type { ColumnEvent, ColumnEventType } from '../events';
import type { IAggFuncService } from '../interfaces/iAggFuncService';
import type { IColsService } from '../interfaces/iColsService';
import type { WithoutGridCommon } from '../interfaces/iCommon';
import { _removeFromArray } from '../utils/array';
import { _exists } from '../utils/generic';
import { dispatchColumnChangedEvent } from './columnEventUtils';
import type { ColKey, ColumnModel, Maybe } from './columnModel';
import type { ColumnState, ModifyColumnsNoEventsCallbacks } from './columnStateService';
import type { VisibleColsService } from './visibleColsService';

export class FuncColsService extends BeanStub implements NamedBean {
    beanName = 'funcColsSvc' as const;

    private colModel: ColumnModel;
    private aggFuncSvc?: IAggFuncService;
    private visibleCols: VisibleColsService;
    private rowGroupColsService?: IColsService;
    private pivotColsService?: IColsService;
    private valueColsService?: IColsService;

    public wireBeans(beans: BeanCollection): void {
        this.colModel = beans.colModel;
        this.aggFuncSvc = beans.aggFuncSvc;
        this.visibleCols = beans.visibleCols;
        this.rowGroupColsService = beans.rowGroupColsService;
        this.pivotColsService = beans.pivotColsService;
        this.valueColsService = beans.valueColsService;
    }

    public get rowGroupCols() {
        return this.rowGroupColsService?.columns ?? [];
    }

    public set rowGroupCols(cols: AgColumn[]) {
        if (this.rowGroupColsService) {
            this.rowGroupColsService.columns = cols ?? [];
        }
    }

    public valueCols: AgColumn[] = [];

    public get pivotCols() {
        return this.pivotColsService?.columns ?? [];
    }

    public set pivotCols(cols: AgColumn[]) {
        if (this.pivotColsService) {
            this.pivotColsService.columns = cols;
        }
    }

    public getModifyColumnsNoEventsCallbacks(): ModifyColumnsNoEventsCallbacks {
        return {
            addGroupCol: (column) => this.rowGroupColsService?.columns.push(column),
            removeGroupCol: (column) =>
                this.rowGroupColsService && _removeFromArray(this.rowGroupColsService.columns, column),

            addPivotCol: (column) => this.pivotColsService?.columns.push(column),
            removePivotCol: (column) =>
                this.pivotColsService && _removeFromArray(this.pivotColsService.columns, column),

            addValueCol: (column) => this.valueCols.push(column),
            removeValueCol: (column) => _removeFromArray(this.valueCols, column),
        };
    }

    public getSourceColumnsForGroupColumn(groupCol: AgColumn): AgColumn[] | null {
        const sourceColumnId = groupCol.getColDef().showRowGroup;
        if (!sourceColumnId) {
            return null;
        }

        if (sourceColumnId === true && this.rowGroupColsService) {
            return this.rowGroupColsService?.columns.slice(0);
        }

        const column = this.colModel.getColDefCol(sourceColumnId as string);
        return column ? [column] : null;
    }

    public sortRowGroupColumns(compareFn?: (a: AgColumn, b: AgColumn) => number): void {
        this.rowGroupColsService?.sortColumns(compareFn);
    }

    public sortPivotColumns(compareFn?: (a: AgColumn, b: AgColumn) => number): void {
        this.pivotColsService?.sortColumns(compareFn);
    }

    public isRowGroupEmpty(): boolean {
        return this.rowGroupColsService?.isRowGroupEmpty!() ?? true;
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

        dispatchColumnChangedEvent(this.eventSvc, 'columnValueChanged', [column], source);
    }

    public setRowGroupColumns(colKeys: ColKey[], source: ColumnEventType): void {
        this.rowGroupColsService?.setColumns(colKeys, source);
    }

    public addRowGroupColumns(keys: Maybe<ColKey>[], source: ColumnEventType): void {
        this.rowGroupColsService?.addColumns(keys, source);
    }

    public removeRowGroupColumns(keys: Maybe<ColKey>[] = [], source: ColumnEventType): void {
        this.rowGroupColsService?.removeColumns(keys, source);
    }

    public addPivotColumns(keys: ColKey[], source: ColumnEventType): void {
        this.pivotColsService?.addColumns(keys, source);
    }

    public setPivotColumns(colKeys: ColKey[], source: ColumnEventType): void {
        this.pivotColsService?.setColumns(colKeys, source);
    }

    public removePivotColumns(keys: ColKey[], source: ColumnEventType): void {
        this.pivotColsService?.removeColumns(keys, source);
    }

    public setValueColumns(colKeys: ColKey[], source: ColumnEventType): void {
        this.setColList(
            colKeys,
            this.valueCols,
            'columnValueChanged',
            false,
            false,
            (added, column) => this.setValueActive(added, column, source),
            source
        );
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

    public addValueColumns(keys: ColKey[], source: ColumnEventType): void {
        this.updateColList(
            keys,
            this.valueCols,
            true,
            false,
            (column) => this.setValueActive(true, column, source),
            'columnValueChanged',
            source
        );
    }

    public removeValueColumns(keys: ColKey[], source: ColumnEventType): void {
        this.updateColList(
            keys,
            this.valueCols,
            false,
            false,
            (column) => this.setValueActive(false, column, source),
            'columnValueChanged',
            source
        );
    }

    public moveRowGroupColumn(fromIndex: number, toIndex: number, source: ColumnEventType): void {
        this.rowGroupColsService?.moveColumn!(fromIndex, toIndex, source);
    }

    private setColList(
        colKeys: ColKey[],
        masterList: AgColumn[],
        eventName: 'columnValueChanged' | 'columnPivotChanged' | 'columnRowGroupChanged',
        detectOrderChange: boolean,
        autoGroupsNeedBuilding: boolean,
        columnCallback: (added: boolean, column: AgColumn) => void,
        source: ColumnEventType
    ): void {
        // defer grid init until cols are present. array size does not matter, only presence.
        if (!this.colModel.getCols()) {
            return;
        }

        const changes: Map<AgColumn, number> = new Map();
        // store all original cols and their index.
        masterList.forEach((col, idx) => changes.set(col, idx));

        masterList.length = 0;

        if (_exists(colKeys)) {
            colKeys.forEach((key) => {
                const column = this.colModel.getColDefCol(key);
                if (column) {
                    masterList.push(column);
                }
            });
        }

        masterList.forEach((col, idx) => {
            const oldIndex = changes.get(col);
            // if the column was not in the list, we add it as it's a change
            // idx is irrelevant now.
            if (oldIndex === undefined) {
                changes.set(col, 0);
                return;
            }

            if (detectOrderChange && oldIndex !== idx) {
                // if we're detecting order changes, and the indexes differ, we retain this as it's changed
                return;
            }

            // otherwise remove this col, as it's unchanged.
            changes.delete(col);
        });

        const primaryCols = this.colModel.getColDefCols();
        (primaryCols || []).forEach((column) => {
            const added = masterList.indexOf(column) >= 0;
            columnCallback(added, column);
        });

        autoGroupsNeedBuilding && this.colModel.refreshCols(false);

        this.visibleCols.refresh(source);

        dispatchColumnChangedEvent(this.eventSvc, eventName, [...changes.keys()], source);
    }

    private updateColList(
        keys: Maybe<ColKey>[] | null,
        masterList: AgColumn[],
        actionIsAdd: boolean,
        autoGroupsNeedBuilding: boolean,
        columnCallback: (column: AgColumn) => void,
        eventType: 'columnValueChanged' | 'columnPivotChanged' | 'columnRowGroupChanged',
        source: ColumnEventType
    ) {
        if (!keys?.length) {
            return;
        }

        let atLeastOne = false;
        const updatedCols: Set<AgColumn> = new Set();

        keys.forEach((key) => {
            if (!key) {
                return;
            }
            const columnToAdd = this.colModel.getColDefCol(key);
            if (!columnToAdd) {
                return;
            }
            updatedCols.add(columnToAdd);

            if (actionIsAdd) {
                if (masterList.indexOf(columnToAdd) >= 0) {
                    return;
                }
                masterList.push(columnToAdd);
            } else {
                const currentIndex = masterList.indexOf(columnToAdd);
                if (currentIndex < 0) {
                    return;
                }
                for (let i = currentIndex + 1; i < masterList.length; i++) {
                    // row indexes of subsequent columns have changed
                    updatedCols.add(masterList[i]);
                }
                _removeFromArray(masterList, columnToAdd);
            }

            columnCallback(columnToAdd);
            atLeastOne = true;
        });

        if (!atLeastOne) {
            return;
        }

        if (autoGroupsNeedBuilding) {
            this.colModel.refreshCols(false);
        }

        this.visibleCols.refresh(source);

        const eventColumns = Array.from(updatedCols);
        this.eventSvc.dispatchEvent({
            type: eventType,
            columns: eventColumns,
            column: eventColumns.length === 1 ? eventColumns[0] : null,
            source,
        } as WithoutGridCommon<ColumnEvent>);
    }

    public extractCols(source: ColumnEventType, oldProvidedCols: AgColumn[] | undefined): void {
        this.rowGroupColsService?.extractCols(source, oldProvidedCols);
        this.pivotColsService?.extractCols(source, oldProvidedCols);
        this.extractValueCols(source, oldProvidedCols);
    }

    private extractValueCols(source: ColumnEventType, oldProvidedCols: AgColumn[] | undefined): void {
        this.valueCols = this.extractColsCommon(
            oldProvidedCols,
            this.valueCols,
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
        this.valueCols.forEach((col) => {
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

    private extractColsCommon(
        oldProvidedCols: AgColumn[] = [],
        previousCols: AgColumn[] = [],
        setFlagFunc: (col: AgColumn, flag: boolean) => void,
        getIndexFunc: (colDef: ColDef) => number | null | undefined,
        getInitialIndexFunc: (colDef: ColDef) => number | null | undefined,
        getValueFunc: (colDef: ColDef) => boolean | null | undefined,
        getInitialValueFunc: (colDef: ColDef) => boolean | undefined
    ): AgColumn[] {
        const colsWithIndex: AgColumn[] = [];
        const colsWithValue: AgColumn[] = [];

        const primaryCols = this.colModel.getColDefCols() || [];

        // go though all cols.
        // if value, change
        // if default only, change only if new
        primaryCols.forEach((col) => {
            const colIsNew = oldProvidedCols.indexOf(col) < 0;
            const colDef = col.getColDef();

            const value = getValueFunc(colDef);
            const initialValue = getInitialValueFunc(colDef);
            const index = getIndexFunc(colDef);
            const initialIndex = getInitialIndexFunc(colDef);

            let include: boolean;

            const valuePresent = value !== undefined;
            const indexPresent = index !== undefined;
            const initialValuePresent = initialValue !== undefined;
            const initialIndexPresent = initialIndex !== undefined;

            if (valuePresent) {
                include = value!; // boolean value is guaranteed as attrToBoolean() is used above
            } else if (indexPresent) {
                if (index === null) {
                    // if col is new we don't want to use the default / initial if index is set to null. Similarly,
                    // we don't want to include the property for existing columns, i.e. we want to 'clear' it.
                    include = false;
                } else {
                    // note that 'null >= 0' evaluates to true which means 'rowGroupIndex = null' would enable row
                    // grouping if the null check didn't exist above.
                    include = index! >= 0;
                }
            } else {
                if (colIsNew) {
                    // as no value or index is 'present' we use the default / initial when col is new
                    if (initialValuePresent) {
                        include = initialValue!;
                    } else if (initialIndexPresent) {
                        include = initialIndex != null && initialIndex >= 0;
                    } else {
                        include = false;
                    }
                } else {
                    // otherwise include it if included last time, e.g. if we are extracting row group cols and this col
                    // is an existing row group col (i.e. it exists in 'previousCols') then we should include it.
                    include = previousCols.indexOf(col) >= 0;
                }
            }

            if (include) {
                const useIndex = colIsNew ? index != null || initialIndex != null : index != null;
                useIndex ? colsWithIndex.push(col) : colsWithValue.push(col);
            }
        });

        const getIndexForCol = (col: AgColumn): number => {
            const index = getIndexFunc(col.getColDef());
            const defaultIndex = getInitialIndexFunc(col.getColDef());

            return index != null ? index : defaultIndex!;
        };

        // sort cols with index, and add these first
        colsWithIndex.sort((colA, colB) => {
            const indexA = getIndexForCol(colA);
            const indexB = getIndexForCol(colB);

            if (indexA === indexB) {
                return 0;
            }
            if (indexA < indexB) {
                return -1;
            }

            return 1;
        });

        const res: AgColumn[] = ([] as AgColumn[]).concat(colsWithIndex);

        // second add columns that were there before and in the same order as they were before,
        // so we are preserving order of current grouping of columns that simply have rowGroup=true
        previousCols.forEach((col) => {
            if (colsWithValue.indexOf(col) >= 0) {
                res.push(col);
            }
        });

        // lastly put in all remaining cols
        colsWithValue.forEach((col) => {
            if (res.indexOf(col) < 0) {
                res.push(col);
            }
        });

        // set flag=false for removed cols
        previousCols.forEach((col) => {
            if (res.indexOf(col) < 0) {
                setFlagFunc(col, false);
            }
        });
        // set flag=true for newly added cols
        res.forEach((col) => {
            if (previousCols.indexOf(col) < 0) {
                setFlagFunc(col, true);
            }
        });

        return res;
    }

    public generateColumnStateForRowGroupAndPivotIndexes(
        updatedRowGroupColumnState: { [colId: string]: ColumnState },
        updatedPivotColumnState: { [colId: string]: ColumnState }
    ): ColumnState[] {
        // Generally columns should appear in the order they were before. For any new columns, these should appear in the original col def order.
        // The exception is for columns that were added via `addGroupColumns`. These should appear at the end.
        // We don't have to worry about full updates, as in this case the arrays are correct, and they won't appear in the updated lists.

        const existingColumnStateUpdates: { [colId: string]: ColumnState } = {};

        this.rowGroupColsService?.orderColumns(existingColumnStateUpdates, updatedRowGroupColumnState);
        this.pivotColsService?.orderColumns(existingColumnStateUpdates, updatedPivotColumnState);

        return Object.values(existingColumnStateUpdates);
    }
}
