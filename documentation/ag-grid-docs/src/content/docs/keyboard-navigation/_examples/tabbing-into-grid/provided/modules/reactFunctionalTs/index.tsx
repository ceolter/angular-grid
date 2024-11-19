import React, { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridReadyEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const GridExample = () => {
    const [rowData, setRowData] = useState<any[]>();
    const columnDefs = useMemo<ColDef[]>(
        () => [
            {
                headerName: '#',
                colId: 'rowNum',
                valueGetter: 'node.id',
            },
            {
                field: 'athlete',
                minWidth: 170,
            },
            { field: 'age' },
            { field: 'country' },
            { field: 'year' },
            { field: 'date' },
            { field: 'sport' },
            { field: 'gold' },
            { field: 'silver' },
            { field: 'bronze' },
            { field: 'total' },
        ],
        []
    );

    const onGridReady = (params: GridReadyEvent) => {
        const updateData = (data: any[]) => {
            setRowData(data);
        };

        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => updateData(data));
    };

    const defaultColDef = useMemo(
        () => ({
            editable: true,
            flex: 1,
            minWidth: 100,
            filter: true,
        }),
        []
    );

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div className="test-container">
                <div>
                    <div className="form-container">
                        <label>Input Above</label>
                        <input type="text" />
                    </div>
                </div>
                <div id="myGrid" style={{ height: '100%', width: '100%' }}>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        onGridReady={onGridReady}
                    />
                </div>
                <div className="form-container">
                    <label>Input Below</label>
                    <input type="text" />
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
