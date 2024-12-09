import React, { StrictMode, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

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
} from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([
    HighlightChangesModule,
    TextEditorModule,
    NumberFilterModule,
    TextFilterModule,
    RowSelectionModule,
    CellStyleModule,
    ClientSideRowModelModule,
    RowGroupingModule,
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
const productToPortfolioToBooks = {};

// start the book id's and trade id's at some future random number,
// looks more realistic than starting them at 0
let nextBookId = 62472;
let nextTradeId = 24287;
let nextBatchId = 101;

// simple value getter, however we can see how many times it gets called. this
// gives us an indication to how many rows get recalculated when data changes
const changeValueGetter = (params) => {
    return params.data.previous - params.data.current;
};

// build up the test data
const createRowData = () => {
    const data = [];
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
                    data.push(trade);
                }
            }
        }
    }
    return data;
};

const randomBetween = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const createTradeRecord = (product, portfolio, book, batch) => {
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
};

const numberCellFormatter = (params) => {
    return Math.floor(params.value)
        .toString()
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};

const createBookName = () => {
    nextBookId++;
    return 'GL-' + nextBookId;
};

const createTradeId = () => {
    nextTradeId++;
    return nextTradeId;
};

const updateSomeItems = (rowData) => {
    const updateCount = randomBetween(1, 6);
    for (let k = 0; k < updateCount; k++) {
        if (rowData.length === 0) {
            continue;
        }
        const indexToUpdate = Math.floor(Math.random() * rowData.length);
        const itemToUpdate = rowData[indexToUpdate];
        // make a copy of the item, and make some changes, so we are behaving
        // similar to how the
        const updatedItem = updateImmutableObject(itemToUpdate, {
            previous: itemToUpdate.current,
            current: itemToUpdate.current + randomBetween(0, 1000) - 500,
        });
        rowData[indexToUpdate] = updatedItem;
    }
};

const addSomeItems = (rowData) => {
    const addCount = randomBetween(1, 6);
    const batch = nextBatchId++;
    for (let j = 0; j < addCount; j++) {
        const portfolio = portfolios[Math.floor(Math.random() * portfolios.length)];
        const books = productToPortfolioToBooks['Palm Oil'][portfolio];
        const book = books[Math.floor(Math.random() * books.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        const trade = createTradeRecord(product, portfolio, book, batch);
        rowData.push(trade);
    }
};

const removeSomeItems = (rowData) => {
    const removeCount = randomBetween(1, 6);
    for (let i = 0; i < removeCount; i++) {
        if (rowData.length === 0) {
            continue;
        }
        const indexToRemove = randomBetween(0, rowData.length);
        rowData.splice(indexToRemove, 1);
    }
};

// makes a copy of the original and merges in the new values
const updateImmutableObject = (original, newValues) => {
    // start with new object
    const newObject = {};
    // copy in the old values
    Object.keys(original).forEach(function (key) {
        newObject[key] = original[key];
    });
    // now override with the new values
    Object.keys(newValues).forEach(function (key) {
        newObject[key] = newValues[key];
    });
    return newObject;
};

const rowSelection = {
    mode: 'multiRow',
    groupSelects: 'descendants',
    headerCheckbox: false,
};

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);

    // a list of the data, that we modify as we go. if you are using an immutable
    // data store (such as Redux) then this would be similar to your store of data.
    const [globalRowData, setGlobalData] = useState(createRowData());

    const [rowData, setRowData] = useState();
    const [columnDefs, setColumnDefs] = useState([
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
        { field: 'trade', width: 100 },
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
    ]);
    const defaultColDef = useMemo(() => {
        return {
            width: 120,
            filter: 'agNumberColumnFilter',
        };
    }, []);
    const autoGroupColumnDef = useMemo(() => {
        return {
            width: 250,
            field: 'trade',
        };
    }, []);
    const getRowId = useCallback(function (params) {
        return String(params.data.trade);
    }, []);

    const updateData = useCallback(() => {
        const rowData = globalRowData.splice(0);
        removeSomeItems(rowData);
        addSomeItems(rowData);
        updateSomeItems(rowData);
        setGlobalData(rowData);
    }, [globalRowData]);

    // update rowData when our "global store" updates
    useEffect(() => setRowData(globalRowData), [globalRowData]);

    return (
        <div style={containerStyle}>
            <div className="example-wrapper">
                <div style={{ marginBottom: '5px' }}>
                    <button onClick={updateData}>Update</button>
                </div>

                <div style={gridStyle}>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        autoGroupColumnDef={autoGroupColumnDef}
                        rowSelection={rowSelection}
                        suppressAggFuncInHeader={true}
                        getRowId={getRowId}
                    />
                </div>
            </div>
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(
    <StrictMode>
        <GridExample />
    </StrictMode>
);
