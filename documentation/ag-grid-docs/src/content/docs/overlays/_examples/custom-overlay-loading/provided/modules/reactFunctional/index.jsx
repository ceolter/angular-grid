import React, { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import CustomLoadingOverlay from './customLoadingOverlay';
import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs = [
    { field: 'athlete', width: 150 },
    { field: 'country', width: 120 },
];

const rowData = [
    { athlete: 'Michael Phelps', country: 'United States' },
    { athlete: 'Natalie Coughlin', country: 'United States' },
    { athlete: 'Aleksey Nemov', country: 'Russia' },
    { athlete: 'Alicia Coutts', country: 'Australia' },
];

const defaultColDef = {
    editable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
};

const GridExample = () => {
    const [loading, setLoading] = useState(true);

    const loadingOverlayComponentParams = useMemo(() => {
        return { loadingMessage: 'One moment please...' };
    }, []);

    return (
        <div className="example-wrapper">
            <div>
                <label className="checkbox">
                    <input type="checkbox" onChange={(e) => setLoading(e.target.checked)} checked={loading} />
                    loading
                </label>
            </div>

            <div style={{ height: '100%', width: '100%' }}>
                <AgGridReact
                    loading={loading}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    loadingOverlayComponent={CustomLoadingOverlay}
                    loadingOverlayComponentParams={loadingOverlayComponentParams}
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
