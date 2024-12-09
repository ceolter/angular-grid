import React, { StrictMode, useCallback, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { ColDef, GridReadyEvent } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import { getData } from './data';
import './styles.css';

ModuleRegistry.registerModules([
    NumberFilterModule,
    TextFilterModule,
    ClientSideRowModelModule,
    TreeDataModule,
    ValidationModule /* Development Only */,
]);

const GridExample = () => {
    const gridRef = useRef<AgGridReact>(null);
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState<any[]>(getData());
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([
        { field: 'created' },
        { field: 'modified' },
        {
            field: 'size',
            aggFunc: 'sum',
            filter: 'agNumberColumnFilter',
            valueFormatter: (params) => {
                const sizeInKb = params.value / 1024;

                if (sizeInKb > 1024) {
                    return `${+(sizeInKb / 1024).toFixed(2)} MB`;
                } else {
                    return `${+sizeInKb.toFixed(2)} KB`;
                }
            },
        },
    ]);
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            flex: 1,
        };
    }, []);
    const autoGroupColumnDef = useMemo<ColDef>(() => {
        return {
            headerName: 'File Explorer',
            minWidth: 150,

            cellRendererParams: {
                suppressCount: true,
            },
        };
    }, []);
    const getDataPath = useCallback((data) => data.path, []);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        params.api.setFilterModel({
            size: {
                filterType: 'number',
                type: 'equal',
                filter: 5193728,
            },
        });
    }, []);

    const toggleCheckbox = useCallback(() => {
        const checkbox = document.querySelector<HTMLInputElement>('#suppressAggFilteredOnly')!;
        gridRef.current!.api.setGridOption('suppressAggFilteredOnly', checkbox.checked);
    }, []);

    return (
        <div style={containerStyle}>
            <div className="example-wrapper">
                <div className="example-header">
                    <label>
                        <span>suppressAggFilteredOnly:</span>
                        <input type="checkbox" id="suppressAggFilteredOnly" onClick={toggleCheckbox} defaultChecked />
                    </label>
                </div>

                <div style={gridStyle}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        autoGroupColumnDef={autoGroupColumnDef}
                        treeData={true}
                        groupDefaultExpanded={1}
                        suppressAggFilteredOnly={true}
                        getDataPath={getDataPath}
                        onGridReady={onGridReady}
                    />
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
