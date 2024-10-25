import type { BeanCollection, FuncColsService, IPivotResultColsService, NamedBean } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

export class ListenerUtils extends BeanStub implements NamedBean {
    beanName = 'ssrmListenerUtils' as const;

    private pivotResultCols?: IPivotResultColsService;
    private funcColsSvc: FuncColsService;

    public wireBeans(beans: BeanCollection) {
        this.pivotResultCols = beans.pivotResultCols;
        this.funcColsSvc = beans.funcColsSvc;
    }

    public isSortingWithValueColumn(changedColumnsInSort: string[]): boolean {
        const valueColIds = this.funcColsSvc.valueCols.map((col) => col.getColId());

        for (let i = 0; i < changedColumnsInSort.length; i++) {
            if (valueColIds.indexOf(changedColumnsInSort[i]) > -1) {
                return true;
            }
        }

        return false;
    }

    public isSortingWithSecondaryColumn(changedColumnsInSort: string[]): boolean {
        const pivotResultCols = this.pivotResultCols?.getPivotResultCols();
        if (!pivotResultCols) {
            return false;
        }

        const secondaryColIds = pivotResultCols.list.map((col) => col.getColId());

        for (let i = 0; i < changedColumnsInSort.length; i++) {
            if (secondaryColIds.indexOf(changedColumnsInSort[i]) > -1) {
                return true;
            }
        }

        return false;
    }
}
