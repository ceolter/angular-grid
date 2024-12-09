import React, { StrictMode, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
    InfiniteRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    RowSelectionModule,
    ValidationModule,
} from 'ag-grid-community';
import { ColumnMenuModule, ColumnsToolPanelModule, ContextMenuModule, SetFilterModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import { getCountries } from './countries.jsx';

ModuleRegistry.registerModules([
    NumberFilterModule,
    RowSelectionModule,
    InfiniteRowModelModule,
    SetFilterModule,
    ColumnMenuModule,
    ContextMenuModule,
    ColumnsToolPanelModule,
    ValidationModule /* Development Only */,
]);

const filterParams = { values: getCountries() };

const sortAndFilter = (allOfTheData, sortModel, filterModel) => {
    return sortData(sortModel, filterData(filterModel, allOfTheData));
};

const sortData = (sortModel, data) => {
    const sortPresent = sortModel && sortModel.length > 0;
    if (!sortPresent) {
        return data;
    }
    // do an in memory sort of the data, across all the fields
    const resultOfSort = data.slice();
    resultOfSort.sort(function (a, b) {
        for (let k = 0; k < sortModel.length; k++) {
            const sortColModel = sortModel[k];
            const valueA = a[sortColModel.colId];
            const valueB = b[sortColModel.colId];
            // this filter didn't find a difference, move onto the next one
            if (valueA == valueB) {
                continue;
            }
            const sortDirection = sortColModel.sort === 'asc' ? 1 : -1;
            if (valueA > valueB) {
                return sortDirection;
            } else {
                return sortDirection * -1;
            }
        }
        // no filters found a difference
        return 0;
    });
    return resultOfSort;
};

const filterData = (filterModel, data) => {
    const filterPresent = filterModel && Object.keys(filterModel).length > 0;
    if (!filterPresent) {
        return data;
    }
    const resultOfFilter = [];
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (filterModel.age) {
            const age = item.age;
            const allowedAge = parseInt(filterModel.age.filter);
            // EQUALS = 1;
            // LESS_THAN = 2;
            // GREATER_THAN = 3;
            if (filterModel.age.type == 'equals') {
                if (age !== allowedAge) {
                    continue;
                }
            } else if (filterModel.age.type == 'lessThan') {
                if (age >= allowedAge) {
                    continue;
                }
            } else {
                if (age <= allowedAge) {
                    continue;
                }
            }
        }
        if (filterModel.year) {
            if (filterModel.year.values.indexOf(item.year.toString()) < 0) {
                // year didn't match, so skip this record
                continue;
            }
        }
        if (filterModel.country) {
            if (filterModel.country.values.indexOf(item.country) < 0) {
                continue;
            }
        }
        resultOfFilter.push(item);
    }
    return resultOfFilter;
};

const rowSelection = {
    mode: 'multiRow',
    headerCheckbox: false,
};

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);

    const [columnDefs, setColumnDefs] = useState([
        // this row just shows the row index, doesn't use any data from the row
        {
            headerName: 'ID',
            maxWidth: 100,
            valueGetter: 'node.id',
            cellRenderer: (props) => {
                if (props.value !== undefined) {
                    return props.value;
                } else {
                    return <img src="https://www.ag-grid.com/example-assets/loading.gif" />;
                }
            },
            // we don't want to sort by the row index, this doesn't make sense as the point
            // of the row index is to know the row index in what came back from the server
            sortable: false,
            suppressHeaderMenuButton: true,
        },
        { field: 'athlete', suppressHeaderMenuButton: true },
        {
            field: 'age',
            filter: 'agNumberColumnFilter',
            filterParams: {
                filterOptions: ['equals', 'lessThan', 'greaterThan'],
                maxNumConditions: 1,
            },
        },
        {
            field: 'country',
            filter: 'agSetColumnFilter',
            filterParams: filterParams,
        },
        {
            field: 'year',
            filter: 'agSetColumnFilter',
            filterParams: { values: ['2000', '2004', '2008', '2012'] },
        },
        { field: 'date' },
        { field: 'sport', suppressHeaderMenuButton: true },
        { field: 'gold', suppressHeaderMenuButton: true },
        { field: 'silver', suppressHeaderMenuButton: true },
        { field: 'bronze', suppressHeaderMenuButton: true },
        { field: 'total', suppressHeaderMenuButton: true },
    ]);
    const defaultColDef = useMemo(() => {
        return {
            flex: 1,
            minWidth: 150,

            floatingFilter: true,
        };
    }, []);
    const getRowId = useCallback(function (params) {
        return params.data.id;
    }, []);

    const onGridReady = useCallback((params) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => {
                // give each row an id
                data.forEach(function (d, index) {
                    d.id = 'R' + (index + 1);
                });
                const dataSource = {
                    rowCount: undefined,
                    getRows: (params) => {
                        console.log('asking for ' + params.startRow + ' to ' + params.endRow);
                        // At this point in your code, you would call the server.
                        // To make the demo look real, wait for 500ms before returning
                        setTimeout(function () {
                            // take a slice of the total rows
                            const dataAfterSortingAndFiltering = sortAndFilter(
                                data,
                                params.sortModel,
                                params.filterModel
                            );
                            const rowsThisPage = dataAfterSortingAndFiltering.slice(params.startRow, params.endRow);
                            // if on or after the last page, work out the last row.
                            let lastRow = -1;
                            if (dataAfterSortingAndFiltering.length <= params.endRow) {
                                lastRow = dataAfterSortingAndFiltering.length;
                            }
                            // call the success callback
                            params.successCallback(rowsThisPage, lastRow);
                        }, 500);
                    },
                };
                params.api.setGridOption('datasource', dataSource);
            });
    }, []);

    return (
        <div style={containerStyle}>
            <div style={gridStyle}>
                <AgGridReact
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowSelection={rowSelection}
                    rowModelType={'infinite'}
                    cacheBlockSize={100}
                    cacheOverflowSize={2}
                    maxConcurrentDatasourceRequests={2}
                    infiniteInitialRowCount={1}
                    maxBlocksInCache={2}
                    getRowId={getRowId}
                    onGridReady={onGridReady}
                />
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
