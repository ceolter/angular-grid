import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import {
    GridApi,
    GridOptions,
    ISetFilterParams,
    KeyCreatorParams,
    ValueFormatterParams,
    createGrid,
} from '@ag-grid-community/core';
import { CommunityFeaturesModule, ModuleRegistry } from '@ag-grid-community/core';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { FiltersToolPanelModule } from '@ag-grid-enterprise/filter-tool-panel';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';

import { getData } from './data';

ModuleRegistry.registerModules([
    CommunityFeaturesModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    MenuModule,
    SetFilterModule,
]);

const pathLookup: { [key: string]: string } = getData().reduce((pathMap, row) => {
    pathMap[row.path.key] = row.path.displayValue;
    return pathMap;
}, {});

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [{ field: 'employmentType' }, { field: 'jobTitle' }],
    defaultColDef: {
        flex: 1,
        minWidth: 200,
        filter: true,
        floatingFilter: true,
        cellDataType: false,
    },
    autoGroupColumnDef: {
        headerName: 'Employee',
        field: 'path',
        cellRendererParams: {
            suppressCount: true,
        },
        filter: 'agSetColumnFilter',
        filterParams: {
            treeList: true,
            keyCreator: (params: KeyCreatorParams) => params.value.join('.'),
            treeListFormatter: treeListFormatter,
            valueFormatter: valueFormatter,
        } as ISetFilterParams<any, string[]>,
        minWidth: 280,
        valueFormatter: (params: ValueFormatterParams) => params.value.displayValue,
    },
    treeData: true,
    groupDefaultExpanded: -1,
    getDataPath: (data) => data.path.key.split('.'),
    rowData: getData(),
};

function treeListFormatter(pathKey: string | null, _level: number, parentPathKeys: (string | null)[]): string {
    return pathLookup[[...parentPathKeys, pathKey].join('.')];
}

function valueFormatter(params: ValueFormatterParams): string {
    return params.value ? pathLookup[params.value.join('.')] : '(Blanks)';
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
