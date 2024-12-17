import type { GridApi, GridOptions } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry, createGrid, themeQuartz } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule]);

const myTheme = themeQuartz.withParams({
    // color and style of border around selection
    rangeSelectionBorderColor: 'rgb(193, 0, 97)',
    rangeSelectionBorderStyle: 'dashed',
    // background color of selection - you can use a semi-transparent color
    // and it wil overlay on top of the existing cells
    rangeSelectionBackgroundColor: 'rgb(255, 0, 128, 0.1)',
    // color used to indicate that data has been copied form the cell range
    rangeSelectionHighlightColor: 'rgb(60, 188, 0, 0.3)',
});

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    theme: myTheme,
    columnDefs: [
        { field: 'athlete', minWidth: 150 },
        { field: 'age', maxWidth: 90 },
        { field: 'country', minWidth: 150 },
        { field: 'year', maxWidth: 90 },
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
    },
    cellSelection: true,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => {
            gridApi!.setGridOption('rowData', data);
            gridApi.addCellRange({
                rowStartIndex: 1,
                rowEndIndex: 5,
                columns: ['age', 'country', 'year', 'date'],
            });
        });
});
