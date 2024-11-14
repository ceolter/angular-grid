import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions, ValueFormatterParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RowGroupingModule]);

const columnDefs: ColDef[] = [
    // this row just shows the row index, doesn't use any data from the row
    {
        headerName: '#',
        width: 50,
        valueFormatter: (params: ValueFormatterParams) => {
            return `${parseInt(params.node!.id!) + 1}`;
        },
    },
    { headerName: 'Athlete', field: 'athlete', width: 150 },
    { headerName: 'Age', field: 'age', width: 90 },
    { headerName: 'Country', field: 'country', width: 120 },
    { headerName: 'Year', field: 'year', width: 90 },
    { headerName: 'Date', field: 'date', width: 110 },
    { headerName: 'Sport', field: 'sport', width: 110 },
    { headerName: 'Gold', field: 'gold', width: 100 },
    { headerName: 'Silver', field: 'silver', width: 100 },
    { headerName: 'Bronze', field: 'bronze', width: 100 },
    { headerName: 'Total', field: 'total', width: 100 },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        filter: true,
    },
    rowSelection: {
        mode: 'multiRow',
        checkboxes: true,
        headerCheckbox: true,
    },
    paginationPageSize: 500,
    paginationPageSizeSelector: [100, 500, 1000],
    columnDefs,
    pagination: true,
    suppressPaginationPanel: true,
    suppressScrollOnNewData: true,
    onPaginationChanged: onPaginationChanged,
};

function setText(selector: string, text: any) {
    (document.querySelector(selector) as any).innerHTML = text;
}

function onPaginationChanged() {
    console.log('onPaginationPageLoaded');

    // Workaround for bug in events order
    if (gridApi!) {
        setText('#lbLastPageFound', gridApi!.paginationIsLastPageFound());
        setText('#lbPageSize', gridApi!.paginationGetPageSize());
        // we +1 to current page, as pages are zero based
        setText('#lbCurrentPage', gridApi!.paginationGetCurrentPage() + 1);
        setText('#lbTotalPages', gridApi!.paginationGetTotalPages());

        setLastButtonDisabled(!gridApi!.paginationIsLastPageFound());
    }
}

function setLastButtonDisabled(disabled: boolean) {
    (document.querySelector('#btLast') as any).disabled = disabled;
}

function onBtFirst() {
    gridApi!.paginationGoToFirstPage();
}

function onBtLast() {
    gridApi!.paginationGoToLastPage();
}

function onBtNext() {
    gridApi!.paginationGoToNextPage();
}

function onBtPrevious() {
    gridApi!.paginationGoToPreviousPage();
}

function onBtPageFive() {
    // we say page 4, as the first page is zero
    gridApi!.paginationGoToPage(4);
}

function onBtPageFifty() {
    // we say page 49, as the first page is zero
    gridApi!.paginationGoToPage(49);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
