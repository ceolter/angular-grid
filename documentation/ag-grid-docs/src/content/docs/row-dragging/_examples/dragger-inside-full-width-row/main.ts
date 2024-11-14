import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    GridApi,
    GridOptions,
    ICellRendererParams,
    IsFullWidthRowParams,
    RowHeightParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { getData } from './data';
import { FullWidthCellRenderer } from './fullWidthCellRenderer_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [{ field: 'name', cellRenderer: countryCellRenderer }, { field: 'continent' }, { field: 'language' }],
    defaultColDef: {
        flex: 1,
        filter: true,
    },
    rowData: getData(),
    rowDragManaged: true,
    getRowHeight: (params: RowHeightParams) => {
        // return 100px height for full width rows
        if (isFullWidth(params.data)) {
            return 100;
        }
    },
    isFullWidthRow: (params: IsFullWidthRowParams) => {
        return isFullWidth(params.rowNode.data);
    },
    // see AG Grid docs cellRenderer for details on how to build cellRenderers
    fullWidthCellRenderer: FullWidthCellRenderer,
};

function countryCellRenderer(params: ICellRendererParams) {
    if (!params.fullWidth) {
        return params.value;
    }
    const flag =
        '<img border="0" width="15" height="10" src="https://www.ag-grid.com/example-assets/flags/' +
        params.data.code +
        '.png">';
    return '<span style="cursor: default;">' + flag + ' ' + params.value + '</span>';
}

function isFullWidth(data: any) {
    // return true when country is Peru, France or Italy
    return ['Peru', 'France', 'Italy'].indexOf(data.name) >= 0;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
