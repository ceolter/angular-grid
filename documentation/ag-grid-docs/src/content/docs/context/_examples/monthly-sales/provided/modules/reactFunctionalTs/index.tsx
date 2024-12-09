import React, { StrictMode, useCallback, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { ColDef, ColGroupDef, GridReadyEvent, RowSelectionOptions } from 'ag-grid-community';
import {
    CellStyleModule,
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    QuickFilterModule,
    RenderApiModule,
    RowSelectionModule,
    ValidationModule,
} from 'ag-grid-community';
import { FiltersToolPanelModule, RowGroupingModule, SetFilterModule } from 'ag-grid-enterprise';
import type { CustomCellRendererProps } from 'ag-grid-react';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([
    ClientSideRowModelApiModule,
    RenderApiModule,
    RowSelectionModule,
    CellStyleModule,
    QuickFilterModule,
    ClientSideRowModelModule,
    RowGroupingModule,
    SetFilterModule,
    FiltersToolPanelModule,
    ValidationModule /* Development Only */,
]);

const monthValueGetter =
    '(ctx.month < ctx.months.indexOf(colDef.field)) ? data[colDef.field + "_bud"] : data[colDef.field + "_act"]';

const monthCellClassRules = {
    'cell-act': 'ctx.month < ctx.months.indexOf(colDef.field)',
    'cell-bud': 'ctx.month >= ctx.months.indexOf(colDef.field)',
    'cell-negative': 'x < 0',
};

const yearToDateValueGetter =
    'var total = 0; ctx.months.forEach( function(monthName, monthIndex) { if (monthIndex<=ctx.month) { total += data[monthName + "_act"]; } }); return total; ';

const accountingCellRenderer = function (params: CustomCellRendererProps) {
    if (params.value == null) {
        return '';
    } else if (params.value >= 0) {
        return params.value.toLocaleString();
    } else {
        return '(' + Math.abs(params.value).toLocaleString() + ')';
    }
};

const monthNames = [
    'Budget Only',
    'Year to Jan',
    'Year to Feb',
    'Year to Mar',
    'Year to Apr',
    'Year to May',
    'Year to Jun',
    'Year to Jul',
    'Year to Aug',
    'Year to Sep',
    'Year to Oct',
    'Year to Nov',
    'Full Year',
];

const rowSelection: RowSelectionOptions = {
    mode: 'multiRow',
    headerCheckbox: false,
    groupSelects: 'descendants',
};

const GridExample = () => {
    const gridRef = useRef<AgGridReact>(null);
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState<any[]>();
    const [columnDefs, setColumnDefs] = useState<(ColDef | ColGroupDef)[]>([
        {
            field: 'country',
            rowGroup: true,
            hide: true,
        },
        {
            headerName: 'Monthly Data',
            children: [
                {
                    field: 'jan',
                    cellRenderer: accountingCellRenderer,
                    cellClass: 'cell-figure',
                    valueGetter: monthValueGetter,
                    cellClassRules: monthCellClassRules,
                    aggFunc: 'sum',
                },
                {
                    field: 'feb',
                    cellRenderer: accountingCellRenderer,
                    cellClass: 'cell-figure',
                    valueGetter: monthValueGetter,
                    cellClassRules: monthCellClassRules,
                    aggFunc: 'sum',
                },
                {
                    field: 'mar',
                    cellRenderer: accountingCellRenderer,
                    cellClass: 'cell-figure',
                    valueGetter: monthValueGetter,
                    cellClassRules: monthCellClassRules,
                    aggFunc: 'sum',
                },
                {
                    field: 'apr',
                    cellRenderer: accountingCellRenderer,
                    cellClass: 'cell-figure',
                    valueGetter: monthValueGetter,
                    cellClassRules: monthCellClassRules,
                    aggFunc: 'sum',
                },
                {
                    field: 'may',
                    cellRenderer: accountingCellRenderer,
                    cellClass: 'cell-figure',
                    valueGetter: monthValueGetter,
                    cellClassRules: monthCellClassRules,
                    aggFunc: 'sum',
                },
                {
                    field: 'jun',
                    cellRenderer: accountingCellRenderer,
                    cellClass: 'cell-figure',
                    valueGetter: monthValueGetter,
                    cellClassRules: monthCellClassRules,
                    aggFunc: 'sum',
                },
                {
                    headerName: 'YTD',
                    cellClass: 'cell-figure',
                    cellRenderer: accountingCellRenderer,
                    valueGetter: yearToDateValueGetter,
                    aggFunc: 'sum',
                },
            ],
        },
    ]);
    const context = useRef<{ month: number; months: string[] }>({
        month: 0,
        months: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
    });
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            flex: 1,
            minWidth: 120,
        };
    }, []);
    const autoGroupColumnDef = useMemo<ColDef>(() => {
        return {
            headerName: 'Location',
            field: 'city',
            minWidth: 260,
            cellRenderer: 'agGroupCellRenderer',
        };
    }, []);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        fetch('https://www.ag-grid.com/example-assets/monthly-sales.json')
            .then((resp) => resp.json())
            .then((data: any[]) => {
                setRowData(data);
            });
    }, []);

    const onChangeMonth = useCallback(
        (i: number) => {
            let newMonth = (context.current.month += i);
            if (newMonth < -1) {
                newMonth = -1;
            }
            if (newMonth > 5) {
                newMonth = 5;
            }
            // Mutate the context object in place
            context.current.month = newMonth;
            document.querySelector('#monthName')!.textContent = monthNames[newMonth + 1];
            gridRef.current!.api.refreshClientSideRowModel('aggregate');
            gridRef.current!.api.refreshCells();
        },
        [monthNames]
    );

    const onQuickFilterChanged = useCallback((value: string) => {
        gridRef.current!.api.setGridOption('quickFilterText', value);
    }, []);

    return (
        <div style={containerStyle}>
            <div className="test-container">
                <div className="test-header">
                    <input
                        type="text"
                        id="filter-text-box"
                        style={{ width: '100px' }}
                        onChange={(e) => onQuickFilterChanged(e.target.value)}
                        placeholder="Filter..."
                    />

                    <span style={{ paddingLeft: '20px' }}>
                        <b>Period:</b>
                        <button onClick={() => onChangeMonth(-1)}>
                            <i className="fa fa-chevron-left"></i>
                        </button>
                        <button onClick={() => onChangeMonth(1)}>
                            <i className="fa fa-chevron-right"></i>
                        </button>
                        <span id="monthName" style={{ width: '100px', display: 'inline-block' }}>
                            Year to Jan
                        </span>
                    </span>

                    <span style={{ paddingLeft: '20px' }}>
                        <b>Legend:</b>&nbsp;&nbsp;
                        <div className="cell-bud legend-box"></div> Actual&nbsp;&nbsp;
                        <div className="cell-act legend-box"></div> Budget
                    </span>
                </div>

                <div style={gridStyle}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        suppressMovableColumns={true}
                        context={context.current}
                        defaultColDef={defaultColDef}
                        autoGroupColumnDef={autoGroupColumnDef}
                        rowSelection={rowSelection}
                        onGridReady={onGridReady}
                    />
                </div>
            </div>
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(
    <StrictMode>
        <GridExample />
    </StrictMode>
);
