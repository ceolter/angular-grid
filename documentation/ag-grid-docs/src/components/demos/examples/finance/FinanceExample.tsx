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
import { getData } from './data';
import { getTickerCellRenderer } from './renderers/getTickerCellRenderer';
import { sparklineTooltipRenderer } from './renderers/sparklineTooltipRenderer';

export interface Props {
    gridTheme?: string;
    isDarkMode?: boolean;
    gridHeight?: number | null;
    isSmallerGrid?: boolean;
    updateInterval?: number;
    enableRowGroup?: boolean;
}

type Breakpoint = 'small' | 'medium' | 'medLarge' | 'large' | 'xlarge';
type ColWidth = number | 'auto';

const DEFAULT_UPDATE_INTERVAL = 60;
const PERCENTAGE_CHANGE = 20;
const BREAKPOINT_CONFIG: Record<
    Breakpoint,
    {
        breakpoint?: number;
        columns: string[];
        tickerColumnWidth: ColWidth;
        timelineColumnWidth: ColWidth;
        hideTickerName?: boolean;
    }
> = {
    small: {
        breakpoint: 500,
        columns: ['ticker', 'timeline'],
        tickerColumnWidth: 'auto',
        timelineColumnWidth: 'auto',
        hideTickerName: true,
    },
    medium: {
        breakpoint: 850,
        columns: ['ticker', 'timeline', 'totalValue'],
        tickerColumnWidth: 180,
        timelineColumnWidth: 140,
        hideTickerName: true,
    },
    medLarge: {
        breakpoint: 900,
        tickerColumnWidth: 340,
        timelineColumnWidth: 140,
        columns: ['ticker', 'timeline', 'totalValue', 'p&l'],
    },
    large: {
        breakpoint: 1100,
        tickerColumnWidth: 340,
        timelineColumnWidth: 140,
        columns: ['ticker', 'timeline', 'totalValue', 'p&l'],
    },
    xlarge: {
        tickerColumnWidth: 340,
        timelineColumnWidth: 140,
        columns: ['ticker', 'timeline', 'totalValue', 'p&l', 'instrument', 'price', 'quantity'],
    },
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
    const [breakpoint, setBreakpoint] = useState<Breakpoint>('xlarge');

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
        const breakpointConfig = BREAKPOINT_CONFIG[breakpoint];
        const tickerWidthDefs =
            breakpointConfig.tickerColumnWidth === 'auto'
                ? { flex: 1 }
                : {
                      initialWidth: breakpointConfig.tickerColumnWidth as number,
                      minWidth: breakpointConfig.tickerColumnWidth as number,
                  };
        const timelineWidthDefs =
            breakpointConfig.timelineColumnWidth === 'auto'
                ? { flex: 1 }
                : {
                      initialWidth: breakpointConfig.timelineColumnWidth as number,
                      minWidth: breakpointConfig.timelineColumnWidth as number,
                  };
        const allColDefs: ColDef[] = [
            {
                field: 'ticker',
                cellRenderer: getTickerCellRenderer(Boolean(breakpointConfig.hideTickerName)),
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
                        tooltip: {
                            renderer: sparklineTooltipRenderer,
                        },
                    },
                },
                ...timelineWidthDefs,
            },
            {
                field: 'instrument',
                cellDataType: 'text',
                type: 'rightAligned',
                minWidth: 100,
                initialWidth: 100,
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
            allColDefs.push(
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

        const cDefs = allColDefs.filter((cDef) => {
            return breakpointConfig.columns.includes(cDef.field!) || breakpointConfig.columns.includes(cDef.colId!);
        });

        return cDefs;
    }, [isSmallerGrid, breakpoint]);

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
        if (params.clientWidth < BREAKPOINT_CONFIG.small.breakpoint!) {
            setBreakpoint('small');
        } else if (params.clientWidth < BREAKPOINT_CONFIG.medium.breakpoint!) {
            setBreakpoint('medium');
        } else if (params.clientWidth < BREAKPOINT_CONFIG.medLarge.breakpoint!) {
            setBreakpoint('medLarge');
        } else if (params.clientWidth < BREAKPOINT_CONFIG.large.breakpoint!) {
            setBreakpoint('large');
        } else {
            setBreakpoint('xlarge');
        }
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
