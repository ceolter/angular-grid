import type {
    AgColumn,
    BeanCollection,
    ColumnModel,
    FuncColsService,
    IAggColumnNameService,
    IAggFunc,
    NamedBean,
} from 'ag-grid-community';
import { BeanStub, _exists } from 'ag-grid-community';

export class AggColumnNameService extends BeanStub implements NamedBean, IAggColumnNameService {
    beanName = 'aggColumnNameSvc' as const;

    private funcColsSvc: FuncColsService;
    private colModel: ColumnModel;

    public wireBeans(beans: BeanCollection) {
        this.funcColsSvc = beans.funcColsSvc;
        this.colModel = beans.colModel;
    }

    public getHeaderName(column: AgColumn, headerName: string | null): string | null {
        if (this.gos.get('suppressAggFuncInHeader')) {
            return headerName;
        }

        // only columns with aggregation active can have aggregations
        const pivotValueColumn = column.getColDef().pivotValueColumn;
        const pivotActiveOnThisColumn = _exists(pivotValueColumn);
        let aggFunc: string | IAggFunc | null | undefined = null;
        let aggFuncFound: boolean;

        // otherwise we have a measure that is active, and we are doing aggregation on it
        if (pivotActiveOnThisColumn) {
            const valueColumns = this.funcColsSvc.valueCols;
            const isCollapsedHeaderEnabled =
                this.gos.get('removePivotHeaderRowWhenSingleValueColumn') && valueColumns.length === 1;
            const isTotalColumn = column.getColDef().pivotTotalColumnIds !== undefined;
            if (isCollapsedHeaderEnabled && !isTotalColumn) {
                return headerName; // Skip decorating the header - in this case the label is the pivot key, not the value col
            }
            aggFunc = pivotValueColumn ? pivotValueColumn.getAggFunc() : null;
            aggFuncFound = true;
        } else {
            const measureActive = column.isValueActive();
            const aggregationPresent = this.colModel.isPivotMode() || !this.funcColsSvc.isRowGroupEmpty();

            if (measureActive && aggregationPresent) {
                aggFunc = column.getAggFunc();
                aggFuncFound = true;
            } else {
                aggFuncFound = false;
            }
        }

        if (aggFuncFound) {
            const aggFuncString = typeof aggFunc === 'string' ? aggFunc : 'func';
            const localeTextFunc = this.getLocaleTextFunc();
            const aggFuncStringTranslated = localeTextFunc(aggFuncString, aggFuncString);
            return `${aggFuncStringTranslated}(${headerName})`;
        }

        return headerName;
    }
}
