import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type { FirstDataRenderedEvent, GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, IntegratedChartsModule, RowGroupingModule } from 'ag-grid-enterprise';

import { generateData } from './data';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    ColumnMenuModule,
    ContextMenuModule,
    RowGroupingModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'division', width: 150, rowGroup: true, hide: true },
        { field: 'resource', width: 150, hide: true },
        { field: 'revenue' },
        { field: 'expenses' },
        { field: 'headcount' },
    ],
    defaultColDef: {
        flex: 1,
    },
    autoGroupColumnDef: {
        field: 'resource',
    },
    rowData: generateData(),
    cellSelection: true,
    popupParent: document.body,
    enableCharts: true,
    groupDefaultExpanded: 1,
    chartThemeOverrides: {
        bar: {
            axes: {
                'grouped-category': {
                    label: {
                        fontSize: 8,
                    },
                },
            },
        },
    },
    onFirstDataRendered: onFirstDataRendered,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.createRangeChart({
        chartContainer: document.querySelector('#myChart') as HTMLElement,
        cellRange: {
            rowStartIndex: 0,
            rowEndIndex: 16,
            columns: ['expenses'],
        },
        chartType: 'groupedColumn',
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
