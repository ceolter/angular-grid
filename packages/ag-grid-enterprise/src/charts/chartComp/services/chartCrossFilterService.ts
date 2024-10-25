import type {
    AgColumn,
    BeanCollection,
    ColumnModel,
    FilterManager,
    IClientSideRowModel,
    NamedBean,
    RowNode,
    ValueService,
} from 'ag-grid-community';
import { BeanStub, _isClientSideRowModel, _warn } from 'ag-grid-community';

export class ChartCrossFilterService extends BeanStub implements NamedBean {
    beanName = 'chartCrossFilterService' as const;

    private colModel: ColumnModel;
    private valueSvc: ValueService;
    private filterManager?: FilterManager;
    private clientSideRowModel?: IClientSideRowModel;

    public wireBeans(beans: BeanCollection) {
        this.colModel = beans.colModel;
        this.valueSvc = beans.valueSvc;
        this.filterManager = beans.filterManager;
        if (_isClientSideRowModel(this.gos, beans.rowModel)) {
            this.clientSideRowModel = beans.rowModel;
        }
    }

    public filter(event: any, reset: boolean = false): void {
        const filterModel = this.filterManager?.getFilterModel() ?? {};

        // filters should be reset when user clicks on canvas background
        if (reset) {
            this.resetFilters(filterModel);
            return;
        }

        const colId = this.extractFilterColId(event);
        if (this.isValidColumnFilter(colId)) {
            // update filters based on current chart selections
            this.updateFilters(filterModel, event, colId);
        } else {
            _warn(154, { colId });
        }
    }

    private resetFilters(filterModel: any) {
        const filtersExist = Object.keys(filterModel).length > 0;
        if (filtersExist) {
            // only reset filters / charts when necessary to prevent undesirable flickering effect
            this.filterManager?.setFilterModel(null);
            this.filterManager?.onFilterChanged({ source: 'api' });
        }
    }

    private updateFilters(filterModel: any, event: any, colId: string) {
        const dataKey = this.extractFilterColId(event);
        const rawValue = event.datum[dataKey];
        if (rawValue === undefined) {
            return;
        }

        const selectedValue = rawValue.toString();

        if (event.event.metaKey || event.event.ctrlKey) {
            const existingGridValues = this.getCurrentGridValuesForCategory(colId);
            const valueAlreadyExists = existingGridValues.includes(selectedValue);

            let updatedValues;
            if (valueAlreadyExists) {
                updatedValues = existingGridValues.filter((v: any) => v !== selectedValue);
            } else {
                updatedValues = existingGridValues;
                updatedValues.push(selectedValue);
            }

            filterModel[colId] = this.getUpdatedFilterModel(colId, updatedValues);
        } else {
            const updatedValues = [selectedValue];
            filterModel = { [colId]: this.getUpdatedFilterModel(colId, updatedValues) };
        }

        this.filterManager?.setFilterModel(filterModel);
    }

    private getUpdatedFilterModel(colId: any, updatedValues: any[]) {
        const columnFilterType = this.getColumnFilterType(colId);
        if (columnFilterType === 'agMultiColumnFilter') {
            return { filterType: 'multi', filterModels: [null, { filterType: 'set', values: updatedValues }] };
        }
        return { filterType: 'set', values: updatedValues };
    }

    private getCurrentGridValuesForCategory(colId: string) {
        const filteredValues: any[] = [];
        const column = this.getColumnById(colId);
        this.clientSideRowModel?.forEachNodeAfterFilter((rowNode: RowNode) => {
            if (column && !rowNode.group) {
                const value = this.valueSvc.getValue(column, rowNode) + '';
                if (!filteredValues.includes(value)) {
                    filteredValues.push(value);
                }
            }
        });
        return filteredValues;
    }

    private extractFilterColId(event: any): string {
        return event.xKey || event.calloutLabelKey;
    }

    private isValidColumnFilter(colId: any) {
        if (colId.indexOf('-filtered-out')) {
            colId = colId.replace('-filtered-out', '');
        }

        const filterType = this.getColumnFilterType(colId);
        if (typeof filterType === 'boolean') {
            return filterType;
        }

        return ['agSetColumnFilter', 'agMultiColumnFilter'].includes(filterType);
    }

    private getColumnFilterType(colId: any) {
        const gridColumn = this.getColumnById(colId);
        if (gridColumn) {
            const colDef = gridColumn.getColDef();
            return colDef.filter;
        }
    }

    private getColumnById(colId: string) {
        return this.colModel.getCol(colId) as AgColumn;
    }
}
