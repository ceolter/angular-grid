import type { GridApi, GridOptions, IDatasource, SortModelItem } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { InfiniteRowModelModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete', colId: 'athlete', minWidth: 180 },
        { field: 'age', colId: 'age' },
        { field: 'country', colId: 'country', minWidth: 180 },
        { field: 'year', colId: 'year' },
        { field: 'sport', colId: 'sport', minWidth: 180 },
    ],
    defaultColDef: {
        flex: 1,
        filter: true,
    },
    rowModelType: 'infinite',
};

function onBtShowYearColumn() {
    gridApi!.setGridOption('columnDefs', [
        { field: 'athlete', colId: 'athlete' },
        { field: 'age', colId: 'age' },
        { field: 'country', colId: 'country' },
        { field: 'year', colId: 'year' },
        { field: 'sport', colId: 'sport' },
    ]);
}

function onBtHideYearColumn() {
    gridApi!.setGridOption('columnDefs', [
        { field: 'athlete', colId: 'athlete' },
        { field: 'age', colId: 'age' },
        { field: 'country', colId: 'country' },
        { field: 'sport', colId: 'sport' },
    ]);
}

function sortAndFilter(allOfTheData: any[], sortModel: SortModelItem[], filterModel: any) {
    return sortData(sortModel, filterData(filterModel, allOfTheData));
}

function sortData(sortModel: SortModelItem[], data: any[]) {
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
}

function filterData(filterModel: any, data: any[]) {
    const filterPresent = filterModel && Object.keys(filterModel).length > 0;
    if (!filterPresent) {
        return data;
    }

    const resultOfFilter = [];
    for (let i = 0; i < data.length; i++) {
        var item = data[i];

        var filterFails = false;

        const filterKeys = Object.keys(filterModel);
        filterKeys.forEach((filterKey) => {
            const filterValue = filterModel[filterKey].filter;

            const valueForRow = item[filterKey];
            if (filterValue != valueForRow) {
                // year didn't match, so skip this record
                filterFails = true;
            }
        });

        // if (filterModel.year) {
        //     var val1 = filterModel.year.filter;
        //     var val2 = item.year;
        //     if (val1 != val2) {
        //         // year didn't match, so skip this record
        //         continue;
        //     }
        // }
        //

        if (!filterFails) {
            resultOfFilter.push(item);
        }
    }

    return resultOfFilter;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            // give each row an id
            data.forEach(function (d: any, index: number) {
                d.id = 'R' + (index + 1);
            });

            const dataSource: IDatasource = {
                rowCount: undefined, // behave as infinite scroll
                getRows: (params) => {
                    console.log('asking for ' + params.startRow + ' to ' + params.endRow);
                    // At this point in your code, you would call the server.
                    // To make the demo look real, wait for 500ms before returning
                    setTimeout(() => {
                        // take a slice of the total rows
                        const dataAfterSortingAndFiltering = sortAndFilter(data, params.sortModel, params.filterModel);
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

            gridApi!.setGridOption('datasource', dataSource);
        });
});
