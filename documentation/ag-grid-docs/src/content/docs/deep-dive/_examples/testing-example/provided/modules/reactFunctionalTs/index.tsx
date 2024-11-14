// React Grid Logic
import React, { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
// Theme
import type { ColDef, RowSelectionOptions, ValueFormatterParams } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
// Core CSS
import type { CustomCellRendererProps } from 'ag-grid-react';
import { AgGridReact } from 'ag-grid-react';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

// Custom Cell Renderer (Display logos based on cell value)
const CompanyLogoRenderer = (params: CustomCellRendererProps) => (
    <span style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center' }}>
        {params.value && (
            <img
                alt={`${params.value} Flag`}
                src={`https://www.ag-grid.com/example-assets/space-company-logos/${params.value.toLowerCase()}.png`}
                style={{
                    display: 'block',
                    width: '25px',
                    height: 'auto',
                    maxHeight: '50%',
                    marginRight: '12px',
                    filter: 'brightness(1.1)',
                }}
            />
        )}
        <p style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{params.value}</p>
    </span>
);

/* Custom Cell Renderer (Display tick / cross in 'Successful' column) */
const MissionResultRenderer = (params: CustomCellRendererProps) => (
    <span style={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
        {
            <img
                alt={`${params.value}`}
                src={`https://www.ag-grid.com/example-assets/icons/${params.value ? 'tick-in-circle' : 'cross-in-circle'}.png`}
                style={{ width: 'auto', height: 'auto' }}
            />
        }
    </span>
);

/* Format Date Cells */
const dateFormatter = (params: ValueFormatterParams): string => {
    return new Date(params.value).toLocaleDateString('en-us', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// Row Data Interface
interface IRow {
    mission: string;
    company: string;
    location: string;
    date: string;
    time: string;
    rocket: string;
    price: number;
    successful: boolean;
}

const rowSelection: RowSelectionOptions = {
    mode: 'multiRow',
    headerCheckbox: false,
};

// Create new GridExample component
const GridExample = () => {
    // Row Data: The data to be displayed.
    const [rowData, setRowData] = useState<IRow[]>([]);

    // Column Definitions: Defines & controls grid columns.
    const [colDefs] = useState<ColDef[]>([
        {
            field: 'mission',
            width: 150,
        },
        {
            field: 'company',
            width: 130,
            cellRenderer: CompanyLogoRenderer,
        },
        {
            field: 'location',
            width: 225,
        },
        {
            field: 'date',
            valueFormatter: dateFormatter,
        },
        {
            field: 'price',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
                return '£' + params.value.toLocaleString();
            },
        },
        {
            field: 'successful',
            width: 120,
            cellRenderer: MissionResultRenderer,
        },
        { field: 'rocket' },
    ]);

    // Fetch data & update rowData state
    useEffect(() => {
        fetch('https://www.ag-grid.com/example-assets/space-mission-data.json')
            .then((result) => result.json())
            .then((rowData) => setRowData(rowData));
    }, []);

    // Apply settings across all columns
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            filter: true,
            editable: true,
        };
    }, []);

    // Container: Defines the grid's theme & dimensions.
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <AgGridReact
                rowData={rowData}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                pagination={true}
                rowSelection={rowSelection}
                onSelectionChanged={(event) => console.log('Row Selected!')}
                onCellValueChanged={(event) => console.log(`New Cell Value: ${event.value}`)}
            />
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
