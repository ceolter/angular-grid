import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions, GroupSelectionMode } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    MenuModule,
    RowGroupingModule,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'country', rowGroup: true, hide: true },
        { field: 'sport', rowGroup: true, hide: true },
        { field: 'gold', aggFunc: 'sum' },
        { field: 'silver', aggFunc: 'sum' },
        { field: 'bronze', aggFunc: 'sum' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    autoGroupColumnDef: {
        headerName: 'Athlete',
        field: 'athlete',
        minWidth: 250,
        cellRenderer: 'agGroupCellRenderer',
    },
    rowSelection: {
        mode: 'multiRow',
        groupSelects: 'self',
    },
    suppressAggFuncInHeader: true,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});

function getGroupSelectsValue(): GroupSelectionMode {
    return (document.querySelector<HTMLSelectElement>('#input-group-selection-mode')?.value as any) ?? 'self';
}

function onSelectionModeChange() {
    gridApi.setGridOption('rowSelection', {
        mode: 'multiRow',
        groupSelects: getGroupSelectsValue(),
    });
}

function onQuickFilterChanged() {
    gridApi.setGridOption('quickFilterText', document.querySelector<HTMLInputElement>('#input-quick-filter')?.value);
}
