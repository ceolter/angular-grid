import type { ColDef, GridApi, GridOptions, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    HighlightChangesModule,
    ModuleRegistry,
    RenderApiModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    RenderApiModule,
    HighlightChangesModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const gbpFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
});
const eurFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
});
const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
});

const currencyCellRenderer = (params: ICellRendererParams) => {
    switch (params.value.currency) {
        case 'EUR':
            return eurFormatter.format(params.value.amount);
        case 'USD':
            return usdFormatter.format(params.value.amount);
        case 'GBP':
            return gbpFormatter.format(params.value.amount);
    }
    return params.value.amount;
};

const columnDefs: ColDef[] = [
    { field: 'product' },
    { headerName: 'Currency', field: 'price.currency' },
    {
        headerName: 'Price Local',
        field: 'price',
        cellRenderer: currencyCellRenderer,
        cellDataType: false,
    },
    {
        headerName: 'Report Price',
        field: 'price',
        cellRenderer: currencyCellRenderer,
        valueGetter: reportingCurrencyValueGetter,
        headerValueGetter: 'ctx.reportingCurrency',
    },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        enableCellChangeFlash: true,
    },
    rowData: getData(),
    context: {
        reportingCurrency: 'EUR',
    },
};

function reportingCurrencyValueGetter(params: ValueGetterParams) {
    // Rates taken from google at time of writing
    const exchangeRates: Record<string, any> = {
        EUR: {
            GBP: 0.72,
            USD: 1.08,
        },
        GBP: {
            EUR: 1.29,
            USD: 1.5,
        },
        USD: {
            GBP: 0.67,
            EUR: 0.93,
        },
    };

    const price = params.data[params.colDef.field!];
    const reportingCurrency = params.context.reportingCurrency;
    const fxRateSet = exchangeRates[reportingCurrency];
    const fxRate = fxRateSet[price.currency];
    let priceInReportingCurrency;
    if (fxRate) {
        priceInReportingCurrency = price.amount * fxRate;
    } else {
        priceInReportingCurrency = price.amount;
    }

    const result = {
        currency: reportingCurrency,
        amount: priceInReportingCurrency,
    };

    return result;
}

function currencyChanged() {
    const value = (document.getElementById('currency') as any).value;
    gridApi.setGridOption('context', { reportingCurrency: value });
    gridApi!.refreshCells();
    gridApi!.refreshHeader();
}

function getData() {
    return [
        { product: 'Product 1', price: { currency: 'EUR', amount: 644 } },
        { product: 'Product 2', price: { currency: 'EUR', amount: 354 } },
        { product: 'Product 3', price: { currency: 'GBP', amount: 429 } },
        { product: 'Product 4', price: { currency: 'GBP', amount: 143 } },
        { product: 'Product 5', price: { currency: 'USD', amount: 345 } },
        { product: 'Product 6', price: { currency: 'USD', amount: 982 } },
    ];
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
