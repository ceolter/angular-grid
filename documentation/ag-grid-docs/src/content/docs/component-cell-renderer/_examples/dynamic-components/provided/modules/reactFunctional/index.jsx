import React, { StrictMode, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    RenderApiModule,
    RowApiModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([
    RenderApiModule,
    NumberEditorModule,
    TextEditorModule,
    TextFilterModule,
    RowApiModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const SquareRenderer = (props) => {
    const valueSquared = (value) => {
        return value * value;
    };

    return <span>{valueSquared(props.value)}</span>;
};

const CubeRenderer = (props) => {
    const valueCubed = (value) => {
        return value * value * value;
    };

    return <span>{valueCubed(props.value)}</span>;
};

const ParamsRenderer = (props) => {
    return (
        <span>
            Field: {props.colDef.field}, Value: {props.value}
        </span>
    );
};

const CurrencyRenderer = (props) => {
    const value = useMemo(() => props.value, [props.value]);

    const formatValueToCurrency = (currency, value) => {
        return `${currency} ${value.toFixed(2)}`;
    };

    return <span>{formatValueToCurrency('EUR', value)}</span>;
};

const ChildMessageRenderer = (props) => {
    const invokeParentMethod = () => {
        props.context.methodFromParent(`Row: ${props.node.rowIndex}, Col: ${props.colDef.field}`);
    };

    return (
        <span>
            <button style={{ height: 20, lineHeight: 0.5 }} onClick={invokeParentMethod} className="btn btn-info">
                Invoke Parent
            </button>
        </span>
    );
};

const createRowData = () => {
    const rowData = [];
    for (let i = 0; i < 15; i++) {
        rowData.push({
            row: 'Row ' + i,
            value: i,
            currency: i + Number(Math.random().toFixed(2)),
        });
    }
    return rowData;
};

const GridExample = () => {
    const [rowData, setRowData] = useState(createRowData());
    const gridRef = useRef();

    const columnDefs = useMemo(
        () => [
            {
                headerName: 'Row',
                field: 'row',
                width: 150,
            },
            {
                headerName: 'Square',
                field: 'value',
                cellRenderer: SquareRenderer,
                editable: true,
                colId: 'square',
                width: 150,
            },
            {
                headerName: 'Cube',
                field: 'value',
                cellRenderer: CubeRenderer,
                colId: 'cube',
                width: 150,
            },
            {
                headerName: 'Row Params',
                field: 'row',
                cellRenderer: ParamsRenderer,
                colId: 'params',
                width: 150,
            },
            {
                headerName: 'Currency',
                field: 'currency',
                cellRenderer: CurrencyRenderer,
                colId: 'currency',
                width: 120,
            },
            {
                headerName: 'Child/Parent',
                field: 'value',
                cellRenderer: ChildMessageRenderer,
                colId: 'params',
                editable: false,
                minWidth: 150,
            },
        ],
        []
    );

    const refreshEvenRowsCurrencyData = () => {
        gridRef.current.api.forEachNode((rowNode) => {
            if (rowNode.data.value % 2 === 0) {
                rowNode.setDataValue('currency', rowNode.data.value + Number(Math.random().toFixed(2)));
            }
        });

        gridRef.current.api.refreshCells({ columns: ['currency'] });
    };

    const methodFromParent = (cell) => {
        alert('Parent Component Method from ' + cell + '!');
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
            <div className="example-wrapper">
                <button
                    onClick={() => refreshEvenRowsCurrencyData()}
                    style={{ marginBottom: '10px' }}
                    className="btn btn-primary"
                >
                    Refresh Even Row Currency Data
                </button>
                <div
                    id="myGrid"
                    style={{
                        height: '100%',
                        width: '100%',
                    }}
                >
                    <AgGridReact
                        ref={gridRef}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        getRowId={(params) => params.data.row}
                        context={{
                            methodFromParent,
                        }}
                        defaultColDef={defaultColDef}
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
