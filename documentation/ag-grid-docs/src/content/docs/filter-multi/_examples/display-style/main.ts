import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions, IMultiFilterParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ClipboardModule } from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { MultiFilterModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ClipboardModule,
    FiltersToolPanelModule,
    MenuModule,
    MultiFilterModule,
    SetFilterModule,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        {
            field: 'athlete',
            filter: 'agMultiColumnFilter',
            filterParams: {
                filters: [
                    {
                        filter: 'agTextColumnFilter',
                        display: 'subMenu',
                    },
                    {
                        filter: 'agSetColumnFilter',
                    },
                ],
            } as IMultiFilterParams,
        },
        {
            field: 'country',
            filter: 'agMultiColumnFilter',
            filterParams: {
                filters: [
                    {
                        filter: 'agTextColumnFilter',
                        display: 'accordion',
                        title: 'Expand Me for Text Filters',
                    },
                    {
                        filter: 'agSetColumnFilter',
                        display: 'accordion',
                    },
                ],
            } as IMultiFilterParams,
        },
        {
            field: 'sport',
            filter: 'agMultiColumnFilter',
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 200,
        suppressHeaderMenuButton: true,
        suppressHeaderContextMenu: true,
    },
    sideBar: {
        toolPanels: [
            {
                id: 'filters',
                labelDefault: 'Filters',
                labelKey: 'filters',
                iconKey: 'filter',
                toolPanel: 'agFiltersToolPanel',
            },
        ],
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
