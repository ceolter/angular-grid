import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions, IRowDragItem } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const athleteRowDragTextCallback = function (params: IRowDragItem, dragItemCount: number) {
    // keep double equals here because data can be a string or number
    return `${dragItemCount} athlete(s) selected`;
};

const rowDragTextCallback = function (params: IRowDragItem) {
    // keep double equals here because data can be a string or number
    if (params.rowNode!.data.year == '2012') {
        return params.defaultTextValue + ' (London Olympics)';
    }
    return params.defaultTextValue;
};

const columnDefs: ColDef[] = [
    {
        field: 'athlete',
        rowDrag: true,
        rowDragText: athleteRowDragTextCallback,
    },
    { field: 'country', rowDrag: true },
    { field: 'year', width: 100 },
    { field: 'date' },
    { field: 'sport' },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        width: 170,
        filter: true,
    },
    rowDragManaged: true,
    columnDefs,
    rowDragText: rowDragTextCallback,
    rowDragMultiRow: true,
    rowSelection: { mode: 'multiRow' },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
