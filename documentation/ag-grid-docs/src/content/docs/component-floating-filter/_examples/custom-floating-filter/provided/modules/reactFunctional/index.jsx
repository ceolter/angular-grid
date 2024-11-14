import React, { StrictMode, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import NumberFloatingFilterComponent from './numberFloatingFilterComponent.jsx';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState();
    const [columnDefs, setColumnDefs] = useState([
        { field: 'athlete', filter: false },
        {
            field: 'gold',
            filter: 'agNumberColumnFilter',
            suppressHeaderFilterButton: true,
            floatingFilterComponent: NumberFloatingFilterComponent,
            floatingFilterComponentParams: {
                color: 'gold',
            },
            suppressFloatingFilterButton: true,
        },
        {
            field: 'silver',
            filter: 'agNumberColumnFilter',
            suppressHeaderFilterButton: true,
            floatingFilterComponent: NumberFloatingFilterComponent,
            floatingFilterComponentParams: {
                color: 'silver',
            },
            suppressFloatingFilterButton: true,
        },
        {
            field: 'bronze',
            filter: 'agNumberColumnFilter',
            suppressHeaderFilterButton: true,
            floatingFilterComponent: NumberFloatingFilterComponent,
            floatingFilterComponentParams: {
                color: '#CD7F32',
            },
            suppressFloatingFilterButton: true,
        },
        {
            field: 'total',
            filter: 'agNumberColumnFilter',
            suppressHeaderFilterButton: true,
            floatingFilterComponent: NumberFloatingFilterComponent,
            floatingFilterComponentParams: {
                color: 'unset',
            },
            suppressFloatingFilterButton: true,
        },
    ]);
    const defaultColDef = useMemo(() => {
        return {
            flex: 1,
            minWidth: 100,
            filter: true,
            floatingFilter: true,
        };
    }, []);

    const onGridReady = useCallback((params) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => {
                setRowData(data);
            });
    }, []);

    return (
        <div style={containerStyle}>
            <div style={gridStyle}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    onGridReady={onGridReady}
                />
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
