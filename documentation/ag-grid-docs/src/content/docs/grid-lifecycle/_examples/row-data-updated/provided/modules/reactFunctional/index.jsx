import React, { StrictMode, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule, ModuleRegistry, ValidationModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import { fetchDataAsync } from './data';
import './styles.css';

ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule /* Development Only */]);

const updateRowCount = (id) => {
    const element = document.querySelector(`#${id} > .value`);
    element.textContent = `${new Date().toLocaleTimeString()}`;
};

const columnDefs = [
    { field: 'name', headerName: 'Athlete' },
    { field: 'person.age', headerName: 'Age' },
    { field: 'medals.gold', headerName: 'Gold Medals' },
];

const GridExample = () => {
    const [loading, setLoading] = useState(true);
    const [rowData, setRowData] = useState();

    const onFirstDataRendered = useCallback((event) => {
        updateRowCount('firstDataRendered');
        console.log('First Data Rendered');
    }, []);

    const onRowDataUpdated = useCallback((event) => {
        updateRowCount('rowDataUpdated');
        console.log('Row Data Updated');
    }, []);

    const reloadData = useCallback(() => {
        console.log('Loading Data ...');
        setLoading(true);
        fetchDataAsync()
            .then((data) => {
                console.info('Data Loaded');
                setRowData(data);
            })
            .catch((error) => {
                console.error('Failed to load data', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(reloadData, []);

    return (
        <div className="test-container">
            <div className="test-header">
                <div id="firstDataRendered">
                    First Data Rendered: <span className="value">-</span>
                </div>
                <div id="rowDataUpdated">
                    Row Data Updated: <span className="value">-</span>
                </div>
                <div>
                    <button disabled={loading} onClick={reloadData}>
                        Reload Data
                    </button>
                </div>
            </div>

            <div style={{ height: '100%' }}>
                <AgGridReact
                    loading={loading}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    onFirstDataRendered={onFirstDataRendered}
                    onRowDataUpdated={onRowDataUpdated}
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
