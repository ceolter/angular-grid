import React, { StrictMode, useCallback, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { CommunityFeaturesModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

ModuleRegistry.registerModules([
    CommunityFeaturesModule,
    ClientSideRowModelModule,

    SetFilterModule,
    MenuModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
]);

const colourCellRenderer = (props) => {
    if (!props.value || props.value === '(Select All)') {
        return props.value;
    }

    const styles = {
        verticalAlign: 'middle',
        border: '1px solid black',
        margin: 3,
        display: 'inline-block',
        width: 10,
        height: 10,
        backgroundColor: props.value.toLowerCase(),
    };
    return (
        <React.Fragment>
            <div style={styles} />
            {props.value}
        </React.Fragment>
    );
};

const GridExample = () => {
    const gridRef = useRef(null);
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState([
        { colour: 'Black' },
        { colour: 'BLACK' },
        { colour: 'black' },
        { colour: 'Red' },
        { colour: 'RED' },
        { colour: 'red' },
        { colour: 'Orange' },
        { colour: 'ORANGE' },
        { colour: 'orange' },
        { colour: 'White' },
        { colour: 'WHITE' },
        { colour: 'white' },
        { colour: 'Yellow' },
        { colour: 'YELLOW' },
        { colour: 'yellow' },
        { colour: 'Green' },
        { colour: 'GREEN' },
        { colour: 'green' },
        { colour: 'Purple' },
        { colour: 'PURPLE' },
        { colour: 'purple' },
    ]);
    const [columnDefs, setColumnDefs] = useState([
        {
            headerName: 'Case Insensitive (default)',
            field: 'colour',
            filter: 'agSetColumnFilter',
            filterParams: {
                caseSensitive: false,
                cellRenderer: colourCellRenderer,
            },
        },
        {
            headerName: 'Case Sensitive',
            field: 'colour',
            filter: 'agSetColumnFilter',
            filterParams: {
                caseSensitive: true,
                cellRenderer: colourCellRenderer,
            },
        },
    ]);
    const defaultColDef = useMemo(() => {
        return {
            flex: 1,
            minWidth: 225,
            cellRenderer: colourCellRenderer,
            floatingFilter: true,
        };
    }, []);

    const onFirstDataRendered = useCallback((params) => {
        gridRef.current.api.getToolPanelInstance('filters').expandFilters();
    }, []);

    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={gridStyle}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        sideBar={'filters'}
                        onFirstDataRendered={onFirstDataRendered}
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
