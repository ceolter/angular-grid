import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    GridApi,
    GridOptions,
    ISetFilterParams,
    KeyCreatorParams,
    ValueFormatterParams,
    ValueGetterParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    SetFilterModule,
]);

const valueGetter = function (params: ValueGetterParams) {
    return params.data['animalsString'].split('|');
};

const valueFormatter = function (params: ValueFormatterParams) {
    return params.value
        .map(function (animal: any) {
            return animal.name;
        })
        .join(', ');
};

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        {
            headerName: 'Animals (array)',
            field: 'animalsArray',
            filter: 'agSetColumnFilter',
        },
        {
            headerName: 'Animals (string)',
            filter: 'agSetColumnFilter',
            valueGetter: valueGetter,
        },
        {
            headerName: 'Animals (objects)',
            field: 'animalsObjects',
            filter: 'agSetColumnFilter',
            valueFormatter: valueFormatter,
            keyCreator: (params: KeyCreatorParams) => params.value.name,
            filterParams: {
                valueFormatter: (params: ValueFormatterParams) => (params.value ? params.value.name : '(Blanks)'),
            } as ISetFilterParams,
        },
    ],
    defaultColDef: {
        flex: 1,
        cellDataType: false,
    },
    rowData: getData(),
    sideBar: 'filters',
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
