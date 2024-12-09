import React, { StrictMode, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    EventApiModule,
    ModuleRegistry,
    NumberEditorModule,
    NumberFilterModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import { ColumnsToolPanelModule, FiltersToolPanelModule, SetFilterModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import CustomStatsToolPanel from './customStatsToolPanel.jsx';
import './styles.css';

ModuleRegistry.registerModules([
    ClientSideRowModelApiModule,
    NumberEditorModule,
    TextEditorModule,
    TextFilterModule,
    NumberFilterModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    SetFilterModule,
    EventApiModule,
    ValidationModule /* Development Only */,
]);

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState();
    const [columnDefs, setColumnDefs] = useState([
        { field: 'athlete', width: 150, filter: 'agTextColumnFilter' },
        { field: 'age', width: 90 },
        { field: 'country', width: 120 },
        { field: 'year', width: 90 },
        { field: 'date', width: 110 },
        { field: 'gold', width: 100, filter: false },
        { field: 'silver', width: 100, filter: false },
        { field: 'bronze', width: 100, filter: false },
        { field: 'total', width: 100, filter: false },
    ]);
    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            flex: 1,
            minWidth: 100,
            filter: true,
        };
    }, []);
    const icons = useMemo(() => {
        return {
            'custom-stats': '<span class="ag-icon ag-icon-custom-stats"></span>',
        };
    }, []);
    const sideBar = useMemo(() => {
        return {
            toolPanels: [
                {
                    id: 'columns',
                    labelDefault: 'Columns',
                    labelKey: 'columns',
                    iconKey: 'columns',
                    toolPanel: 'agColumnsToolPanel',
                },
                {
                    id: 'filters',
                    labelDefault: 'Filters',
                    labelKey: 'filters',
                    iconKey: 'filter',
                    toolPanel: 'agFiltersToolPanel',
                },
                {
                    id: 'customStats',
                    labelDefault: 'Custom Stats',
                    labelKey: 'customStats',
                    iconKey: 'custom-stats',
                    toolPanel: CustomStatsToolPanel,
                    toolPanelParams: {
                        title: 'Custom Stats',
                    },
                },
            ],
            defaultToolPanel: 'customStats',
        };
    }, []);

    const onGridReady = useCallback((params) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => {
                setRowData(data);
            });
    }, []);

    const onCellValueChanged = useCallback((params) => {
        params.api.refreshClientSideRowModel();
    }, []);

    return (
        <div style={containerStyle}>
            <div style={{ height: '100%', boxSizing: 'border-box' }}>
                <div style={gridStyle}>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        icons={icons}
                        sideBar={sideBar}
                        onGridReady={onGridReady}
                        onCellValueChanged={onCellValueChanged}
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
