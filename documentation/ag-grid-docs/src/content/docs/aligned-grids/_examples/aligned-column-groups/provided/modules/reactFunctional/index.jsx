import React, { StrictMode, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
    AlignedGridsModule,
    ClientSideRowModelModule,
    ColumnAutoSizeModule,
    ModuleRegistry,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([
    TextFilterModule,
    ColumnAutoSizeModule,
    AlignedGridsModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const GridExample = () => {
    const topGridRef = useRef(null);
    const bottomGridRef = useRef(null);

    const defaultColDef = useMemo(
        () => ({
            filter: true,
            flex: 1,
            minWidth: 120,
        }),
        []
    );

    const columnDefs = useMemo(
        () => [
            {
                headerName: 'Group 1',
                groupId: 'Group1',
                children: [
                    { field: 'athlete', pinned: true },
                    { field: 'age', pinned: true, columnGroupShow: 'open' },
                    { field: 'country' },
                    { field: 'year', columnGroupShow: 'open' },
                    { field: 'date' },
                    { field: 'sport', columnGroupShow: 'open' },
                ],
            },
            {
                headerName: 'Group 2',
                groupId: 'Group2',
                children: [
                    { field: 'athlete', pinned: true },
                    { field: 'age', pinned: true, columnGroupShow: 'open' },
                    { field: 'country' },
                    { field: 'year', columnGroupShow: 'open' },
                    { field: 'date' },
                    { field: 'sport', columnGroupShow: 'open' },
                ],
            },
        ],
        []
    );

    const [rowData, setRowData] = useState([]);

    const autoSizeStrategy = useMemo(
        () => ({
            type: 'fitGridWidth',
        }),
        []
    );

    const onGridReady = (params) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => {
                setRowData(data);
            });
    };

    const onFirstDataRendered = (params) => {
        // mix up some columns
        params.api.moveColumnByIndex(11, 4);
        params.api.moveColumnByIndex(11, 4);
    };

    return (
        <div className="container">
            <div className="grid">
                <AgGridReact
                    ref={topGridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    onGridReady={onGridReady}
                    onFirstDataRendered={onFirstDataRendered}
                    alignedGrids={[bottomGridRef]}
                    autoSizeStrategy={autoSizeStrategy}
                />
            </div>

            <div className="divider"></div>

            <div className="grid">
                <AgGridReact
                    ref={bottomGridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    alignedGrids={[topGridRef]}
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
