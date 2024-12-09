import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ColumnAutoSizeModule,
    ModuleRegistry,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    ColumnAutoSizeModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const columnDefinitions: ColDef[] = [{ field: 'athlete' }, { field: 'age' }, { field: 'country' }, { field: 'sport' }];

const updatedHeaderColumnDefs: ColDef[] = [
    { field: 'athlete', headerName: 'C1' },
    { field: 'age', headerName: 'C2' },
    { field: 'country', headerName: 'C3' },
    { field: 'sport', headerName: 'C4' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefinitions,
    rowData: null,
    autoSizeStrategy: {
        type: 'fitGridWidth',
    },
};

function onBtUpdateHeaders() {
    gridApi!.setGridOption('columnDefs', updatedHeaderColumnDefs);
}

function onBtRestoreHeaders() {
    gridApi!.setGridOption('columnDefs', columnDefinitions);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
