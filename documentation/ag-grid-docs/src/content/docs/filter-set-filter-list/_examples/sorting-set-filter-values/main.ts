import type { GridApi, GridOptions, ISetFilterParams } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';
import {
    ColumnMenuModule,
    ColumnsToolPanelModule,
    ContextMenuModule,
    FiltersToolPanelModule,
    SetFilterModule,
} from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    SetFilterModule,
    ValidationModule /* Development Only */,
]);

const filterParams: ISetFilterParams = {
    comparator: (a: string | null, b: string | null) => {
        const valA = a == null ? 0 : parseInt(a);
        const valB = b == null ? 0 : parseInt(b);
        if (valA === valB) return 0;
        return valA > valB ? 1 : -1;
    },
};

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        {
            headerName: 'Age (No Comparator)',
            field: 'age',
            filter: 'agSetColumnFilter',
        },
        {
            headerName: 'Age (With Comparator)',
            field: 'age',
            filter: 'agSetColumnFilter',
            filterParams: filterParams,
        },
    ],
    defaultColDef: {
        flex: 1,
        filter: true,
        cellDataType: false,
    },
    rowData: getRowData(),
    sideBar: 'filters',
    onGridReady: (params) => {
        params.api.getToolPanelInstance('filters')!.expandFilters();
    },
};

function getRowData() {
    const rows = [];
    for (let i = 1; i < 117; i++) {
        rows.push({ age: i });
    }
    return rows;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
