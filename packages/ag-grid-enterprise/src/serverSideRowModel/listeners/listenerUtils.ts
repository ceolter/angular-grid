import type { BeanCollection, FuncColsService, IPivotResultColsService, NamedBean } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

export class ListenerUtils extends BeanStub implements NamedBean {
    beanName = 'ssrmListenerUtils' as const;

    private pivotResultColsService?: IPivotResultColsService;
    private funcColsService: FuncColsService;

    public wireBeans(beans: BeanCollection) {
        this.pivotResultColsService = beans.pivotResultColsService;
        this.funcColsService = beans.funcColsService;
    }

    public isSortingWithValueColumn(changedColumnsInSort: string[]): boolean {
        const valueColIds = this.funcColsService.valueCols.map((col) => col.getColId());

        for (let i = 0; i < changedColumnsInSort.length; i++) {
            if (valueColIds.indexOf(changedColumnsInSort[i]) > -1) {
                return true;
            }
        }

        return false;
    }

    public isSortingWithSecondaryColumn(changedColumnsInSort: string[]): boolean {
        const pivotResultCols = this.pivotResultColsService?.getPivotResultCols();
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
