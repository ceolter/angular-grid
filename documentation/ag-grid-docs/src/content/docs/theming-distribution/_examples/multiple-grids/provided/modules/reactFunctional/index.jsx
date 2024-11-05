import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule, ModuleRegistry, themeAlpine, themeBalham, themeQuartz } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import './style.css';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const GridExample = () => {
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 16 }}>
                <p style={{ flex: 1 }}>Quartz theme:</p>
                <p style={{ flex: 1 }}>Alpine theme:</p>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                    {
                        <AgGridReact
                            theme={themeQuartz}
                            columnDefs={columnDefs}
                            rowData={rowData}
                            defaultColDef={defaultColDef}
                        />
                    }
                </div>
                <div style={{ flex: 1 }}>
                    {
                        <AgGridReact
                            theme={themeAlpine}
                            columnDefs={columnDefs}
                            rowData={rowData}
                            defaultColDef={defaultColDef}
                        />
                    }
                </div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
                <p style={{ flex: 1 }}>Balham theme (green header):</p>
                <p style={{ flex: 1 }}>Balham theme (red header):</p>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }} className="green-header">
                    {
                        <AgGridReact
                            theme={themeBalham}
                            columnDefs={columnDefs}
                            rowData={rowData}
                            defaultColDef={defaultColDef}
                        />
                    }
                </div>
                <div style={{ flex: 1 }} className="red-header">
                    {
                        <AgGridReact
                            theme={themeBalham}
                            columnDefs={columnDefs}
                            rowData={rowData}
                            defaultColDef={defaultColDef}
                        />
                    }
                </div>
            </div>
        </div>
    );
};

const rowData = (() => {
    const rowData = [];
    for (let i = 0; i < 10; i++) {
        rowData.push({ make: 'Toyota', model: 'Celica', price: 35000 + i * 1000 });
        rowData.push({ make: 'Ford', model: 'Mondeo', price: 32000 + i * 1000 });
        rowData.push({ make: 'Porsche', model: 'Boxster', price: 72000 + i * 1000 });
    }
    return rowData;
})();

const columnDefs = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];

const defaultColDef = {
    editable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
};

const root = createRoot(document.getElementById('root'));
root.render(
    <StrictMode>
        <GridExample />
    </StrictMode>
);
