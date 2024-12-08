import React, { StrictMode, useCallback, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { CellDoubleClickedEvent, CellKeyDownEvent, ColDef } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import CustomGroupCellRenderer from './customGroupCellRenderer';
import { getData } from './data';
import './styles.css';

ModuleRegistry.registerModules([ClientSideRowModelModule, TreeDataModule, ValidationModule /* Development Only */]);

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([
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
    const autoGroupColumnDef = useMemo<ColDef>(() => {
        return {
            cellRenderer: CustomGroupCellRenderer,
        };
    }, []);
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            flex: 1,
            minWidth: 120,
        };
    }, []);

    const getDataPath = useCallback((data: any) => data.path, []);

    const onCellDoubleClicked = useCallback((params: CellDoubleClickedEvent) => {
        if (params.colDef.showRowGroup) {
            params.node.setExpanded(!params.node.expanded);
        }
    }, []);

    const onCellKeyDown = useCallback((params: CellKeyDownEvent) => {
        if (!('colDef' in params)) {
            return;
        }
        if (!(params.event instanceof KeyboardEvent)) {
            return;
        }
        if (params.event.code !== 'Enter') {
            return;
        }
        if (params.colDef.showRowGroup) {
            params.node.setExpanded(!params.node.expanded);
        }
    }, []);

    return (
        <div style={containerStyle}>
            <div style={gridStyle}>
                <AgGridReact
                    treeData
                    getDataPath={getDataPath}
                    rowData={getData()}
                    columnDefs={columnDefs}
                    autoGroupColumnDef={autoGroupColumnDef}
                    defaultColDef={defaultColDef}
                    groupDefaultExpanded={1}
                    onCellDoubleClicked={onCellDoubleClicked}
                    onCellKeyDown={onCellKeyDown}
                />
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
