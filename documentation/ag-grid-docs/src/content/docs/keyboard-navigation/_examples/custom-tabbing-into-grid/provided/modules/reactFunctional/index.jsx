import React, { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    NumberFilterModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([
    NumberEditorModule,
    TextEditorModule,
    TextFilterModule,
    NumberFilterModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const GridExample = () => {
    const [gridApi, setGridApi] = useState(null);
    const [rowData, setRowData] = useState(null);
    const [lastFocused, setLastFocused] = useState();
    const columnDefs = useMemo(
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

    const onGridReady = (params) => {
        setGridApi(params.api);

        const updateData = (data) => {
            setRowData(data);
        };

        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => updateData(data));
    };

    const onCellFocused = (params) => {
        setLastFocused({ column: params.column, rowIndex: params.rowIndex });
    };

    const onHeaderFocused = (params) => {
        setLastFocused({ column: params.column, rowIndex: null });
    };

    const focusGridInnerElement = (params) => {
        if (!lastFocused || !lastFocused.column) {
            return false;
        }

        if (lastFocused.rowIndex != null) {
            gridApi.setFocusedCell(lastFocused.rowIndex, lastFocused.column);
        } else {
            gridApi.setFocusedHeader(lastFocused.column);
        }

        return true;
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
                        onCellFocused={onCellFocused}
                        onHeaderFocused={onHeaderFocused}
                        focusGridInnerElement={focusGridInnerElement}
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

const root = createRoot(document.getElementById('root'));
root.render(
    <StrictMode>
        <GridExample />
    </StrictMode>
);
