import React, { StrictMode, useCallback, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { PivotModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,

    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    MenuModule,
    PivotModule,
]);

const GridExample = () => {
    const gridRef = useRef();
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState();
    const [columnDefs, setColumnDefs] = useState([
        { field: 'country', rowGroup: true },
        { field: 'sport', pivot: true },
        { field: 'gold', aggFunc: 'sum' },
    ]);
    const defaultColDef = useMemo(() => {
        return {
            flex: 1,
            minWidth: 130,
        };
    }, []);
    const autoGroupColumnDef = useMemo(() => {
        return {
            minWidth: 200,
        };
    }, []);

    const onGridReady = useCallback((params) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => setRowData(data));
    }, []);

    const togglePivotHeader = useCallback(() => {
        const checkbox = document.querySelector('#removePivotHeaderRowWhenSingleValueColumn');
        gridRef.current.api.setGridOption('removePivotHeaderRowWhenSingleValueColumn', checkbox.checked);
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
                    <AgGridReact
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

const root = createRoot(document.getElementById('root'));
root.render(
    <StrictMode>
        <GridExample />
    </StrictMode>
);
window.tearDownExample = () => root.unmount();
