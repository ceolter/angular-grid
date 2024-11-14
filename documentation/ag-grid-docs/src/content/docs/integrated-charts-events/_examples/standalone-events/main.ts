import type { AgChartLegendClickEvent, AgNodeClickEvent } from 'ag-charts-community';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type { FirstDataRenderedEvent, GridApi, GridOptions } from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { IntegratedChartsModule, MenuModule, RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    MenuModule,
    RowGroupingModule,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'Month', chartDataType: 'category', width: 150 },
        { field: 'Sunshine (hours)', chartDataType: 'series' },
        { field: 'Rainfall (mm)', chartDataType: 'series' },
    ],
    defaultColDef: {
        flex: 1,
    },
    cellSelection: true,
    popupParent: document.body,
    enableCharts: true,
    chartThemeOverrides: {
        common: {
            legend: {
                listeners: {
                    legendItemClick: (e: AgChartLegendClickEvent) => console.log('legendItemClick', e),
                },
            },
            listeners: {
                seriesNodeClick: (e: AgNodeClickEvent<any, any>) => console.log('seriesNodeClick', e),
            },
        },
    },
    onFirstDataRendered: onFirstDataRendered,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.createRangeChart({
        chartContainer: document.querySelector('#myChart') as HTMLElement,
        cellRange: { columns: ['Month', 'Sunshine (hours)', 'Rainfall (mm)'] },
        chartType: 'groupedColumn',
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/weather-se-england.json')
        .then((response) => response.json())
        .then(function (data) {
            gridApi!.setGridOption('rowData', data);
        });
});
