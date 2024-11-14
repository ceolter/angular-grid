import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RowGroupingModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        // one column for showing the groups
        {
            headerName: 'Group',
            cellRenderer: 'agGroupCellRenderer',
            showRowGroup: true,
            minWidth: 210,
        },

        // the first group column
        { field: 'country', rowGroup: true, hide: true },
        { field: 'year', rowGroup: true, hide: true },

        { field: 'athlete' },
        { field: 'total' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 200,
    },
    groupDisplayType: 'custom',
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
