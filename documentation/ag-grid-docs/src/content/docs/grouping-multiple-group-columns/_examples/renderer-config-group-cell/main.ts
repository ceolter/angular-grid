import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

import { CustomMedalCellRenderer } from './customMedalCellRenderer_typescript';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'total', rowGroup: true, cellRenderer: CustomMedalCellRenderer },
        { field: 'year' },
        { field: 'athlete' },
        { field: 'sport' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    autoGroupColumnDef: {
        headerName: 'Gold Medals',
        minWidth: 240,
        cellRendererParams: {
            suppressCount: true,
        },
    },
    groupDisplayType: 'multipleColumns',
    rowSelection: {
        mode: 'singleRow',
        checkboxLocation: 'autoGroupColumn',
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
