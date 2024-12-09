import type {
    GridApi,
    GridOptions,
    ICellRendererComp,
    ICellRendererParams,
    IsFullWidthRowParams,
    RowHeightParams,
} from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

import { getData } from './data';
import { FullWidthCellRenderer } from './fullWidthCellRenderer_typescript';

ModuleRegistry.registerModules([TextFilterModule, ClientSideRowModelModule, ValidationModule /* Development Only */]);

class CountryCellRenderer implements ICellRendererComp {
    eGui!: HTMLElement;

    init(params: ICellRendererParams) {
        const flag = `<img border="0" width="15" height="10" src="https://www.ag-grid.com/example-assets/flags/${params.data.code}.png">`;

        const eTemp = document.createElement('div');
        eTemp.innerHTML = `<span style="cursor: default;">${flag} ${params.value}</span>`;
        this.eGui = eTemp.firstElementChild as HTMLElement;
    }

    getGui() {
        return this.eGui;
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }
}

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [{ field: 'name', cellRenderer: CountryCellRenderer }, { field: 'continent' }, { field: 'language' }],
    defaultColDef: {
        flex: 1,
        filter: true,
    },
    rowData: getData(),
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

function isFullWidth(data: any) {
    // return true when country is Peru, France or Italy
    return ['Peru', 'France', 'Italy'].indexOf(data.name) >= 0;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
