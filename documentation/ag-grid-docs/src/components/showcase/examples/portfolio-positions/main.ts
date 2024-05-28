import type { ColDef, GetRowIdParams, GridApi, GridOptions } from '@ag-grid-community/core';

import {
    calculate52wChange,
    costCalculator,
    currencyFormatter,
    percentageFormatter,
    pnlCalculator,
    pnlPercentCalculator,
    valueCalculator,
} from './calculations';
import { INITIAL_UPDATE_INTERVAL_MULTIPLIER, UPDATE_INTERVAL } from './constants';
import { generatePortfolio, generatePortfolioItemUpdate } from './data';
import { createGenerator } from './generator-utils';
import { imageCellRenderer } from './imageCellRenderer';
import { renderPdfLink } from './pdfRenderer';
import './styles.css';
import type { PortfolioItem } from './types';

const SLIDER_ID = 'finance-example-slider';
const SLIDER_VALUE_SELECTOR = `#${SLIDER_ID} .update-speed`;
let gridApi: GridApi<PortfolioItem>;

const columnDefs: ColDef[] = [
    {
        headerName: 'Symbol',
        field: 'ticker',
        cellDataType: 'text',
        pinned: 'left',
        width: 150,
        cellRenderer: imageCellRenderer, // Use the custom cell renderer
    },
    {
        headerName: 'P/L',
        valueGetter: pnlCalculator,
        cellDataType: 'number',
        cellStyle: (params) => {
            if (params.value > 0) {
                return { color: 'green' };
            } else {
                return { color: 'red' };
            }
        },
        valueFormatter: currencyFormatter,
        width: 150,
        pivot: true,
        aggFunc: 'sum',
    },
    {
        headerName: 'Last',
        cellDataType: 'number',
        field: 'currentPrice',
        valueFormatter: currencyFormatter,
        width: 100,
        aggFunc: 'avg',
    },

    {
        headerName: 'P/L %',
        valueGetter: pnlPercentCalculator,
        valueFormatter: percentageFormatter,
        width: 100,
        aggFunc: 'avg',
    },
    {
        headerName: 'Change',
        field: 'timeline',
        cellRenderer: 'agSparklineCellRenderer',
        cellRendererParams: {
            sparklineOptions: {
                type: 'area',
                xKey: 'time',
                yKey: 'value',
                fill: 'rgba(185,173,77,0.3)',
                line: {
                    stroke: 'rgb(185,173,77)',
                },
                highlightStyle: {
                    size: 4,
                    stroke: 'rgb(185,173,77)',
                    fill: 'rgb(185,173,77)',
                },
                crosshairs: {
                    xLine: {
                        enabled: true,
                        lineDash: 'dash',
                        stroke: '#999',
                    },
                    yLine: {
                        enabled: true,
                        lineDash: 'dash',
                        stroke: '#999',
                    },
                },
            },
        },
    },
    {
        headerName: 'CCY',
        field: 'ccy',
        cellDataType: 'text',
        enableRowGroup: true,
        width: 80,
    },
    {
        headerName: 'Instrument',
        field: 'instrument',
        cellDataType: 'text',

        rowGroup: true,
        hide: true,
        width: 150,
    },
    {
        headerName: 'Quantity',
        field: 'quantity',
        cellDataType: 'number',
        width: 120,
    },
    {
        headerName: 'Purchase Date',
        field: 'buyDate',
        cellDataType: 'dateString',
        width: 150,
    },
    {
        headerName: 'Cost Price',
        field: 'buyPrice',
        cellDataType: 'number',
        valueFormatter: currencyFormatter,
        width: 120,
        aggFunc: 'avg',
    },
    {
        headerName: 'Total Cost',
        cellDataType: 'number',
        valueGetter: costCalculator,
        valueFormatter: currencyFormatter,
        width: 150,
        aggFunc: 'sum',
    },
    {
        headerName: 'Total Value',
        cellDataType: 'number',
        valueGetter: valueCalculator,
        valueFormatter: currencyFormatter,
        width: 150,
        aggFunc: 'sum',
    },

    {
        headerName: '52w Change %',
        valueGetter: calculate52wChange,
        valueFormatter: percentageFormatter,
        width: 150,
        cellStyle: (params) => {
            if (params.value > 0) {
                return { color: 'green' };
            } else {
                return { color: 'red' };
            }
        },
        aggFunc: 'avg',
    },

    { headerName: 'Options', cellRenderer: renderPdfLink, width: 80, pinned: 'right' },
];

const rowData = generatePortfolio();
const generator = createGenerator({
    interval: UPDATE_INTERVAL / INITIAL_UPDATE_INTERVAL_MULTIPLIER,
    callback: () => {
        if (!gridApi) {
            return;
        }

        const randomIndex = Math.floor(Math.random() * rowData.length);
        const portfolioItemToUpdate = rowData[randomIndex];
        const newItem = generatePortfolioItemUpdate(portfolioItemToUpdate);

        rowData[randomIndex] = newItem;
        gridApi.applyTransactionAsync({
            update: [newItem],
        });
    },
});
const gridOptions: GridOptions = {
    rowData,
    getRowId: (params: GetRowIdParams) => {
        return params.data.ticker;
    },
    columnDefs: columnDefs,
    defaultColDef: {
        filter: true,
        resizable: true,
    },

    enableRangeSelection: true,
    enableCharts: true,
    rowSelection: 'multiple',
    suppressAggFuncInHeader: true,
    statusBar: {
        statusPanels: [
            { statusPanel: 'agTotalAndFilteredRowCountComponent' },
            { statusPanel: 'agTotalRowCountComponent' },
            { statusPanel: 'agFilteredRowCountComponent' },
            { statusPanel: 'agSelectedRowCountComponent' },
            { statusPanel: 'agAggregationComponent' },
        ],
    },
    groupDisplayType: 'groupRows',
    groupDefaultExpanded: 1,
};

function onBtExport() {
    gridApi.exportDataAsExcel();
}

function initSlider() {
    const slider = document.getElementById(SLIDER_ID);
    const sliderValue = document.querySelector(SLIDER_VALUE_SELECTOR);

    slider?.addEventListener('change', (event) => {
        const value = parseFloat(event.target?.value);

        const displayValue = value <= 0 ? '0' : `${value}x`;
        sliderValue!.innerHTML = displayValue;

        const updateInterval = UPDATE_INTERVAL / value;
        generator.updateInterval(updateInterval);
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector('#myGrid');
    gridOptions.onGridReady = () => {
        generator.start();
    };
    gridApi = globalThis.agGrid.createGrid(gridDiv, gridOptions);

    const button = document.getElementById('export-to-excel');
    button?.addEventListener('click', () => {
        onBtExport();
    });

    initSlider();
});
