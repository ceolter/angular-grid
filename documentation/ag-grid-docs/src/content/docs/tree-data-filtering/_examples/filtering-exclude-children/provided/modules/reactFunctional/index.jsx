import React, { StrictMode, useCallback, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import { getData } from './data';
import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, TreeDataModule]);

const GridExample = () => {
    const gridRef = useRef(null);
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState(getData());
    const [columnDefs, setColumnDefs] = useState([
        { field: 'created' },
        { field: 'modified' },
        {
            field: 'size',
            aggFunc: 'sum',
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
    const defaultColDef = useMemo(() => {
        return {
            flex: 1,
        };
    }, []);
    const autoGroupColumnDef = useMemo(() => {
        return {
            headerName: 'File Explorer',
            minWidth: 150,
            filter: 'agTextColumnFilter',
            cellRendererParams: {
                suppressCount: true,
            },
        };
    }, []);
    const getDataPath = useCallback((data) => data.path, []);

    const onGridReady = useCallback((params) => {
        params.api.setFilterModel({
            'ag-Grid-AutoColumn': {
                filterType: 'text',
                type: 'startsWith',
                filter: 'ProjectAlpha',
            },
        });
    }, []);

    const toggleFilter = useCallback(() => {
        const checkbox = document.querySelector('#excludeChildrenWhenTreeDataFiltering');
        gridRef.current.api.setGridOption('excludeChildrenWhenTreeDataFiltering', checkbox.checked);
    }, []);

    return (
        <div style={containerStyle}>
            <div className="example-wrapper">
                <div className="example-header">
                    <label>
                        <span>excludeChildrenWhenTreeDataFiltering:</span>
                        <input
                            type="checkbox"
                            id="excludeChildrenWhenTreeDataFiltering"
                            onClick={toggleFilter}
                            defaultChecked
                        />
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
                        groupDefaultExpanded={-1}
                        excludeChildrenWhenTreeDataFiltering={true}
                        getDataPath={getDataPath}
                        onGridReady={onGridReady}
                    />
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
