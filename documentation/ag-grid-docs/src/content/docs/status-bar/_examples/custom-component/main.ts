import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions, IAggregationStatusPanelParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { CellSelectionModule } from 'ag-grid-enterprise';
import { StatusBarModule } from 'ag-grid-enterprise';

import { ClickableStatusBarComponent } from './clickableStatusBarComponent_typescript';
import { CountStatusBarComponent } from './countStatusBarComponent_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, CellSelectionModule, StatusBarModule]);

const columnDefs: ColDef[] = [
    {
        field: 'row',
    },
    {
        field: 'name',
    },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    columnDefs: columnDefs,
    rowData: [
        { row: 'Row 1', name: 'Michael Phelps' },
        { row: 'Row 2', name: 'Natalie Coughlin' },
        { row: 'Row 3', name: 'Aleksey Nemov' },
        { row: 'Row 4', name: 'Alicia Coutts' },
        { row: 'Row 5', name: 'Missy Franklin' },
        { row: 'Row 6', name: 'Ryan Lochte' },
        { row: 'Row 7', name: 'Allison Schmitt' },
        { row: 'Row 8', name: 'Natalie Coughlin' },
        { row: 'Row 9', name: 'Ian Thorpe' },
        { row: 'Row 10', name: 'Bob Mill' },
        { row: 'Row 11', name: 'Willy Walsh' },
        { row: 'Row 12', name: 'Sarah McCoy' },
        { row: 'Row 13', name: 'Jane Jack' },
        { row: 'Row 14', name: 'Tina Wills' },
    ],
    rowSelection: {
        mode: 'multiRow',
    },
    statusBar: {
        statusPanels: [
            {
                statusPanel: CountStatusBarComponent,
            },
            {
                statusPanel: ClickableStatusBarComponent,
            },
            {
                statusPanel: 'agAggregationComponent',
                statusPanelParams: {
                    aggFuncs: ['count', 'sum'],
                } as IAggregationStatusPanelParams,
            },
        ],
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
