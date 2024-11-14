import { ClientSideRowModelModule } from 'ag-grid-community';
import type { FirstDataRenderedEvent, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import type { GetGroupIncludeTotalRowParams } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RowGroupingModule]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'country', rowGroup: true, hide: true },
        { field: 'year', rowGroup: true, hide: true },
        { field: 'gold', aggFunc: 'sum' },
        { field: 'silver', aggFunc: 'sum' },
        { field: 'bronze', aggFunc: 'sum' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 150,
    },
    autoGroupColumnDef: {
        minWidth: 300,
    },
    groupTotalRow: (params: GetGroupIncludeTotalRowParams) => {
        const node = params.node;
        if (node && node.level === 1) return 'bottom';
        if (node && node.key === 'United States') return 'bottom';

        return undefined;
    },
    onFirstDataRendered: (params: FirstDataRenderedEvent) => {
        params.api.forEachNode((node) => {
            if (node.key === 'United States' || node.key === 'Russia') {
                params.api.setRowNodeExpanded(node, true);
            }
        });
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data.slice(0, 50)));
});
