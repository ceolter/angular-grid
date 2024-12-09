import type { ColGroupDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { PivotModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    TextFilterModule,
    ClientSideRowModelModule,
    PivotModule,
    NumberFilterModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColGroupDef[] = [
    {
        headerName: 'Athlete Details',
        children: [
            {
                field: 'athlete',
                width: 150,
                suppressSizeToFit: true,
                enableRowGroup: true,
                rowGroupIndex: 0,
            },
            {
                field: 'age',
                width: 90,
                minWidth: 75,
                maxWidth: 100,
                enableRowGroup: true,
            },
            {
                field: 'country',
                enableRowGroup: true,
            },
            {
                field: 'year',
                width: 90,
                enableRowGroup: true,
                pivotIndex: 0,
            },
            { field: 'sport', width: 110, enableRowGroup: true },
            {
                field: 'gold',
                enableValue: true,
                suppressHeaderMenuButton: true,
                filter: 'agNumberColumnFilter',
                aggFunc: 'sum',
            },
            {
                field: 'silver',
                enableValue: true,
                suppressHeaderMenuButton: true,
                filter: 'agNumberColumnFilter',
                aggFunc: 'sum',
            },
            {
                field: 'bronze',
                enableValue: true,
                suppressHeaderMenuButton: true,
                filter: 'agNumberColumnFilter',
                aggFunc: 'sum',
            },
            {
                field: 'total',
                enableValue: true,
                suppressHeaderMenuButton: true,
                filter: 'agNumberColumnFilter',
                aggFunc: 'sum',
            },
        ],
    },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        floatingFilter: true,
        width: 120,
    },
    autoGroupColumnDef: {
        width: 200,
    },
    columnDefs: columnDefs,
    rowData: null,
};

function setIdText(id: string, value: string | number | undefined) {
    document.getElementById(id)!.textContent = value == undefined ? 'undefined' : value + '';
}

function setPivotOn() {
    document.querySelector('#requiresPivot')!.className = '';
    document.querySelector('#requiresNotPivot')!.className = 'hidden';
    gridApi!.setGridOption('pivotMode', true);
    setIdText('pivot', 'on');
}

function setPivotOff() {
    document.querySelector('#requiresPivot')!.className = 'hidden';
    document.querySelector('#requiresNotPivot')!.className = '';
    gridApi!.setGridOption('pivotMode', false);
    setIdText('pivot', 'off');
}

function setHeaderHeight(value?: number) {
    gridApi!.setGridOption('headerHeight', value);
    setIdText('headerHeight', value);
}

function setGroupHeaderHeight(value?: number) {
    gridApi!.setGridOption('groupHeaderHeight', value);
    setIdText('groupHeaderHeight', value);
}

function setFloatingFiltersHeight(value?: number) {
    gridApi!.setGridOption('floatingFiltersHeight', value);
    setIdText('floatingFiltersHeight', value);
}

function setPivotGroupHeaderHeight(value?: number) {
    gridApi!.setGridOption('pivotGroupHeaderHeight', value);
    setIdText('pivotGroupHeaderHeight', value);
}

function setPivotHeaderHeight(value?: number) {
    gridApi!.setGridOption('pivotHeaderHeight', value);
    setIdText('pivotHeaderHeight', value);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
