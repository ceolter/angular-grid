import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { ColumnEventType } from '../events';
import type { IColsService } from '../interfaces/iColsService';
import type { ColKey, Maybe } from './columnModel';

export class FuncColsService extends BeanStub implements NamedBean {
    beanName = 'funcColsSvc' as const;

    private rowGroupColsService?: IColsService;
    private pivotColsService?: IColsService;
    private valueColsService?: IColsService;

    public wireBeans(beans: BeanCollection): void {
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

    public addValueColumns(keys: ColKey[], source: ColumnEventType): void {
        this.valueColsService?.addColumns(keys, source);
    }

    public removeValueColumns(keys: ColKey[], source: ColumnEventType): void {
        this.valueColsService?.removeColumns(keys, source);
    }
}
