import type { GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';
import {
    ColumnMenuModule,
    ColumnsToolPanelModule,
    ContextMenuModule,
    RowGroupingModule,
    SetFilterModule,
} from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    RowGroupingModule,
    SetFilterModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'country', rowGroup: true, hide: true },
        { field: 'year', rowGroup: true, hide: true },
        { field: 'total', aggFunc: 'simpleRange' },
        { field: 'total', aggFunc: 'range' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 150,
    },
    autoGroupColumnDef: {
        minWidth: 220,
    },
    aggFuncs: {
        simpleRange: (params) => {
            const values = params.values;
            const max = Math.max(...values);
            const min = Math.min(...values);
            return max - min;
        },
        range: (params) => {
            const values = params.values;
            if (params.rowNode.leafGroup) {
                const max = Math.max(...values);
                const min = Math.min(...values);
                return {
                    max: max,
                    min: min,
                    value: max - min,
                };
            }

            let max = values[0].max;
            let min = values[0].min;
            values.forEach((value) => {
                max = Math.max(max, value.max);
                min = Math.min(min, value.min);
            });
            return {
                max: max,
                min: min,
                value: max - min,
            };
        },
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
