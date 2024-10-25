import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { IAggFunc } from '../entities/colDef';
import type { ColumnEventType } from '../events';
import type { IAggFuncService } from '../interfaces/iAggFuncService';
import type { IColsService } from '../interfaces/iColsService';
import { dispatchColumnChangedEvent } from './columnEventUtils';
import type { ColKey, ColumnModel, Maybe } from './columnModel';
import type { ColumnState } from './columnStateService';

export class FuncColsService extends BeanStub implements NamedBean {
    beanName = 'funcColsSvc' as const;

    private colModel: ColumnModel;
    private aggFuncSvc?: IAggFuncService;
    private rowGroupColsService?: IColsService;
    private pivotColsService?: IColsService;
    private valueColsService?: IColsService;

    public wireBeans(beans: BeanCollection): void {
        this.colModel = beans.colModel;
        this.aggFuncSvc = beans.aggFuncSvc;
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

    public get valueCols() {
        return this.valueColsService?.columns ?? [];
    }

    public set valueCols(cols: AgColumn[]) {
        if (this.valueColsService) {
            this.valueColsService.columns = cols;
        }
    }

    public get pivotCols() {
        return this.pivotColsService?.columns ?? [];
    }

    public set pivotCols(cols: AgColumn[]) {
        if (this.pivotColsService) {
            this.pivotColsService.columns = cols;
        }
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
        this.valueColsService?.setColumns(colKeys, source);
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
        this.valueColsService?.addColumns(keys, source);
    }

    public removeValueColumns(keys: ColKey[], source: ColumnEventType): void {
        this.valueColsService?.removeColumns(keys, source);
    }

    public moveRowGroupColumn(fromIndex: number, toIndex: number, source: ColumnEventType): void {
        this.rowGroupColsService?.moveColumn!(fromIndex, toIndex, source);
    }

    public extractCols(source: ColumnEventType, oldProvidedCols: AgColumn[] | undefined): void {
        this.rowGroupColsService?.extractCols(source, oldProvidedCols);
        this.pivotColsService?.extractCols(source, oldProvidedCols);
        this.valueColsService?.extractCols(source, oldProvidedCols);
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
