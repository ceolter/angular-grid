import type { AgSparklineOptions } from 'ag-charts-types';

import type { ColDef } from 'ag-grid-community';

import { ChangeCellRenderer } from '../../utils/grid/changeCellRenderer';
import { CurrentCellRenderer } from '../../utils/grid/currentCellRenderer';
import { toCurrency, toTime } from '../../utils/grid/formatters';
import { randomNumber, randomNumberList } from '../../utils/grid/generator-utils';
import { MAX_NUMBER, STOCK_NAMES, TIMELINE_SIZE } from './constants';

type Change = {
    value: number;
    time: Date;
};
export interface Stock {
    stock: string;
    current: number;
    time: Date;
    timeline: Change[];
}

const timelineTooltipRenderer = ({ datum, xKey, yKey }: any): any => {
    const xValue = datum[xKey];
    const yValue = datum[yKey];
    return {
        title: toTime({ value: xValue }),
        content: toCurrency({ value: yValue }),
        color: '#94b2d0',
        backgroundColor: '#07161b',
    };
};

function getLastValue(data: Stock): number {
    const { timeline } = data;
    return timeline[timeline.length - 2]?.value;
}

export const columnDefs: ColDef[] = [
    {
        field: 'stock',
        filter: 'agSetColumnFilter',
        flex: 1,
        initialWidth: 180,
        minWidth: 180,
    },
    {
        field: 'timeline',
        flex: 1,
        minWidth: 150,
        sortable: false,
        cellRenderer: 'agSparklineCellRenderer',
        cellRendererParams: {
            sparklineOptions: {
                type: 'bar',
                direction: 'vertical',
                xKey: 'time',
                yKey: 'value',
                theme: {
                    overrides: {
                        padding: {
                            top: 10,
                            bottom: 10,
                        },
                        paddingInner: 0.5,
                        paddingOuter: 0.5,
                        series: {
                            bar: {
                                fill: '#65819c',
                                strokeWidth: 0,
                            },
                        },
                    },
                },
                axis: {
                    type: 'category',
                    stroke: '#294056',
                },
                tooltip: {
                    renderer: timelineTooltipRenderer,
                },
            } as AgSparklineOptions,
        },
    },
    {
        field: 'current',
        type: 'numericColumn',
        valueFormatter: toCurrency,
        cellRenderer: CurrentCellRenderer,
        flex: 1,
        initialWidth: 130,
        minWidth: 130,
    },
    {
        headerName: 'Last',
        colId: 'last',
        type: 'numericColumn',
        valueGetter: ({ data }) => {
            return getLastValue(data);
        },
        valueFormatter: toCurrency,
        initialWidth: 110,
        minWidth: 110,
    },
    {
        headerName: '% Change',
        colId: 'percentageChange',
        type: 'numericColumn',
        valueGetter: ({ data }) => {
            const last = getLastValue(data);
            return data.current ? ((data.current - last) / data.current) * 100 : 0;
        },
        cellRenderer: ChangeCellRenderer,
        initialWidth: 150,
        minWidth: 150,
    },
];

function randomValue() {
    return randomNumber(MAX_NUMBER);
}

function generateRandomStock(stockName: string): Stock {
    const current = randomValue();
    const initialTimelineLength = TIMELINE_SIZE - 1;
    const previousTimeInterval = 1000;
    const timeline = randomNumberList({
        length: initialTimelineLength,
        maxNumber: MAX_NUMBER,
    }).map((value, index) => {
        const time = new Date(Date.now() - (initialTimelineLength - index + 1) * previousTimeInterval);
        return {
            value,
            time,
        };
    });
    const time = new Date();

    timeline.push({
        value: current,
        time,
    });

    return {
        stock: stockName,
        current,
        time,
        timeline,
    };
}

export function generateStockUpdate(stock: Stock): Stock {
    const current = randomValue();
    const time = new Date();
    const timeline = stock.timeline.slice(1, stock.timeline.length);
    timeline.push({
        value: current,
        time,
    });

    const newStock = Object.assign({}, stock, {
        current,
        time,
        timeline,
    });

    return newStock;
}

export function generateStocks() {
    return STOCK_NAMES.map(generateRandomStock);
}
