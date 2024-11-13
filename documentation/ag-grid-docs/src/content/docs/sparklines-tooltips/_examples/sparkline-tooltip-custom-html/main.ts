import { AgChartsCommunityModule } from 'ag-charts-community';

import type { GridApi, GridOptions, LineSparklineOptions, TooltipRendererParams } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { SparklinesModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([ClientSideRowModelModule, SparklinesModule.with(AgChartsCommunityModule)]);

const body = document.body;

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'symbol', maxWidth: 100 },
        { field: 'name', minWidth: 250 },
        {
            field: 'change',
            cellRenderer: 'agSparklineCellRenderer',
            cellRendererParams: {
                sparklineOptions: {
                    line: {
                        stroke: 'rgb(94,94,224)',
                    },
                    tooltip: {
                        container: body,
                        xOffset: 20,
                        yOffset: -20,
                        renderer: tooltipRenderer,
                    },
                    highlightStyle: {
                        fill: 'rgb(94,94,224)',
                        strokeWidth: 0,
                    },
                } as LineSparklineOptions,
            },
        },
        {
            field: 'volume',
            type: 'numericColumn',
            minWidth: 160,
            maxWidth: 160,
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    rowData: getData(),
    rowHeight: 50,
};

function tooltipRenderer(params: TooltipRendererParams) {
    const { yValue, context } = params;
    return `<div class='my-custom-tooltip my-custom-tooltip-arrow'>
              <div class='tooltip-title'>${context.data.symbol}</div>
              <div class='tooltip-content'>
                <div>Change: ${yValue}</div>
                <div>Volume: ${context.data.volume}</div>
              </div>
          </div>`;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
