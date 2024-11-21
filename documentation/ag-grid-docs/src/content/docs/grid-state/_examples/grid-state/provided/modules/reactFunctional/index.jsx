import React, { StrictMode, useCallback, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule, PivotModule } from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { CellSelectionModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,

    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    SetFilterModule,
    CellSelectionModule,
    PivotModule,
]);

const GridExample = () => {
    const gridRef = useRef(null);
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState();
    const [columnDefs, setColumnDefs] = useState([
        { field: 'athlete', minWidth: 150 },
        { field: 'age', maxWidth: 90 },
        { field: 'country', minWidth: 150 },
        { field: 'year', maxWidth: 90 },
        { field: 'date', minWidth: 150 },
        { field: 'sport', minWidth: 150 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ]);
    const defaultColDef = useMemo(() => {
        return {
            flex: 1,
            minWidth: 100,
            filter: true,
            enableRowGroup: true,
            enablePivot: true,
            enableValue: true,
        };
    }, []);
    const rowSelection = useMemo(
        () => ({
            mode: 'multiRow',
        }),
        []
    );
    const [initialState, setInitialState] = useState();
    const [currentState, setCurrentState] = useState();
    const [gridVisible, setGridVisible] = useState(true);

    const onGridReady = useCallback((params) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => setRowData(data));
    }, []);

    const onGridPreDestroyed = useCallback((params) => {
        const { state } = params;
        console.log('Grid state on destroy (can be persisted)', state);
        setInitialState(state);
    }, []);

    const onStateUpdated = useCallback((params) => {
        console.log('State updated', params.state);
        setCurrentState(params.state);
    }, []);

    const reloadGrid = useCallback(() => {
        setGridVisible(false);
        setTimeout(() => {
            setRowData(undefined);
            setGridVisible(true);
        });
    }, []);

    const printState = useCallback(() => {
        console.log('Grid state', currentState);
    }, [currentState]);

    return (
        <div style={containerStyle}>
            <div className="example-wrapper">
                <div>
                    <span className="button-group">
                        <button onClick={reloadGrid}>Recreate Grid with Current State</button>
                        <button onClick={printState}>Print State</button>
                    </span>
                </div>
                <div style={gridStyle}>
                    {gridVisible && (
                        <AgGridReact
                            ref={gridRef}
                            rowData={rowData}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            sideBar={true}
                            pagination={true}
                            rowSelection={rowSelection}
                            suppressColumnMoveAnimation={true}
                            initialState={initialState}
                            onGridReady={onGridReady}
                            onGridPreDestroyed={onGridPreDestroyed}
                            onStateUpdated={onStateUpdated}
                        />
                    )}
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
