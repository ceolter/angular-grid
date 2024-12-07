// React Grid Logic
import React, { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Theme
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
// Core CSS
import { AgGridReact } from 'ag-grid-react';

ModuleRegistry.registerModules([AllCommunityModule]);

// Create new GridExample component
const GridExample = () => {
    // Row Data: The data to be displayed.
    const [rowData, setRowData] = useState([]);

    // Column Definitions: Defines & controls grid columns.
    const [colDefs] = useState([
        { field: 'mission', filter: true },
        { field: 'company' },
        { field: 'location' },
        { field: 'date' },
        { field: 'price' },
        { field: 'successful' },
        { field: 'rocket' },
    ]);

    // Fetch data & update rowData state
    useEffect(() => {
        fetch('https://www.ag-grid.com/example-assets/space-mission-data.json') // Fetch data from server
            .then((result) => result.json()) // Convert to JSON
            .then((rowData) => setRowData(rowData)); // Update state of `rowData`
    }, []);

    // Apply settings across all columns
    const defaultColDef = useMemo(() => ({
        filter: true,
    }));

    // Container: Defines the grid's theme & dimensions.
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <AgGridReact rowData={rowData} columnDefs={colDefs} defaultColDef={defaultColDef} />
        </div>
    );
};

// Render GridExample
const root = createRoot(document.getElementById('root'));
root.render(
    <StrictMode>
        <GridExample />
    </StrictMode>
);
