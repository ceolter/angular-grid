import type { GridApi, GridOptions, HeaderValueGetterParams, ValueGetterParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { AdvancedFilterModule, ColumnMenuModule, ContextMenuModule, RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    TextFilterModule,
    NumberFilterModule,
    AdvancedFilterModule,
    ClientSideRowModelModule,
    ColumnMenuModule,
    ContextMenuModule,
    RowGroupingModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        {
            field: 'athlete',
            filterParams: {
                caseSensitive: true,
                filterOptions: ['contains'],
            },
        },
        { field: 'country', rowGroup: true, hide: true },
        { field: 'sport', hide: true },
        { field: 'age', minWidth: 100, filter: false },
        {
            headerName: 'Medals (+)',
            children: [
                { field: 'gold', minWidth: 100 },
                { field: 'silver', minWidth: 100 },
                { field: 'bronze', minWidth: 100 },
            ],
        },
        {
            headerName: 'Medals (-)',
            children: [
                {
                    field: 'gold',
                    headerValueGetter: (params: HeaderValueGetterParams<IOlympicData, number>) =>
                        params.location === 'advancedFilter' ? 'Gold (-)' : 'Gold',
                    valueGetter: valueGetter,
                    cellDataType: 'number',
                    minWidth: 100,
                },
                {
                    field: 'silver',
                    headerValueGetter: (params: HeaderValueGetterParams<IOlympicData, number>) =>
                        params.location === 'advancedFilter' ? 'Silver (-)' : 'Silver',
                    valueGetter: valueGetter,
                    cellDataType: 'number',
                    minWidth: 100,
                },
                {
                    field: 'bronze',
                    headerValueGetter: (params: HeaderValueGetterParams<IOlympicData, number>) =>
                        params.location === 'advancedFilter' ? 'Bronze (-)' : 'Bronze',
                    valueGetter: valueGetter,
                    cellDataType: 'number',
                    minWidth: 100,
                },
            ],
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 180,
        filter: true,
    },
    groupDefaultExpanded: 1,
    enableAdvancedFilter: true,
};

function valueGetter(params: ValueGetterParams<IOlympicData, number>) {
    return params.data ? params.data[params.colDef.field!] * -1 : null;
}

let includeHiddenColumns = false;

function onIncludeHiddenColumnsToggled() {
    includeHiddenColumns = !includeHiddenColumns;
    gridApi!.setGridOption('includeHiddenColumnsInAdvancedFilter', includeHiddenColumns);
    document.querySelector('#includeHiddenColumns')!.textContent =
        `${includeHiddenColumns ? 'Exclude' : 'Include'} Hidden Columns`;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
