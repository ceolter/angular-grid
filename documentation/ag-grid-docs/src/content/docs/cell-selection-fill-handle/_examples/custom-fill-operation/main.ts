import type { FillEndEvent, FillStartEvent, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    TextEditorModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { CellSelectionModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    NumberEditorModule,
    TextEditorModule,
    ClientSideRowModelModule,
    CellSelectionModule,
    ValidationModule /* Development Only */,
]);

const daysList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'athlete', minWidth: 150 },
        { headerName: 'Day of the Week', field: 'dayOfTheWeek', minWidth: 180 },
        { field: 'age', maxWidth: 90 },
        { field: 'country', minWidth: 150 },
        { field: 'year', maxWidth: 90 },
        { field: 'date', minWidth: 150 },
        { field: 'sport', minWidth: 150 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        editable: true,
        cellDataType: false,
    },
    cellSelection: {
        handle: {
            mode: 'fill',
            setFillValue(params) {
                const hasNonDayValues = params.initialValues.some(function (val) {
                    return daysList.indexOf(val) === -1;
                });

                if (hasNonDayValues) {
                    return false;
                }

                const lastValue = params.values[params.values.length - 1];
                const idxOfLast = daysList.indexOf(lastValue);
                const nextDay = daysList[(idxOfLast + 1) % daysList.length];
                console.log('Custom Fill Operation -> Next Day is:', nextDay);
                return nextDay;
            },
        },
    },
    onFillStart: (event: FillStartEvent) => {
        console.log('Fill Start', event);
    },
    onFillEnd: (event: FillEndEvent) => {
        console.log('Fill End', event);
    },
};

function createRowData(rowData: any[]) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    for (let i = 0; i < rowData.length; i++) {
        const dt = new Date(getRandom(currentYear - 10, currentYear + 10), getRandom(0, 12), getRandom(1, 25));
        rowData[i].dayOfTheWeek = daysList[dt.getDay()];
    }
    return rowData;
}
var getRandom = function (start: number, finish: number) {
    return Math.floor(Math.random() * (finish - start) + start);
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            gridApi!.setGridOption('rowData', createRowData(data));
        });
});
