import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule, ModuleRegistry, ValidationModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule /* Development Only */]);

const columnDefs = [{ field: 'athlete' }, { field: 'country' }];

const GridExample = () => {
    const [rowData, setRowData] = useState([]);

    return (
        <div className="example-wrapper">
            <div>
                <button onClick={() => setRowData([])}>Clear rowData</button>
                <button onClick={() => setRowData([{ athlete: 'Michael Phelps', country: 'US' }])}>Set rowData</button>
            </div>

            <div style={{ height: '100%' }}>
                <AgGridReact rowData={rowData} columnDefs={columnDefs} />
            </div>
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<GridExample />);
