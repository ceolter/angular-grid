import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    AllCommunityModule,
    ClientSideRowModelModule,
    type ColDef,
    type GetRowIdFunc,
    type GetRowIdParams,
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
}

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
}) => {
    const [rowData, setRowData] = useState(getData());
    const gridRef = useRef<AgGridReact>(null);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setRowData((rowData) =>
                rowData.map((item) =>
                    Math.random() < 0.1
                        ? {
                              ...item,
                              price:
                                  item.price +
                                  item.price * ((Math.random() * 4 + 1) / 100) * (Math.random() > 0.5 ? 1 : -1),
                          }
                        : item
                )
            );
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const colDefs = useMemo<ColDef[]>(() => {
        const cDefs: ColDef[] = [
            {
                field: 'ticker',
                cellRenderer: TickerCellRenderer,
                minWidth: 380,
            },
            {
                headerName: 'Last 24hrs',
                field: 'last24',
                cellRenderer: 'agSparklineCellRenderer',
                cellRendererParams: {
                    sparklineOptions: {
                        strokeWidth: 2,
                    },
                },
            },
            {
                field: 'instrument',
                cellDataType: 'text',
                type: 'rightAligned',
                maxWidth: 180,
            },
            {
                headerName: 'P&L',
                cellDataType: 'number',
                type: 'rightAligned',
                cellRenderer: 'agAnimateShowChangeCellRenderer',
                valueGetter: ({ data }: ValueGetterParams) => data && data.quantity * (data.price / data.purchasePrice),
                valueFormatter: numberFormatter,
                aggFunc: 'sum',
            },
            {
                headerName: 'Total Value',
                type: 'rightAligned',
                cellDataType: 'number',
                valueGetter: ({ data }: ValueGetterParams) => data && data.quantity * data.price,
                cellRenderer: 'agAnimateShowChangeCellRenderer',
                valueFormatter: numberFormatter,
                aggFunc: 'sum',
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
    }, [isSmallerGrid]);

    const defaultColDef: ColDef = useMemo(
        () => ({
            flex: 1,
            filter: true,
            enableRowGroup: true,
            enableValue: true,
        }),
        []
    );

    const getRowId = useCallback<GetRowIdFunc>(({ data: { ticker } }: GetRowIdParams) => ticker, []);

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
                rowGroupPanelShow={'always'}
                suppressAggFuncInHeader
                groupDefaultExpanded={-1}
                statusBar={statusBar}
                popupParent={typeof document === 'object' ? document.body : undefined}
            />
        </div>
    );
};
