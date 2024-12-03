import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    AllCommunityModule,
    ClientSideRowModelModule,
    type ColDef,
    type GetRowIdFunc,
    type GetRowIdParams,
    type GridSizeChangedEvent,
    ModuleRegistry,
    type ValueFormatterFunc,
    type ValueGetterParams,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import {
    AdvancedFilterModule,
    CellSelectionModule,
    ColumnMenuModule,
    ColumnsToolPanelModule,
    ContextMenuModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    IntegratedChartsModule,
    RichSelectModule,
    RowGroupingModule,
    RowGroupingPanelModule,
    SetFilterModule,
    SparklinesModule,
    StatusBarModule,
} from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import styles from './FinanceExample.module.css';
import { TickerCellRenderer } from './cell-renderers/TickerCellRenderer';
import { getData } from './data';

export interface Props {
    gridTheme?: string;
    isDarkMode?: boolean;
    gridHeight?: number | null;
    isSmallerGrid?: boolean;
    updateInterval?: number;
    enableRowGroup?: boolean;
}

type ColWidth = number | 'auto';

const DEFAULT_UPDATE_INTERVAL = 60;
const PERCENTAGE_CHANGE = 20;
const COLUMN_HEADER_NAME_PRIORITIES = ['ticker', 'timeline', 'totalValue', 'instrument', 'p&l', 'price', 'quantity'];
const BREAKPOINT_MEDIUM = 750;
const BREAKPOINT_SMALL = 400;
const TICKER_SIZES: Record<string, ColWidth> = {
    small: 'auto',
    medium: 180,
    large: 380,
};

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    AdvancedFilterModule,
    ColumnsToolPanelModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    CellSelectionModule,
    RowGroupingModule,
    RowGroupingPanelModule,
    SetFilterModule,
    RichSelectModule,
    StatusBarModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    SparklinesModule.with(AgChartsEnterpriseModule),
]);

const numberFormatter: ValueFormatterFunc = ({ value }) => {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        maximumFractionDigits: 2,
    });
    return value == null ? '' : formatter.format(value);
};

