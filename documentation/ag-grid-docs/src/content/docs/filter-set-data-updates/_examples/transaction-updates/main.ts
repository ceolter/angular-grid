import { ClientSideRowModelModule } from 'ag-grid-community';
import type { FirstDataRenderedEvent, GridApi, GridOptions } from 'ag-grid-community';
import { IFiltersToolPanel, createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    MenuModule,
    SetFilterModule,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    rowData: getRowData(),
    columnDefs: [
        {
            headerName: 'Set Filter Column',
            field: 'col1',
            filter: 'agSetColumnFilter',
            editable: true,
            minWidth: 250,
        },
    ],
    sideBar: 'filters',
    onFirstDataRendered: onFirstDataRendered,
};

function getRowData() {
    return [{ col1: 'A' }, { col1: 'A' }, { col1: 'B' }, { col1: 'B' }, { col1: 'C' }, { col1: 'C' }];
}

function updateFirstRow() {
    const firstRow = gridApi!.getDisplayedRowAtIndex(0);
    if (firstRow) {
        const firstRowData = firstRow.data;
        firstRowData['col1'] += 'X';
        gridApi!.applyTransaction({ update: [firstRowData] });
    }
}

function addDRow() {
    gridApi!.applyTransaction({ add: [{ col1: 'D' }] });
}

function reset() {
    gridApi!.setFilterModel(null);
    gridApi!.setGridOption('rowData', getRowData());
}

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.getToolPanelInstance('filters')!.expandFilters();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
