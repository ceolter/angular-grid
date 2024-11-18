import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import {
    GetRowIdParams,
    ISetFilterParams,
    KeyCreatorParams,
    ValueFormatterParams,
    createGrid,
} from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule, TreeDataModule } from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    MenuModule,
    SetFilterModule,
    TreeDataModule,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'created' },
        { field: 'modified' },
        {
            field: 'size',
            aggFunc: 'sum',
            filter: 'agSetColumnFilter',
            filterParams: {
                valueFormatter: (params) => {
                    const sizeInKb = params.value / 1024;

                    if (sizeInKb > 1024) {
                        return `${+(sizeInKb / 1024).toFixed(2)} MB`;
                    } else {
                        return `${+sizeInKb.toFixed(2)} KB`;
                    }
                },
            },
            valueFormatter: (params) => {
                const sizeInKb = params.value / 1024;

                if (sizeInKb > 1024) {
                    return `${+(sizeInKb / 1024).toFixed(2)} MB`;
                } else {
                    return `${+sizeInKb.toFixed(2)} KB`;
                }
            },
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 200,
    },
    autoGroupColumnDef: {
        cellRendererParams: {
            suppressCount: true,
        },
    },
    treeData: true,
    groupDefaultExpanded: -1,
    groupAggFiltering: true,
    getDataPath: (data: any) => data.path,
    rowData: getData(),
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
