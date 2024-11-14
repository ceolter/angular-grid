import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions, PostSortRowsParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete' },
        { field: 'age', width: 100 },
        { field: 'country', sort: 'asc' },
        { field: 'year' },
        { field: 'date' },
        { field: 'sport' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ],
    defaultColDef: {
        width: 170,
    },
    postSortRows: (params: PostSortRowsParams<IOlympicData>) => {
        const rowNodes = params.nodes;
        // here we put Ireland rows on top while preserving the sort order
        let nextInsertPos = 0;
        for (let i = 0; i < rowNodes.length; i++) {
            const country = rowNodes[i].data ? rowNodes[i].data!.country : undefined;
            if (country === 'Ireland') {
                rowNodes.splice(nextInsertPos, 0, rowNodes.splice(i, 1)[0]);
                nextInsertPos++;
            }
        }
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data) => {
            gridApi!.setGridOption('rowData', data);
        });
});
