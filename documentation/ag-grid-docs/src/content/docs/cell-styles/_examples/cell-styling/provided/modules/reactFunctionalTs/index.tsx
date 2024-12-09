import React, { StrictMode, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { CellClassParams, CellClassRules, ColDef, GridReadyEvent, ValueParserParams } from 'ag-grid-community';
import {
    CellStyleModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    TextEditorModule,
    ValidationModule,
} from 'ag-grid-community';
import type { CustomCellRendererProps } from 'ag-grid-react';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([
    NumberEditorModule,
    TextEditorModule,
    CellStyleModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const ragCellClassRules: CellClassRules = {
    'rag-green-outer': (params) => params.value === 2008,
    'rag-blue-outer': (params) => params.value === 2004,
    'rag-red-outer': (params) => params.value === 2000,
};

const cellStyle = (params: CellClassParams) => {
    const color = numberToColor(params.value);
    return {
        backgroundColor: color,
    };
};

const cellClass = (params: CellClassParams) => {
    return params.value === 'Swimming' ? 'rag-green' : 'rag-blue';
};

const numberToColor = (val: number) => {
    if (val === 0) {
        return '#ffaaaa';
    } else if (val == 1) {
        return '#aaaaff';
    } else {
        return '#aaffaa';
    }
};

const ragRenderer = (params: CustomCellRendererProps) => {
    return <span className="rag-element">{params.value}</span>;
};

const numberParser = (params: ValueParserParams) => {
    const newValue = params.newValue;
    let valueAsNumber;
    if (newValue === null || newValue === undefined || newValue === '') {
        valueAsNumber = null;
    } else {
        valueAsNumber = parseFloat(params.newValue);
    }
    return valueAsNumber;
};

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState();
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([
        { field: 'athlete' },
        {
            field: 'age',
            maxWidth: 90,
            valueParser: numberParser,
            cellClassRules: {
                'rag-green': 'x < 20',
                'rag-blue': 'x >= 20 && x < 25',
                'rag-red': 'x >= 25',
            },
        },
        { field: 'country' },
        {
            field: 'year',
            maxWidth: 90,
            valueParser: numberParser,
            cellClassRules: ragCellClassRules,
            cellRenderer: ragRenderer,
        },
        { field: 'date', cellClass: 'rag-blue' },
        {
            field: 'sport',
            cellClass: cellClass,
        },
        {
            field: 'gold',
            valueParser: numberParser,
            cellStyle: {
                // you can use either came case or dashes, the grid converts to whats needed
                backgroundColor: '#aaffaa', // light green
            },
        },
        {
            field: 'silver',
            valueParser: numberParser,
            // when cellStyle is a func, we can have the style change
            // dependent on the data, eg different colors for different values
            cellStyle: cellStyle,
        },
        {
            field: 'bronze',
            valueParser: numberParser,
            // same as above, but demonstrating dashes in the style, grid takes care of converting to/from camel case
            cellStyle: cellStyle,
        },
    ]);
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            flex: 1,
            minWidth: 150,
            editable: true,
        };
    }, []);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => setRowData(data));
    }, []);

    return (
        <div style={containerStyle}>
            <div style={gridStyle}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    onGridReady={onGridReady}
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
