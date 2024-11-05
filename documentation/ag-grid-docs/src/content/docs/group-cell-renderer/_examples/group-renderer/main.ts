import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions, IGroupCellRendererParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

import { getData } from './data';
import { SimpleCellRenderer } from './simpleCellRenderer_typescript';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule]);

const columnDefs: ColDef[] = [
    // this column shows just the country group values, but has no group renderer, so there is no expand / collapse functionality.
    {
        headerName: 'Country Group - No Renderer',
        showRowGroup: 'country',
        minWidth: 250,
    },

    // same as before, but we show all group values, again with no cell renderer
    { headerName: 'All Groups - No Renderer', showRowGroup: true, minWidth: 240 },

    // add in a cell renderer
    {
        headerName: 'Group Renderer A',
        showRowGroup: true,
        cellRenderer: 'agGroupCellRenderer',
        minWidth: 220,
    },

    // add in a field
    {
        headerName: 'Group Renderer B',
        field: 'city',
        showRowGroup: true,
        cellRenderer: 'agGroupCellRenderer',
        minWidth: 220,
    },

    // add in a cell renderer params
    {
        headerName: 'Group Renderer C',
        field: 'city',
        minWidth: 240,
        showRowGroup: true,
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
            suppressCount: true,
            innerRenderer: SimpleCellRenderer,
            suppressDoubleClickExpand: true,
            suppressEnterExpand: true,
        } as IGroupCellRendererParams,
    },

    { headerName: 'Type', field: 'type', rowGroup: true },
    { headerName: 'Country', field: 'country', rowGroup: true },
    { headerName: 'City', field: 'city' },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 120,
    },
    rowData: getData(),
    // we don't want the auto column here, as we are providing our own cols
    groupDisplayType: 'custom',
    groupDefaultExpanded: 1,
    rowSelection: {
        mode: 'multiRow',
        groupSelects: 'descendants',
        headerCheckbox: false,
        checkboxLocation: 'autoGroupColumn',
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
