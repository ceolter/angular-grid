import type {
    ColDef,
    GetRowIdParams,
    GridApi,
    GridOptions,
    ValueFormatterParams,
    ValueGetterParams,
} from 'ag-grid-community';
import {
    CellStyleModule,
    ClientSideRowModelModule,
    HighlightChangesModule,
    ModuleRegistry,
    NumberFilterModule,
    RowSelectionModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    TextEditorModule,
    RowSelectionModule,
    CellStyleModule,
    ClientSideRowModelModule,
    RowGroupingModule,
    HighlightChangesModule,
    TextFilterModule,
    NumberFilterModule,
    ValidationModule /* Development Only */,
]);

const MIN_BOOK_COUNT = 10;
const MAX_BOOK_COUNT = 20;

const MIN_TRADE_COUNT = 1;
const MAX_TRADE_COUNT = 10;

const products = [
    'Palm Oil',
    'Rubber',
    'Wool',
    'Amber',
    'Copper',
    'Lead',
    'Zinc',
    'Tin',
    'Aluminium',
    'Aluminium Alloy',
    'Nickel',
    'Cobalt',
    'Molybdenum',
    'Recycled Steel',
    'Corn',
    'Oats',
    'Rough Rice',
    'Soybeans',
    'Rapeseed',
    'Soybean Meal',
    'Soybean Oil',
    'Wheat',
    'Milk',
    'Coca',
    'Coffee C',
    'Cotton No.2',
    'Sugar No.11',
    'Sugar No.14',
];

const portfolios = ['Aggressive', 'Defensive', 'Income', 'Speculative', 'Hybrid'];

// as we create books, we remember what products they belong to, so we can
// add to these books later when use clicks one of the buttons
const productToPortfolioToBooks: any = {};

// start the book id's and trade id's at some future random number,
// looks more realistic than starting them at 0
let nextBookId = 62472;
let nextTradeId = 24287;
let nextBatchId = 101;

const columnDefs: ColDef[] = [
    // these are the row groups, so they are all hidden (they are showd in the group column)
    {
        field: 'product',
        enableRowGroup: true,
        rowGroupIndex: 0,
        hide: true,
    },
    {
        field: 'portfolio',
        enableRowGroup: true,
        rowGroupIndex: 1,
        hide: true,
    },
    {
        field: 'book',
        enableRowGroup: true,
        rowGroupIndex: 2,
        hide: true,
    },

    // all the other columns (visible and not grouped)
    {
        field: 'batch',
        width: 100,
        cellClass: 'number',
        aggFunc: 'max',
        enableValue: true,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
    },
    {
        field: 'current',
        width: 200,
        aggFunc: 'sum',
        enableValue: true,
        cellClass: 'number',
        valueFormatter: numberCellFormatter,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
    },
    {
        field: 'previous',
        width: 200,
        aggFunc: 'sum',
        enableValue: true,
        cellClass: 'number',
        valueFormatter: numberCellFormatter,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
    },
    {
        headerName: 'Change',
        valueGetter: changeValueGetter,
        width: 200,
        aggFunc: 'sum',
        enableValue: true,
        cellClass: 'number',
        valueFormatter: numberCellFormatter,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
    },
    {
        headerName: 'PL 1',
        field: 'pl1',
        width: 200,
        aggFunc: 'sum',
        enableValue: true,
        cellClass: 'number',
        valueFormatter: numberCellFormatter,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
    },
    {
        headerName: 'PL 2',
        field: 'pl2',
        width: 200,
        aggFunc: 'sum',
        enableValue: true,
        cellClass: 'number',
        valueFormatter: numberCellFormatter,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
    },
    {
        headerName: 'Gain-DX',
        field: 'gainDx',
        width: 200,
        aggFunc: 'sum',
        enableValue: true,
        cellClass: 'number',
        valueFormatter: numberCellFormatter,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
    },
    {
        headerName: 'SX / PX',
        field: 'sxPx',
        width: 200,
        aggFunc: 'sum',
        enableValue: true,
        cellClass: 'number',
        valueFormatter: numberCellFormatter,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
    },
    {
        headerName: '99 Out',
        field: '_99Out',
        width: 200,
        aggFunc: 'sum',
        enableValue: true,
        cellClass: 'number',
        valueFormatter: numberCellFormatter,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
    },
    {
        headerName: 'Submitter ID',
        field: 'submitterID',
        width: 200,
        aggFunc: 'sum',
        enableValue: true,
        cellClass: 'number',
        valueFormatter: numberCellFormatter,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
    },
    {
        headerName: 'Submitted Deal ID',
        field: 'submitterDealID',
        width: 200,
        aggFunc: 'sum',
        enableValue: true,
        cellClass: 'number',
        valueFormatter: numberCellFormatter,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
    },

    // some string values, that do not get aggregated
    {
        field: 'dealType',
        enableRowGroup: true,
        filter: 'agTextColumnFilter',
    },
    {
        headerName: 'Bid',
        field: 'bidFlag',
        enableRowGroup: true,
        width: 100,
        filter: 'agTextColumnFilter',
    },
    { field: 'comment', editable: true, filter: 'agTextColumnFilter' },
];

// simple value getter, however we can see how many times it gets called. this
// gives us an indication to how many rows get recalculated when data changes
function changeValueGetter(params: ValueGetterParams) {
    return params.data.previous - params.data.current;
}

