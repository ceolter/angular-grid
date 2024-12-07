import React, { StrictMode, useCallback, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { ColDef, GridReadyEvent } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule } from 'ag-grid-community';
import {
    ColumnMenuModule,
    ColumnsToolPanelModule,
    ContextMenuModule,
    FiltersToolPanelModule,
    PivotModule,
} from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ColumnsToolPanelModule,

    FiltersToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    PivotModule,
    ValidationModule /* Development Only */,
]);

interface IOlympicData {
    athlete: string;
    age: number;
    country: string;
    year: number;
    date: string;
    sport: string;
    gold: number;
    silver: number;
    bronze: number;
    total: number;
}

const GridExample = () => {
    const gridRef = useRef<AgGridReact<IOlympicData>>(null);
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState<IOlympicData[]>();
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([
        { field: 'country', rowGroup: true },
        { field: 'sport', pivot: true },
        { field: 'gold', aggFunc: 'sum' },
    ]);
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            flex: 1,
            minWidth: 130,
        };
    }, []);
    const autoGroupColumnDef = useMemo<ColDef>(() => {
        return {
            minWidth: 200,
        };
    }, []);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data: IOlympicData[]) => setRowData(data));
    }, []);

    const togglePivotHeader = useCallback(() => {
        const checkbox = document.querySelector<HTMLInputElement>('#removePivotHeaderRowWhenSingleValueColumn')!;
        gridRef.current!.api.setGridOption('removePivotHeaderRowWhenSingleValueColumn', checkbox.checked);
    }, []);

    return (
        <div style={containerStyle}>
            <div className="example-wrapper">
                <div className="example-header">
                    <label>
                        <span>removePivotHeaderRowWhenSingleValueColumn:</span>
                        <input
                            type="checkbox"
                            id="removePivotHeaderRowWhenSingleValueColumn"
                            onChange={togglePivotHeader}
                            defaultChecked
                        />
                    </label>
                </div>

                <div style={gridStyle}>
                    <AgGridReact<IOlympicData>
                        ref={gridRef}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        autoGroupColumnDef={autoGroupColumnDef}
                        pivotMode={true}
                        removePivotHeaderRowWhenSingleValueColumn={true}
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
