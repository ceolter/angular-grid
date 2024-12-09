import type { ColDef, GridApi, GridOptions, RowGroupOpenedEvent } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    ScrollApiModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ScrollApiModule,
    NumberEditorModule,
    TextEditorModule,
    TextFilterModule,
    ClientSideRowModelModule,
    RowGroupingModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    { field: 'athlete', width: 150, rowGroupIndex: 0 },
    { field: 'age', width: 90, rowGroupIndex: 1 },
    { field: 'country', width: 120, rowGroupIndex: 2 },
    { field: 'year', width: 90 },
    { field: 'date', width: 110, rowGroupIndex: 2 },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    rowData: null,
    animateRows: false,
    groupDisplayType: 'groupRows',
    onRowGroupOpened: onRowGroupOpened,
    defaultColDef: {
        editable: true,
        filter: true,
        flex: 1,
        minWidth: 100,
    },
};

function onRowGroupOpened(event: RowGroupOpenedEvent<IOlympicData>) {
    if (event.expanded) {
        const rowNodeIndex = event.node.rowIndex!;
        // factor in child nodes so we can scroll to correct position
        const childCount = event.node.childrenAfterSort ? event.node.childrenAfterSort.length : 0;
        const newIndex = rowNodeIndex + childCount;
        gridApi!.ensureIndexVisible(newIndex);
    }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
