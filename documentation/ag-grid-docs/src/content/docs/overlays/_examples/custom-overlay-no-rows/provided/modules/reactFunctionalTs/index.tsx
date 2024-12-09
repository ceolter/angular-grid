import React, { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { ColDef } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import CustomNoRowsOverlay from './customNoRowsOverlay';
import './styles.css';

interface IAthlete {
    athlete: string;
    country: string;
}

const columnDefs: ColDef[] = [
    { field: 'athlete', width: 150 },
    { field: 'country', width: 120 },
];

const defaultColDef = {
    editable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
};

ModuleRegistry.registerModules([
    TextEditorModule,
    TextFilterModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const GridExample = () => {
    const [rowData, setRowData] = useState<IAthlete[]>([]);

    const noRowsOverlayComponentParams = useMemo(() => {
        return {
            noRowsMessageFunc: () => 'No rows found at: ' + new Date().toLocaleTimeString(),
        };
    }, []);

    return (
        <div className="example-wrapper">
            <div>
                <button onClick={() => setRowData([])}>Clear rowData</button>
                <button onClick={() => setRowData([{ athlete: 'Michael Phelps', country: 'US' }])}>Set rowData</button>
            </div>

            <div style={{ height: '100%' }}>
                <AgGridReact<IAthlete>
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    noRowsOverlayComponent={CustomNoRowsOverlay}
                    noRowsOverlayComponentParams={noRowsOverlayComponentParams}
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
