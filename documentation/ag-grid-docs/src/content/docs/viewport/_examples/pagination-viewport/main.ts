import type {
    ColDef,
    GetRowIdParams,
    GridApi,
    GridOptions,
    ICellRendererComp,
    ICellRendererParams,
    ValueFormatterParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ViewportRowModelModule } from 'ag-grid-enterprise';

import { createMockServer } from './mock-server';
import { createViewportDatasource } from './viewport-datasource';

ModuleRegistry.registerModules([AllCommunityModule, ViewportRowModelModule]);

class RowIndexRenderer implements ICellRendererComp {
    eGui!: HTMLDivElement;
    init(params: ICellRendererParams) {
        this.eGui = document.createElement('div');
        this.eGui.textContent = '' + params.node.rowIndex;
    }
    refresh(params: ICellRendererParams): boolean {
        return false;
    }
    getGui(): HTMLElement {
        return this.eGui;
    }
}

const columnDefs: ColDef[] = [
    // this col shows the row index, doesn't use any data from the row
    {
        headerName: '#',
        maxWidth: 80,
        cellRenderer: RowIndexRenderer,
    },
    { field: 'code', maxWidth: 90 },
    { field: 'name', minWidth: 220 },
    {
        field: 'bid',
        cellClass: 'cell-number',
        valueFormatter: numberFormatter,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
    },
    {
        field: 'mid',
        cellClass: 'cell-number',
        valueFormatter: numberFormatter,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
    },
    {
        field: 'ask',
        cellClass: 'cell-number',
        valueFormatter: numberFormatter,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
    },
    {
        field: 'volume',
        cellClass: 'cell-number',
        cellRenderer: 'agAnimateSlideCellRenderer',
    },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 140,
        sortable: false,
    },
    rowModelType: 'viewport',
    pagination: true,
    paginationAutoPageSize: true,
    viewportRowModelPageSize: 1,
    viewportRowModelBufferSize: 0,
    // implement this so that we can do selection
    getRowId: (params: GetRowIdParams) => {
        // the code is unique, so perfect for the id
        return params.data.code;
    },
    rowSelection: {
        mode: 'multiRow',
        headerCheckbox: false,
    },
};

function numberFormatter(params: ValueFormatterParams) {
    if (typeof params.value === 'number') {
        return params.value.toFixed(2);
    } else {
        return params.value;
    }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/stocks.json')
        .then((response) => response.json())
        .then(function (data) {
            // set up a mock server - real code will not do this, it will contact your
            // real server to get what it needs
            const mockServer = createMockServer();
            mockServer.init(data);

            const viewportDatasource = createViewportDatasource(mockServer);
            gridApi!.setGridOption('viewportDatasource', viewportDatasource);
        });
});
