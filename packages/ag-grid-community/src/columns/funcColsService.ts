import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { ColumnEventType } from '../events';
import type { IColsService } from '../interfaces/iColsService';
import type { ColKey, Maybe } from './columnModel';

export class FuncColsService extends BeanStub implements NamedBean {
    beanName = 'funcColsSvc' as const;

    private rowGroupColsSvc?: IColsService;
    private pivotColsSvc?: IColsService;
    private valueColsSvc?: IColsService;

    public wireBeans(beans: BeanCollection): void {
        this.rowGroupColsSvc = beans.rowGroupColsSvc;
        this.pivotColsSvc = beans.pivotColsSvc;
        this.valueColsSvc = beans.valueColsSvc;
    }

    public get rowGroupCols() {
        return this.rowGroupColsSvc?.columns ?? [];
    }

    public set rowGroupCols(cols: AgColumn[]) {
        if (this.rowGroupColsSvc) {
            this.rowGroupColsSvc.columns = cols ?? [];
        }
    }

    public get valueCols() {
        return this.valueColsSvc?.columns ?? [];
    }

    public set valueCols(cols: AgColumn[]) {
        if (this.valueColsSvc) {
            this.valueColsSvc.columns = cols;
        }
    }

    public get pivotCols() {
        return this.pivotColsSvc?.columns ?? [];
    }

    public set pivotCols(cols: AgColumn[]) {
        if (this.pivotColsSvc) {
            this.pivotColsSvc.columns = cols;
        }
    }

    public setRowGroupColumns(colKeys: ColKey[], source: ColumnEventType): void {
        this.rowGroupColsSvc?.setColumns(colKeys, source);
    }

    public addRowGroupColumns(keys: Maybe<ColKey>[], source: ColumnEventType): void {
        this.rowGroupColsSvc?.addColumns(keys, source);
    }

    public removeRowGroupColumns(keys: Maybe<ColKey>[] = [], source: ColumnEventType): void {
        this.rowGroupColsSvc?.removeColumns(keys, source);
    }

    public addPivotColumns(keys: ColKey[], source: ColumnEventType): void {
        this.pivotColsSvc?.addColumns(keys, source);
    }

    public setPivotColumns(colKeys: ColKey[], source: ColumnEventType): void {
        this.pivotColsSvc?.setColumns(colKeys, source);
    }

    public removePivotColumns(keys: ColKey[], source: ColumnEventType): void {
        this.pivotColsSvc?.removeColumns(keys, source);
    }

    public setValueColumns(colKeys: ColKey[], source: ColumnEventType): void {
        this.valueColsSvc?.setColumns(colKeys, source);
    }

    public addValueColumns(keys: ColKey[], source: ColumnEventType): void {
        this.valueColsSvc?.addColumns(keys, source);
    }

    public removeValueColumns(keys: ColKey[], source: ColumnEventType): void {
        this.valueColsSvc?.removeColumns(keys, source);
    }
}
