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
import { BeanStub, _isClientSideRowModel, _warnOnce } from 'ag-grid-community';

import { CROSS_FILTER_FIELD_POSTFIX, isMultiSelection } from '../crossfilter/crossFilterApi';
import { _mapValues } from '../utils/object';

export class ChartCrossFilterService extends BeanStub implements NamedBean {
    beanName = 'chartCrossFilterSvc' as const;

    private colModel: ColumnModel;
    private valueSvc: ValueService;
    private clientSideRowModel?: IClientSideRowModel;
    public filterManager?: FilterManager;

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

        let colId = ChartCrossFilterService.extractFilterColId(event);

        if (colId.endsWith(CROSS_FILTER_FIELD_POSTFIX)) {
            // remove CROSS_FILTER_FIELD_POSTFIX suffix if present - this handles the area/line chart
            // highlighting rather than filtering behaviour
            colId = colId.replace(CROSS_FILTER_FIELD_POSTFIX, '');
        }

        if (this.isValidColumnFilter(colId)) {
            // update filters based on current chart selections
            this.updateFilters(filterModel, event, colId);
        } else {
            _warnOnce(
                "cross filtering requires a 'agSetColumnFilter' or 'agMultiColumnFilter' " +
                    "to be defined on the column with id: '" +
                    colId +
                    "'"
            );
        }
    }

    public resetFilters(filterModel: any, force = false) {
        const filtersExist = Object.keys(filterModel).length > 0;
        if (filtersExist || force) {
            // only reset filters / charts when necessary to prevent undesirable flickering effect
            this.filterManager?.setFilterModel(null);
            this.filterManager?.onFilterChanged({ source: 'api' });
        }
    }

    private updateFilters(filterModel: any, event: any, colId: string) {
        const dataKey = ChartCrossFilterService.extractFilterColId(event);
        const rawValue = event.datum[dataKey];
        if (rawValue === undefined) {
            return;
        }

        const selectedValue = rawValue.toString();

        if (isMultiSelection(event.event)) {
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

    setFilters(updates: Record<string, any[]>) {
        this.filterManager?.setFilterModel(
            _mapValues(updates, (key, values) => this.getUpdatedFilterModel(key, values))
        );
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

    private static extractFilterColId(event: any): string {
        return event.xKey || event.calloutLabelKey;
    }

    private isValidColumnFilter(colId: string) {
        const filterType = this.getColumnFilterType(colId);
        if (typeof filterType === 'boolean') {
            return filterType;
        }

        return ['agSetColumnFilter', 'agMultiColumnFilter'].includes(filterType);
    }

    public getColumnFilterType(colId: any) {
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
