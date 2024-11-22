import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions, IAggFuncParams, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    RowGroupingModule,
    SetFilterModule,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'country', rowGroup: true, hide: true },
        { field: 'total', aggFunc: 'range' },
        {
            headerName: 'Gold to Silver',
            colId: 'goldSilverRatio',
            aggFunc: 'ratio',
            valueGetter: ratioValueGetter,
            valueFormatter: ratioFormatter,
        },
    ],
    aggFuncs: {
        range: (params) => {
            const values = params.values;
            return values.length > 0 ? Math.max(...values) - Math.min(...values) : null;
        },
        ratio: ratioAggFunc,
    },
    defaultColDef: {
        flex: 1,
        minWidth: 150,
    },
    autoGroupColumnDef: {
        minWidth: 220,
    },
};

function ratioValueGetter(params: ValueGetterParams<IOlympicData>) {
    if (!(params.node && params.node.group)) {
        // no need to handle group levels - calculated in the 'ratioAggFunc'
        return createValueObject(params.data!.gold, params.data!.silver);
    }
}

function ratioAggFunc(params: IAggFuncParams) {
    let goldSum = 0;
    let silverSum = 0;
    params.values.forEach((value) => {
        if (value && value.gold) {
            goldSum += value.gold;
        }
        if (value && value.silver) {
            silverSum += value.silver;
        }
    });
    return createValueObject(goldSum, silverSum);
}

function createValueObject(gold: number, silver: number) {
    return {
        gold: gold,
        silver: silver,
        toString: () => `${gold && silver ? gold / silver : 0}`,
    };
}

function ratioFormatter(params: ValueFormatterParams) {
    if (!params.value || params.value === 0) return '';
    return '' + Math.round(params.value * 100) / 100;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
