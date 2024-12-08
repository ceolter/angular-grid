import type { GridApi, GridOptions, IMultiFilterParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import {
    ClipboardModule,
    ColumnMenuModule,
    ContextMenuModule,
    FiltersToolPanelModule,
    MultiFilterModule,
    SetFilterModule,
} from 'ag-grid-enterprise';

import { YearFilter } from './YearFilter_typescript';
import { YearFloatingFilter } from './YearFloatingFilter_typescript';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ClipboardModule,
    FiltersToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    MultiFilterModule,
    SetFilterModule,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete', filter: 'agMultiColumnFilter' },
        { field: 'sport', filter: 'agMultiColumnFilter' },
        {
            field: 'year',
            filter: 'agMultiColumnFilter',
            filterParams: {
                filters: [
                    {
                        filter: YearFilter,
                        floatingFilterComponent: YearFloatingFilter,
                    },
                    {
                        filter: 'agNumberColumnFilter',
                    },
                ],
            } as IMultiFilterParams,
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 200,
        floatingFilter: true,
        suppressHeaderMenuButton: true,
        suppressHeaderContextMenu: true,
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
