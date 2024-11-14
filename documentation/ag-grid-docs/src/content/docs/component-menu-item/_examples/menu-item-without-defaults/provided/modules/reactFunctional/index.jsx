import React, { StrictMode, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ClipboardModule } from 'ag-grid-enterprise';
import { ExcelExportModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { CellSelectionModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import MenuItem from './menuItem.jsx';
import './style.css';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,

    MenuModule,
    ExcelExportModule,
    CellSelectionModule,
    ClipboardModule,
]);

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState();
    const [columnDefs, setColumnDefs] = useState([
        { field: 'athlete' },
        { field: 'country' },
        { field: 'sport' },
        { field: 'year' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
    ]);
    const defaultColDef = useMemo(() => {
        return {
            flex: 1,
            minWidth: 100,
            filter: true,
            suppressHeaderFilterButton: true,
        };
    }, []);

    const onGridReady = useCallback((params) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => {
                setRowData(data);
            });
    }, []);

    const getMainMenuItems = useCallback((params) => {
        return [
            ...params.defaultItems.filter((item) => item !== 'columnFilter'),
            'separator',
            {
                name: 'Filter',
                menuItem: MenuItem,
                menuItemParams: {
                    column: params.column,
                },
            },
        ];
    }, []);

    return (
        <div style={containerStyle}>
            <div style={gridStyle}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    getMainMenuItems={getMainMenuItems}
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