export const FinanceExample: React.FC<Props> = ({
    gridTheme = 'ag-theme-quartz',
    isDarkMode = false,
    gridHeight = null,
    isSmallerGrid,
    updateInterval = DEFAULT_UPDATE_INTERVAL,
    enableRowGroup,
}) => {
    const [rowData, setRowData] = useState(getData());
    const gridRef = useRef<AgGridReact>(null);
    const [tickerColWidth, setTickerColWidth] = useState(TICKER_SIZES.large);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setRowData((rowData) =>
                rowData.map((item) => {
                    const isRandomChance = Math.random() < 0.1;

                    if (!isRandomChance) {
                        return item;
                    }
                    const rnd = (Math.random() * PERCENTAGE_CHANGE) / 100;
                    const change = Math.random() > 0.5 ? 1 - rnd : 1 + rnd;
                    const price =
                        item.price < 10
                            ? item.price * change
                            : // Increase price if it is too low, so it does not hang around 0
                              Math.random() * 40 + 10;

                    const timeline = item.timeline.slice(1, item.timeline.length).concat(Number(price.toFixed(2)));

                    return {
                        ...item,
                        price,
                        timeline,
                    };
                })
            );
        }, updateInterval);

        return () => clearInterval(intervalId);
    }, [updateInterval]);

    const colDefs = useMemo<ColDef[]>(() => {
        const tickerWidthDefs =
            tickerColWidth === 'auto'
                ? { flex: 1 }
                : {
                      initialWidth: tickerColWidth,
                      minWidth: tickerColWidth,
                  };
        const timelineWidthDefs =
            tickerColWidth === 'auto'
                ? { flex: 1 }
                : {
                      initialWidth: 140,
                      minWidth: 140,
                  };
        const cDefs: ColDef[] = [
            {
                field: 'ticker',
                cellRenderer: TickerCellRenderer,
                ...tickerWidthDefs,
            },
            {
                headerName: 'Timeline',
                field: 'timeline',
                cellRenderer: 'agSparklineCellRenderer',
                cellRendererParams: {
                    sparklineOptions: {
                        type: 'bar',
                        axis: {
                            strokeWidth: 0,
                        },
                    },
                },
                ...timelineWidthDefs,
            },
            {
                field: 'instrument',
                cellDataType: 'text',
                type: 'rightAligned',
                minWidth: 160,
                initialWidth: 160,
            },
            {
                colId: 'p&l',
                headerName: 'P&L',
                cellDataType: 'number',
                type: 'rightAligned',
                cellRenderer: 'agAnimateShowChangeCellRenderer',
                valueGetter: ({ data }: ValueGetterParams) => data && data.quantity * (data.price / data.purchasePrice),
                valueFormatter: numberFormatter,
                aggFunc: 'sum',
                minWidth: 140,
                initialWidth: 140,
            },
            {
                colId: 'totalValue',
                headerName: 'Total Value',
                type: 'rightAligned',
                cellDataType: 'number',
                valueGetter: ({ data }: ValueGetterParams) => data && data.quantity * data.price,
                cellRenderer: 'agAnimateShowChangeCellRenderer',
                valueFormatter: numberFormatter,
                aggFunc: 'sum',
                minWidth: 160,
                initialWidth: 160,
            },
        ];

        if (!isSmallerGrid) {
            cDefs.push(
                {
                    field: 'quantity',
                    cellDataType: 'number',
                    type: 'rightAligned',
                    valueFormatter: numberFormatter,
                    maxWidth: 75,
                },
                {
                    headerName: 'Price',
                    field: 'purchasePrice',
                    cellDataType: 'number',
                    type: 'rightAligned',
                    valueFormatter: numberFormatter,
                    maxWidth: 75,
                }
            );
        }

        return cDefs;
    }, [isSmallerGrid, tickerColWidth]);

    const defaultColDef: ColDef = useMemo(
        () => ({
            flex: 1,
            filter: true,
            enableRowGroup,
            enableValue: true,
        }),
        [enableRowGroup]
    );

    const getRowId = useCallback<GetRowIdFunc>(({ data: { ticker } }: GetRowIdParams) => ticker, []);
    const onGridSizeChanged = useCallback((params: GridSizeChangedEvent) => {
        let tickerColWidth: ColWidth;
        if (params.clientWidth < BREAKPOINT_SMALL) {
            tickerColWidth = TICKER_SIZES.small;
        } else if (params.clientWidth < BREAKPOINT_MEDIUM) {
            tickerColWidth = TICKER_SIZES.medium;
        } else {
            tickerColWidth = TICKER_SIZES.large;
        }

        setTickerColWidth(tickerColWidth);
        const isAutoSized = tickerColWidth === 'auto';

        // Show minimum of 2 columns
        const showMinCols = () => {
            params.api.setColumnsVisible(COLUMN_HEADER_NAME_PRIORITIES.slice(0, 2), true);
            params.api.setColumnsVisible(COLUMN_HEADER_NAME_PRIORITIES.slice(2), false);
        };

        if (isAutoSized) {
            showMinCols();
            return;
        }

        const columnsToShow: string[] = [];
        const columnsToHide: string[] = [];
        let totalWidth: number = 0;
        let hasFilledColumns = false;
        COLUMN_HEADER_NAME_PRIORITIES.forEach((colId) => {
            const col = params.api.getColumn(colId);
            if (!col) {
                return;
            }
            const minWidth = col?.getMinWidth() || 0;
            const newTotalWidth = totalWidth + minWidth;

            if (!hasFilledColumns && newTotalWidth <= params.clientWidth) {
                columnsToShow.push(colId);
                totalWidth = newTotalWidth;
            } else {
                hasFilledColumns = true;
                columnsToHide.push(colId);
            }
        });
        if (columnsToShow.length < 2) {
            showMinCols();
            return;
        }

        // show/hide columns based on current grid width
        params.api.setColumnsVisible(columnsToShow, true);
        params.api.setColumnsVisible(columnsToHide, false);
    }, []);

    const statusBar = useMemo(
        () => ({
            statusPanels: [
                { statusPanel: 'agTotalAndFilteredRowCountComponent' },
                { statusPanel: 'agTotalRowCountComponent' },
                { statusPanel: 'agFilteredRowCountComponent' },
                { statusPanel: 'agSelectedRowCountComponent' },
                { statusPanel: 'agAggregationComponent' },
            ],
        }),
        []
    );

    const themeClass = `${gridTheme}${isDarkMode ? '-dark' : ''}`;

    return (
        <div
            style={gridHeight ? { height: gridHeight } : {}}
            className={`${themeClass} ${styles.grid} ${gridHeight ? '' : styles.gridHeight}`}
        >
            <AgGridReact
                theme="legacy"
                ref={gridRef}
                getRowId={getRowId}
                rowData={rowData}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                cellSelection={true}
                enableCharts
                rowGroupPanelShow={enableRowGroup ? 'always' : 'never'}
                suppressAggFuncInHeader
                groupDefaultExpanded={-1}
                statusBar={statusBar}
                popupParent={typeof document === 'object' ? document.body : undefined}
                onGridSizeChanged={onGridSizeChanged}
            />
        </div>
    );
};
