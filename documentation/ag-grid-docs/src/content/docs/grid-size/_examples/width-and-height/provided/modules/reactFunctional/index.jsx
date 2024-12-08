import React, { StrictMode, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule, ModuleRegistry, ValidationModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule /* Development Only */]);

const GridExample = () => {
    const gridRef = useRef(null);
    const [rowData, setRowData] = useState(null);
    const columnDefs = useMemo(
        () => [
            { field: 'athlete', width: 150 },
            { field: 'age', width: 90 },
            { field: 'country', width: 150 },
            { field: 'year', width: 90 },
            { field: 'date', width: 150 },
            { field: 'sport', width: 150 },
            { field: 'gold', width: 100 },
            { field: 'silver', width: 100 },
            { field: 'bronze', width: 100 },
            { field: 'total', width: 100 },
        ],
        []
    );
    const [style, setStyle] = useState({
        height: '100%',
        width: '100%',
    });

    const onGridReady = (params) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => {
                setRowData(data);
            });
    };

    const fillLarge = () => {
        setWidthAndHeight('100%', '100%');
    };

    const fillMedium = () => {
        setWidthAndHeight('60%', '60%');
    };

    const fillExact = () => {
        setWidthAndHeight('400px', '400px');
    };

    const setWidthAndHeight = (width, height) => {
        setStyle({
            width,
            height,
        });
    };

    return (
        <div className="example-wrapper">
            <div style={{ marginBottom: '5px' }}>
                <button onClick={() => fillLarge()}>Fill 100%</button>
                <button onClick={() => fillMedium()}>Fill 60%</button>
                <button onClick={() => fillExact()}>Exactly 400 x 400 pixels</button>
            </div>
            <div className="grid-wrapper">
                <div style={style}>
                    <AgGridReact ref={gridRef} rowData={rowData} columnDefs={columnDefs} onGridReady={onGridReady} />
                </div>
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
