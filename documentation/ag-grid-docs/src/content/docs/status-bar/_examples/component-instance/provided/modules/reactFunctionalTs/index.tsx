import React, { StrictMode, useCallback, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { ColDef, IStatusPanel, RowSelectionOptions, StatusPanelDef } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    RowSelectionModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import { CellSelectionModule, StatusBarModule } from 'ag-grid-enterprise';
import { AgGridReact, getInstance } from 'ag-grid-react';

import ClickableStatusBarComponent from './clickableStatusBarComponent';
import './styles.css';

ModuleRegistry.registerModules([
    TextEditorModule,
    TextFilterModule,
    RowSelectionModule,
    ClientSideRowModelModule,
    StatusBarModule,
    CellSelectionModule,
    ValidationModule /* Development Only */,
]);

export interface IClickableStatusBar extends IStatusPanel {
    setVisible(visible: boolean): void;
    isVisible(): boolean;
}

const rowSelection: RowSelectionOptions = {
    mode: 'multiRow',
};

const GridExample = () => {
    const gridRef = useRef<AgGridReact>(null);
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '90%', width: '100%' }), []);
    const [rowData, setRowData] = useState<any[]>([
        { row: 'Row 1', name: 'Michael Phelps' },
        { row: 'Row 2', name: 'Natalie Coughlin' },
        { row: 'Row 3', name: 'Aleksey Nemov' },
        { row: 'Row 4', name: 'Alicia Coutts' },
        { row: 'Row 5', name: 'Missy Franklin' },
        { row: 'Row 6', name: 'Ryan Lochte' },
        { row: 'Row 7', name: 'Allison Schmitt' },
        { row: 'Row 8', name: 'Natalie Coughlin' },
        { row: 'Row 9', name: 'Ian Thorpe' },
        { row: 'Row 10', name: 'Bob Mill' },
        { row: 'Row 11', name: 'Willy Walsh' },
        { row: 'Row 12', name: 'Sarah McCoy' },
        { row: 'Row 13', name: 'Jane Jack' },
        { row: 'Row 14', name: 'Tina Wills' },
    ]);
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([
        {
            field: 'row',
        },
        {
            field: 'name',
        },
    ]);
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            editable: true,
            flex: 1,
            minWidth: 100,
            filter: true,
        };
    }, []);
    const statusBar = useMemo<{
        statusPanels: StatusPanelDef[];
    }>(() => {
        return {
            statusPanels: [
                {
                    statusPanel: ClickableStatusBarComponent,
                    key: 'statusBarCompKey',
                },
                {
                    statusPanel: 'agAggregationComponent',
                    statusPanelParams: {
                        aggFuncs: ['count', 'sum'],
                    },
                },
            ],
        };
    }, []);

    const toggleStatusBarComp = useCallback(() => {
        getInstance(
            gridRef.current!.api.getStatusPanel<IClickableStatusBar>('statusBarCompKey')!,
            (statusBarComponent) => {
                statusBarComponent!.setVisible(!statusBarComponent!.isVisible());
            }
        );
    }, []);

    return (
        <div style={containerStyle}>
            <button onClick={toggleStatusBarComp} style={{ marginBottom: '10px' }}>
                Toggle Status Bar Component
            </button>

            <div style={gridStyle}>
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowSelection={rowSelection}
                    statusBar={statusBar}
                />
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
