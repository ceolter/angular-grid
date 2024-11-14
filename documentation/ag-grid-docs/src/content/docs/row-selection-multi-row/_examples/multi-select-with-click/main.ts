import { ClientSideRowModelModule } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    MenuModule,
    RowGroupingModule,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [{ field: 'athlete' }, { field: 'sport' }, { field: 'year', maxWidth: 120 }],
    defaultColDef: { flex: 1, minWidth: 100 },
    rowSelection: {
        mode: 'multiRow',
        enableSelectionWithoutKeys: true,
        enableClickSelection: true,
        checkboxes: false,
        headerCheckbox: false,
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi.setGridOption('rowData', data));
});
