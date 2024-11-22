import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions, ISetFilterParams, SetFilterValuesFuncParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    SetFilterModule,
]);

const filterParams: ISetFilterParams = {
    values: (params: SetFilterValuesFuncParams) => {
        setTimeout(() => {
            params.success(['value 1', 'value 2']);
        }, 3000);
    },
};

let gridApi: GridApi;

const gridOptions: GridOptions = {
    rowData: [
        { value: 'value 1' },
        { value: 'value 1' },
        { value: 'value 1' },
        { value: 'value 1' },
        { value: 'value 2' },
        { value: 'value 2' },
        { value: 'value 2' },
        { value: 'value 2' },
        { value: 'value 2' },
    ],
    columnDefs: [
        {
            headerName: 'Set filter column',
            field: 'value',
            flex: 1,
            filter: 'agSetColumnFilter',
            floatingFilter: true,
            filterParams: filterParams,
        },
    ],
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
