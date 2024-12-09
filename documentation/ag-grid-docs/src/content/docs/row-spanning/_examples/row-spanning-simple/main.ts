import type { ColDef, GridApi, GridOptions, RowSpanParams } from 'ag-grid-community';
import {
    CellStyleModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([CellStyleModule, ClientSideRowModelModule, ValidationModule /* Development Only */]);

function rowSpan(params: RowSpanParams<IOlympicData>) {
    const athlete = params.data ? params.data.athlete : undefined;
    if (athlete === 'Aleksey Nemov') {
        // have all Russia age columns width 2
        return 2;
    } else if (athlete === 'Ryan Lochte') {
        // have all United States column width 4
        return 4;
    } else {
        // all other rows should be just normal
        return 1;
    }
}

const columnDefs: ColDef[] = [
    {
        field: 'athlete',
        rowSpan: rowSpan,
        cellClassRules: {
            'cell-span': "value==='Aleksey Nemov' || value==='Ryan Lochte'",
        },
        width: 200,
    },
    { field: 'age', width: 100 },
    { field: 'country' },
    { field: 'year', width: 100 },
    { field: 'date' },
    { field: 'sport' },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    defaultColDef: {
        width: 170,
    },
    suppressRowTransform: true,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
