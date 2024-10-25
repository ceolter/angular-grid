import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { IColsService } from '../interfaces/iColsService';

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
            this.rowGroupColsSvc.columns = cols;
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
}
