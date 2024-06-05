import { type ColDef, type GetRowIdFunc, type GetRowIdParams } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import classNames from 'classnames';
import { type FunctionComponent, useCallback, useRef, useState } from 'react';

import { type PortfolioItem } from '../../../types';
import { currencyFormatter, percentageFormatter } from '../../utils/valueFormatters';
import {
    calculate52wChange,
    costCalculator,
    pnlCalculator,
    pnlPercentCalculator,
    valueCalculator,
} from '../../utils/valueGetters';
import { TickerCellRenderer } from '../ticker-cell-renderer/TickerCellRenderer';
import styles from './PortfolioExample.module.css';
import { INITIAL_UPDATE_INTERVAL_MULTIPLIER, UPDATE_INTERVAL } from './constants';
import { generatePortfolio } from './data';
import { useDataGenerator } from './useDataGenerator';

interface Props {
    gridTheme?: string;
    isDarkMode?: boolean;
}

const rangeConfig = {
    min: 0,
    max: 4,
    step: 0.1,
};

const PortfolioExample: FunctionComponent<Props> = ({ gridTheme = 'ag-theme-quartz', isDarkMode }) => {
    const gridRef = useRef<AgGridReact>(null);
    const [rowData, setRowData] = useState<PortfolioItem[]>(generatePortfolio());
    const [colDefs] = useState<ColDef[]>([
        {
            headerName: 'Symbol',
            field: 'ticker',
            cellDataType: 'text',
            pinned: 'left',
            width: 150,
            cellRenderer: TickerCellRenderer,
        },
        {
            headerName: 'P/L',
            type: 'rightAligned',
            valueGetter: pnlCalculator,
            cellDataType: 'number',
            cellClass: (params) => {
                return classNames({
                    'cell-green': params.value > 0,
                    'cell-red': params.value <= 0,
                });
            },
            valueFormatter: currencyFormatter,
            width: 150,
            pivot: true,
            aggFunc: 'sum',
            suppressHeaderFilterButton: true,
        },
        {
            headerName: 'Last',
            type: 'rightAligned',
            cellDataType: 'number',
            field: 'currentPrice',
            valueFormatter: currencyFormatter,
            width: 120,
            aggFunc: 'avg',
            suppressHeaderFilterButton: true,
        },

        {
            headerName: 'P/L %',
            type: 'rightAligned',
            valueGetter: pnlPercentCalculator,
            valueFormatter: percentageFormatter,
            width: 100,
            aggFunc: 'avg',
            suppressHeaderFilterButton: true,
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
                    axis: {
                        stroke: 'rgba(0,0,0,0.2)', // sets the axis line stroke
                        strokeWidth: 1, // sets the axis line strokeWidth
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
            flex: 1,
            suppressHeaderFilterButton: true,
        },
        {
            headerName: 'Instrument',
            field: 'instrument',
            cellDataType: 'text',
            rowGroup: true,
            hide: true,
            width: 150,
            suppressHeaderFilterButton: true,
        },
        {
            headerName: 'CCY',
            field: 'ccy',
            cellDataType: 'text',
            enableRowGroup: true,
            width: 100,
            suppressHeaderFilterButton: true,
        },
        {
            headerName: 'Purchase Date',
            field: 'buyDate',
            cellDataType: 'dateString',
            width: 180,
            suppressHeaderFilterButton: true,
        },
        {
            headerName: 'Quantity',
            type: 'rightAligned',
            field: 'quantity',
            cellDataType: 'number',
            width: 120,
            suppressHeaderFilterButton: true,
        },
        {
            headerName: 'Cost Price',
            type: 'rightAligned',
            field: 'buyPrice',
            cellDataType: 'number',
            valueFormatter: currencyFormatter,
            width: 120,
            aggFunc: 'avg',
            suppressHeaderFilterButton: true,
        },
        {
            headerName: 'Total Cost',
            type: 'rightAligned',
            cellDataType: 'number',
            valueGetter: costCalculator,
            valueFormatter: currencyFormatter,
            width: 150,
            aggFunc: 'sum',
            suppressHeaderFilterButton: true,
        },
        {
            headerName: 'Total Value',
            type: 'rightAligned',
            cellDataType: 'number',
            valueGetter: valueCalculator,
            valueFormatter: currencyFormatter,
            width: 150,
            aggFunc: 'sum',
            suppressHeaderFilterButton: true,
        },
        {
            headerName: '52w Change %',
            type: 'rightAligned',
            valueGetter: calculate52wChange,
            valueFormatter: percentageFormatter,
            width: 150,
            cellClass: (params) => {
                return classNames({
                    'cell-green': params.value > 0,
                    'cell-red': params.value <= 0,
                });
            },
            aggFunc: 'avg',
            suppressHeaderFilterButton: true,
        },
    ]);
    const getRowId = useCallback<GetRowIdFunc>((params: GetRowIdParams) => {
        return params.data.ticker;
    }, []);
    const generator = useDataGenerator({
        gridRef,
        rowData,
        setRowData,
    });
    const onGridReady = useCallback(() => {
        generator.start();
    }, []);
    const [updateSpeed, setUpdateSpeed] = useState<number>(INITIAL_UPDATE_INTERVAL_MULTIPLIER);

    const themeClass = isDarkMode ? `${gridTheme}-dark` : gridTheme;

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <div className={`${themeClass} ${styles.grid}`}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={rowData}
                        onGridReady={onGridReady}
                        getRowId={getRowId}
                        columnDefs={colDefs}
                        defaultColDef={{
                            resizable: true,
                        }}
                        enableRangeSelection={true}
                        enableCharts={true}
                        rowSelection="multiple"
                        suppressAggFuncInHeader={true}
                        statusBar={{
                            statusPanels: [
                                { statusPanel: 'agTotalAndFilteredRowCountComponent' },
                                { statusPanel: 'agTotalRowCountComponent' },
                                { statusPanel: 'agFilteredRowCountComponent' },
                                { statusPanel: 'agSelectedRowCountComponent' },
                                { statusPanel: 'agAggregationComponent' },
                            ],
                        }}
                        groupDisplayType="groupRows"
                        groupDefaultExpanded={1}
                        columnMenu="new"
                    />
                </div>
            </div>
        </div>
    );
};

export default PortfolioExample;
