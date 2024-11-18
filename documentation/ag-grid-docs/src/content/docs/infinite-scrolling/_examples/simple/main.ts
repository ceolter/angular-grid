import type { GridApi, GridOptions, ICellRendererParams, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { InfiniteRowModelModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        // this row shows the row index, doesn't use any data from the row
        {
            headerName: 'ID',
            maxWidth: 100,
            // it is important to have node.id here, so that when the id changes (which happens
            // when the row is loaded) then the cell is refreshed.
            valueGetter: 'node.id',
            cellRenderer: (params: ICellRendererParams) => {
                if (params.value !== undefined) {
                    return params.value;
                } else {
                    return '<img src="https://www.ag-grid.com/example-assets/loading.gif">';
                }
            },
        },
        { field: 'athlete', minWidth: 150 },
        { field: 'age' },
        { field: 'country', minWidth: 150 },
        { field: 'year' },
        { field: 'date', minWidth: 150 },
        { field: 'sport', minWidth: 150 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        sortable: false,
    },
    rowBuffer: 0,
    // tell grid we want virtual row model type
    rowModelType: 'infinite',
    // how big each page in our page cache will be, default is 100
    cacheBlockSize: 100,
    // how many extra blank rows to display to the user at the end of the dataset,
    // which sets the vertical scroll and then allows the grid to request viewing more rows of data.
    // default is 1, ie show 1 row.
    cacheOverflowSize: 2,
    // how many server side requests to send at a time. if user is scrolling lots, then the requests
    // are throttled down
    maxConcurrentDatasourceRequests: 1,
    // how many rows to initially show in the grid. having 1 shows a blank row, so it looks like
    // the grid is loading from the users perspective (as we have a spinner in the first col)
    infiniteInitialRowCount: 1000,
    // how many pages to store in cache. default is undefined, which allows an infinite sized cache,
    // pages are never purged. this should be set for large data to stop your browser from getting
    // full of data
    maxBlocksInCache: 10,

    // debug: true,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            const dataSource: IDatasource = {
                rowCount: undefined, // behave as infinite scroll

                getRows: (params: IGetRowsParams) => {
                    console.log('asking for ' + params.startRow + ' to ' + params.endRow);

                    // At this point in your code, you would call the server.
                    // To make the demo look real, wait for 500ms before returning
                    setTimeout(() => {
                        // take a slice of the total rows
                        const rowsThisPage = data.slice(params.startRow, params.endRow);
                        // if on or after the last page, work out the last row.
                        let lastRow = -1;
                        if (data.length <= params.endRow) {
                            lastRow = data.length;
                        }
                        // call the success callback
                        params.successCallback(rowsThisPage, lastRow);
                    }, 500);
                },
            };

            gridApi!.setGridOption('datasource', dataSource);
        });
});