// a list of the data, that we modify as we go. if you are using an immutable
// data store (such as Redux) then this would be similar to your store of data.
let globalRowData: any[] = [];

// build up the test data
function createRowData() {
    globalRowData = [];
    const thisBatch = nextBatchId++;
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        productToPortfolioToBooks[product] = {};
        for (let j = 0; j < portfolios.length; j++) {
            const portfolio = portfolios[j];
            productToPortfolioToBooks[product][portfolio] = [];

            const bookCount = randomBetween(MAX_BOOK_COUNT, MIN_BOOK_COUNT);

            for (let k = 0; k < bookCount; k++) {
                const book = createBookName();
                productToPortfolioToBooks[product][portfolio].push(book);
                const tradeCount = randomBetween(MAX_TRADE_COUNT, MIN_TRADE_COUNT);
                for (let l = 0; l < tradeCount; l++) {
                    const trade = createTradeRecord(product, portfolio, book, thisBatch);
                    globalRowData.push(trade);
                }
            }
        }
    }
}

function randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createTradeRecord(product: any, portfolio: any, book: any, batch: any) {
    const current = Math.floor(Math.random() * 100000) + 100;
    const previous = current + Math.floor(Math.random() * 10000) - 2000;
    const trade = {
        product: product,
        portfolio: portfolio,
        book: book,
        trade: createTradeId(),
        submitterID: randomBetween(10, 1000),
        submitterDealID: randomBetween(10, 1000),
        dealType: Math.random() < 0.2 ? 'Physical' : 'Financial',
        bidFlag: Math.random() < 0.5 ? 'Buy' : 'Sell',
        current: current,
        previous: previous,
        pl1: randomBetween(100, 1000),
        pl2: randomBetween(100, 1000),
        gainDx: randomBetween(100, 1000),
        sxPx: randomBetween(100, 1000),
        _99Out: randomBetween(100, 1000),
        batch: batch,
    };
    return trade;
}

function numberCellFormatter(params: ValueFormatterParams) {
    return Math.floor(params.value)
        .toString()
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

function createBookName() {
    nextBookId++;
    return 'GL-' + nextBookId;
}

function createTradeId() {
    nextTradeId++;
    return nextTradeId;
}

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
        width: 120,
        filter: 'agNumberColumnFilter',
    },
    autoGroupColumnDef: {
        width: 250,
        field: 'trade',
    },
    rowSelection: {
        mode: 'multiRow',
        groupSelects: 'descendants',
        headerCheckbox: false,
    },
    rowData: globalRowData,
    suppressAggFuncInHeader: true,
    getRowId: (params: GetRowIdParams) => String(params.data.trade),
    onGridReady: (params) => {
        createRowData();
        params.api.setGridOption('rowData', globalRowData);
    },
};

function updateData() {
    removeSomeItems();
    addSomeItems();
    updateSomeItems();
    gridApi!.setGridOption('rowData', globalRowData);
}

function updateSomeItems() {
    const updateCount = randomBetween(1, 6);
    const itemsToUpdate = [];
    for (let k = 0; k < updateCount; k++) {
        if (globalRowData.length === 0) {
            continue;
        }
        const indexToUpdate = Math.floor(Math.random() * globalRowData.length);
        const itemToUpdate = globalRowData[indexToUpdate];

        // make a copy of the item, and make some changes, so we are behaving
        // similar to how the
        const updatedItem = updateImmutableObject(itemToUpdate, {
            previous: itemToUpdate.current,
            current: itemToUpdate.current + randomBetween(0, 1000) - 500,
        });
        globalRowData[indexToUpdate] = updatedItem;

        itemsToUpdate.push(updatedItem);
    }
    return itemsToUpdate;
}

function addSomeItems() {
    const addCount = randomBetween(1, 6);
    const itemsToAdd = [];
    const batch = nextBatchId++;
    for (let j = 0; j < addCount; j++) {
        const portfolio = portfolios[Math.floor(Math.random() * portfolios.length)];
        const books = productToPortfolioToBooks['Palm Oil'][portfolio];
        const book = books[Math.floor(Math.random() * books.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        const trade = createTradeRecord(product, portfolio, book, batch);
        itemsToAdd.push(trade);
        globalRowData.push(trade);
    }
    return itemsToAdd;
}

function removeSomeItems() {
    const removeCount = randomBetween(1, 6);
    const itemsToRemove = [];
    for (let i = 0; i < removeCount; i++) {
        if (globalRowData.length === 0) {
            continue;
        }
        const indexToRemove = randomBetween(0, globalRowData.length);
        const itemToRemove = globalRowData[indexToRemove];
        globalRowData.splice(indexToRemove, 1);
        itemsToRemove.push(itemToRemove);
    }
    return itemsToRemove;
}

// makes a copy of the original and merges in the new values
function updateImmutableObject(original: any, newValues: any) {
    // start with new object
    const newObject: any = {};

    // copy in the old values
    Object.keys(original).forEach((key) => {
        newObject[key] = original[key];
    });

    // now override with the new values
    Object.keys(newValues).forEach((key) => {
        newObject[key] = newValues[key];
    });

    return newObject;
}

// after page is loaded, create the grid.
document.addEventListener('DOMContentLoaded', function () {
    const eGridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(eGridDiv, gridOptions);
});
