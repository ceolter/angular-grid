import type { GridApi, GridOptions, ISetFilterParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnMenuModule, ColumnsToolPanelModule, ContextMenuModule, SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    SetFilterModule,
    NumberFilterModule,
    ValidationModule /* Development Only */,
]);

function replaceAccents(value: string) {
    return value
        .replace(new RegExp('[àáâãäå]', 'g'), 'a')
        .replace(new RegExp('æ', 'g'), 'ae')
        .replace(new RegExp('ç', 'g'), 'c')
        .replace(new RegExp('[èéêë]', 'g'), 'e')
        .replace(new RegExp('[ìíîï]', 'g'), 'i')
        .replace(new RegExp('ñ', 'g'), 'n')
        .replace(new RegExp('[òóôõøö]', 'g'), 'o')
        .replace(new RegExp('œ', 'g'), 'oe')
        .replace(new RegExp('[ùúûü]', 'g'), 'u')
        .replace(new RegExp('[ýÿ]', 'g'), 'y')
        .replace(new RegExp('\\W', 'g'), '');
}

const filterParams: ISetFilterParams = {
    textFormatter: replaceAccents,
};

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        // set filter
        {
            field: 'athlete',
            filter: 'agSetColumnFilter',
            filterParams: filterParams,
        },
        // number filters
        { field: 'gold', filter: 'agNumberColumnFilter' },
        { field: 'silver', filter: 'agNumberColumnFilter' },
        { field: 'bronze', filter: 'agNumberColumnFilter' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 200,
        floatingFilter: true,
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
