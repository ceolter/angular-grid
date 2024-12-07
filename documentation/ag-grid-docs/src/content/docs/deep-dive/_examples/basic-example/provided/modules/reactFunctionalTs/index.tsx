// React Grid Logic
import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Theme
import type { ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
// Core CSS
import { AgGridReact } from 'ag-grid-react';

ModuleRegistry.registerModules([AllCommunityModule]);

// Row Data Interface
interface IRow {
    make: string;
    model: string;
    price: number;
    electric: boolean;
}

// Create new GridExample component
const GridExample = () => {
    // Row Data: The data to be displayed.
    const [rowData, setRowData] = useState<IRow[]>([
        { make: 'Tesla', model: 'Model Y', price: 64950, electric: true },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: false },
        { make: 'Toyota', model: 'Corolla', price: 29600, electric: false },
    ]);

    // Column Definitions: Defines & controls grid columns.
    const [colDefs, setColDefs] = useState<ColDef<IRow>[]>([
        { field: 'make' },
        { field: 'model' },
        { field: 'price' },
        { field: 'electric' },
    ]);

    // Container: Defines the grid's theme & dimensions.
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <AgGridReact rowData={rowData} columnDefs={colDefs} />
        </div>
    );
};

// Render GridExample
const root = createRoot(document.getElementById('root')!);
root.render(
    <StrictMode>
        <GridExample />
    </StrictMode>
);
