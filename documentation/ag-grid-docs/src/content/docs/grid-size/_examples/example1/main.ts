import type { FirstDataRenderedEvent, GridApi, GridOptions, GridSizeChangedEvent } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ColumnApiModule,
    ColumnAutoSizeModule,
    ModuleRegistry,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    ColumnAutoSizeModule,
    ColumnApiModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete', minWidth: 150 },
        { field: 'age', minWidth: 70, maxWidth: 90 },
        { field: 'country', minWidth: 130 },
        { field: 'year', minWidth: 70, maxWidth: 90 },
        { field: 'date', minWidth: 120 },
        { field: 'sport', minWidth: 120 },
        { field: 'gold', minWidth: 80 },
        { field: 'silver', minWidth: 80 },
        { field: 'bronze', minWidth: 80 },
        { field: 'total', minWidth: 80 },
    ],
    onGridSizeChanged: onGridSizeChanged,
    onFirstDataRendered: onFirstDataRendered,
};

function onGridSizeChanged(params: GridSizeChangedEvent) {
    // get the current grids width
    const gridWidth = document.querySelector('.ag-body-viewport')!.clientWidth;

    // keep track of which columns to hide/show
    const columnsToShow = [];
    const columnsToHide = [];

    // iterate over all columns (visible or not) and work out
    // now many columns can fit (based on their minWidth)
    let totalColsWidth = 0;
    const allColumns = params.api.getColumns();
    if (allColumns && allColumns.length > 0) {
        for (let i = 0; i < allColumns.length; i++) {
            const column = allColumns[i];
            totalColsWidth += column.getMinWidth();
            if (totalColsWidth > gridWidth) {
                columnsToHide.push(column.getColId());
            } else {
                columnsToShow.push(column.getColId());
            }
        }
    }

    // show/hide columns based on current grid width
    params.api.setColumnsVisible(columnsToShow, true);
    params.api.setColumnsVisible(columnsToHide, false);

    // wait until columns stopped moving and fill out
    // any available space to ensure there are no gaps
    window.setTimeout(() => {
        params.api.sizeColumnsToFit();
    }, 10);
}

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.sizeColumnsToFit();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
