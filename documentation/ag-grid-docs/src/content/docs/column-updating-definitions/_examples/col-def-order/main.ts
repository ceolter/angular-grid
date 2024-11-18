import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

function getColumnDefsA(): ColDef[] {
    return [
        { field: 'athlete', headerName: 'A Athlete' },
        { field: 'age', headerName: 'A Age' },
        { field: 'country', headerName: 'A Country' },
        { field: 'sport', headerName: 'A Sport' },
        { field: 'year', headerName: 'A Year' },
        { field: 'date', headerName: 'A Date' },
        { field: 'gold', headerName: 'A Gold' },
        { field: 'silver', headerName: 'A Silver' },
        { field: 'bronze', headerName: 'A Bronze' },
        { field: 'total', headerName: 'A Total' },
    ];
}

function getColumnDefsB(): ColDef[] {
    return [
        { field: 'gold', headerName: 'B Gold' },
        { field: 'silver', headerName: 'B Silver' },
        { field: 'bronze', headerName: 'B Bronze' },
        { field: 'total', headerName: 'B Total' },
        { field: 'athlete', headerName: 'B Athlete' },
        { field: 'age', headerName: 'B Age' },
        { field: 'country', headerName: 'B Country' },
        { field: 'sport', headerName: 'B Sport' },
        { field: 'year', headerName: 'B Year' },
        { field: 'date', headerName: 'B Date' },
    ];
}

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        initialWidth: 100,
        filter: true,
    },
    maintainColumnOrder: true,
    columnDefs: getColumnDefsA(),
};

function setColsA() {
    gridApi!.setGridOption('columnDefs', getColumnDefsA());
}

function setColsB() {
    gridApi!.setGridOption('columnDefs', getColumnDefsB());
}

function clearColDefs() {
    gridApi!.setGridOption('columnDefs', []);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
