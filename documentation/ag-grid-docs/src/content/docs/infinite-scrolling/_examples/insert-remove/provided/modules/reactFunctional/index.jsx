import React, { StrictMode, useCallback, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
    InfiniteRowModelModule,
    ModuleRegistry,
    RowApiModule,
    RowStyleModule,
    ScrollApiModule,
    ValidationModule,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

ModuleRegistry.registerModules([
    RowApiModule,
    ScrollApiModule,
    RowStyleModule,
    InfiniteRowModelModule,
    ValidationModule /* Development Only */,
]);

const valueFormatter = function (params) {
    if (typeof params.value === 'number') {
        return '£' + params.value.toLocaleString();
    } else {
        return params.value;
    }
};

// this counter is used to give id's to the rows
let sequenceId = 0;
let allOfTheData = [];

const createRowData = (id) => {
    const makes = ['Toyota', 'Ford', 'Porsche', 'Chevy', 'Honda', 'Nissan'];
    const models = ['Cruze', 'Celica', 'Mondeo', 'Boxster', 'Genesis', 'Accord', 'Taurus'];
    return {
        id: id,
        make: makes[id % makes.length],
        model: models[id % models.length],
        price: 72000,
    };
};

const insertItemsAt2 = (count) => {
    const newDataItems = [];
    for (let i = 0; i < count; i++) {
        const newItem = createRowData(sequenceId++);
        allOfTheData.splice(2, 0, newItem);
        newDataItems.push(newItem);
    }
    return newDataItems;
};

const GridExample = () => {
    const gridRef = useRef(null);
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);

    const [columnDefs, setColumnDefs] = useState([
        {
            headerName: 'Item ID',
            field: 'id',
            valueGetter: 'node.id',
            cellRenderer: (props) => {
                if (props.value !== undefined) {
                    return props.value;
                } else {
                    return <img src="https://www.ag-grid.com/example-assets/loading.gif" />;
                }
            },
        },
        { field: 'make' },
        { field: 'model' },
        {
            field: 'price',
            valueFormatter: valueFormatter,
        },
    ]);
    const datasource = useMemo(() => {
        return {
            rowCount: undefined,
            getRows: (params) => {
                console.log('asking for ' + params.startRow + ' to ' + params.endRow);
                // At this point in your code, you would call the server.
                // To make the demo look real, wait for 500ms before returning
                setTimeout(function () {
                    // take a slice of the total rows
                    const rowsThisPage = allOfTheData.slice(params.startRow, params.endRow);
                    // make a copy of each row - this is what would happen if taking data from server
                    for (let i = 0; i < rowsThisPage.length; i++) {
                        const item = rowsThisPage[i];
                        // this is a trick to copy an object
                        const itemCopy = JSON.parse(JSON.stringify(item));
                        rowsThisPage[i] = itemCopy;
                    }
                    // if on or after the last page, work out the last row.
                    let lastRow = -1;
                    if (allOfTheData.length <= params.endRow) {
                        lastRow = allOfTheData.length;
                    }
                    // call the success callback
                    params.successCallback(rowsThisPage, lastRow);
                }, 500);
            },
        };
    }, []);
    const defaultColDef = useMemo(() => {
        return {
            flex: 1,
            sortable: false,
        };
    }, []);
    const getRowId = useCallback(function (params) {
        return params.data.id.toString();
    }, []);
    const getRowStyle = useCallback(function (params) {
        if (params.data && params.data.make === 'Honda') {
            return {
                fontWeight: 'bold',
            };
        }
        return {
            fontWeight: 'normal',
        };
    }, []);

    const onGridReady = useCallback((params) => {
        sequenceId = 1;
        allOfTheData = [];
        for (let i = 0; i < 1000; i++) {
            allOfTheData.push(createRowData(sequenceId++));
        }
    }, []);

    const insertItemsAt2AndRefresh = useCallback((count) => {
        insertItemsAt2(count);
        // if the data has stopped looking for the last row, then we need to adjust the
        // row count to allow for the extra data, otherwise the grid will not allow scrolling
        // to the last row. eg if we have 1000 rows, scroll all the way to the bottom (so
        // maxRowFound=true), and then add 5 rows, the rowCount needs to be adjusted
        // to 1005, so grid can scroll to the end. the grid does NOT do this for you in the
        // refreshInfiniteCache() method, as this would be assuming you want to do it which
        // is not true, maybe the row count is constant and you just want to refresh the details.
        const maxRowFound = gridRef.current.api.isLastRowIndexKnown();
        if (maxRowFound) {
            const rowCount = gridRef.current.api.getDisplayedRowCount() || 0;
            gridRef.current.api.setRowCount(rowCount + count);
        }
        // get grid to refresh the data
        gridRef.current.api.refreshInfiniteCache();
    }, []);

    const removeItem = useCallback(
        (start, limit) => {
            allOfTheData.splice(start, limit);
            gridRef.current.api.refreshInfiniteCache();
        },
        [allOfTheData]
    );

    const refreshCache = useCallback(() => {
        gridRef.current.api.refreshInfiniteCache();
    }, []);

    const purgeCache = useCallback(() => {
        gridRef.current.api.purgeInfiniteCache();
    }, []);

    const setRowCountTo200 = useCallback(() => {
        gridRef.current.api.setRowCount(200, false);
    }, []);

    const rowsAndMaxFound = useCallback(() => {
        console.log('getDisplayedRowCount() => ' + gridRef.current.api.getDisplayedRowCount());
        console.log('isLastRowIndexKnown() => ' + gridRef.current.api.isLastRowIndexKnown());
    }, []);

    // function just gives new prices to the row data, it does not update the grid
    const setPricesHigh = useCallback(() => {
        allOfTheData.forEach(function (dataItem) {
            dataItem.price = Math.round(55500 + 400 * (0.5 + Math.random()));
        });
    }, [allOfTheData]);

    const setPricesLow = useCallback(() => {
        allOfTheData.forEach(function (dataItem) {
            dataItem.price = Math.round(1000 + 100 * (0.5 + Math.random()));
        });
    }, [allOfTheData]);

    const jumpTo500 = useCallback(() => {
        // first up, need to make sure the grid is actually showing 500 or more rows
        if ((gridRef.current.api.getDisplayedRowCount() || 0) < 501) {
            gridRef.current.api.setRowCount(501, false);
        }
        // next, we can jump to the row
        gridRef.current.api.ensureIndexVisible(500);
    }, []);

    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ marginBottom: '10px' }}>
                    <button onClick={() => insertItemsAt2AndRefresh(5)}>Insert Rows</button>
                    <button onClick={() => removeItem(3, 10)}>Delete Rows</button>
                    <button onClick={setRowCountTo200}>Set Row Count</button>
                    <button onClick={rowsAndMaxFound}>Print Info</button>
                    <button onClick={jumpTo500}>Jump to 500</button>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <button onClick={setPricesHigh}>Set Prices High</button>
                    <button onClick={setPricesLow}>Set Prices Low</button>
                    <button onClick={refreshCache}>Refresh Cache</button>
                    <button onClick={purgeCache}>Purge Cache</button>
                </div>
                <div style={{ flexGrow: '1' }}>
                    <div style={gridStyle}>
                        <AgGridReact
                            ref={gridRef}
                            columnDefs={columnDefs}
                            datasource={datasource}
                            defaultColDef={defaultColDef}
                            rowModelType={'infinite'}
                            maxBlocksInCache={2}
                            infiniteInitialRowCount={500}
                            maxConcurrentDatasourceRequests={2}
                            getRowId={getRowId}
                            getRowStyle={getRowStyle}
                            onGridReady={onGridReady}
                        />
                    </div>
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
