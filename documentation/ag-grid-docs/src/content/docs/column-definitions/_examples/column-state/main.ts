import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ColumnApiModule,
    ColumnAutoSizeModule,
    ModuleRegistry,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnsToolPanelModule, RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ColumnApiModule,
    ColumnAutoSizeModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    RowGroupingModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [{ field: 'athlete' }, { field: 'age' }, { field: 'country' }, { field: 'sport' }];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    rowData: null,
    autoSizeStrategy: {
        type: 'fitGridWidth',
    },
};

function onBtSortAthlete() {
    gridApi!.applyColumnState({
        state: [{ colId: 'athlete', sort: 'asc' }],
    });
}

function onBtClearAllSorting() {
    gridApi!.applyColumnState({
        defaultState: { sort: null },
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
