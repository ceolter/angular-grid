import React, { StrictMode, useCallback, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { CellValueChangedEvent, ColDef, RowValueChangedEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import NumericCellEditor from './numericCellEditor';
import './styles.css';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
]);

function getRowData(): any[] {
    const rowData: any[] = [];
    for (let i = 0; i < 10; i++) {
        rowData.push({
            make: 'Toyota',
            model: 'Celica',
            price: 35000 + i * 1000,
            field4: 'Sample XX',
            field5: 'Sample 22',
            field6: 'Sample 23',
        });
        rowData.push({
            make: 'Ford',
            model: 'Mondeo',
            price: 32000 + i * 1000,
            field4: 'Sample YY',
            field5: 'Sample 24',
            field6: 'Sample 25',
        });
        rowData.push({
            make: 'Porsche',
            model: 'Boxster',
            price: 72000 + i * 1000,
            field4: 'Sample ZZ',
            field5: 'Sample 26',
            field6: 'Sample 27',
        });
    }
    return rowData;
}

const GridExample = () => {
    const gridRef = useRef<AgGridReact>(null);
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState<any[]>(getRowData());
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([
        {
            field: 'make',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
            },
        },
        { field: 'model' },
        { field: 'field4', headerName: 'Read Only', editable: false },
        { field: 'price', cellEditor: NumericCellEditor },
        {
            headerName: 'Suppress Navigable',
            field: 'field5',
            suppressNavigable: true,
            minWidth: 200,
        },
        { headerName: 'Read Only', field: 'field6', editable: false },
    ]);
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            flex: 1,
            editable: true,
            cellDataType: false,
        };
    }, []);

    const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
        console.log('onCellValueChanged: ' + event.colDef.field + ' = ' + event.newValue);
    }, []);

    const onRowValueChanged = useCallback((event: RowValueChangedEvent) => {
        const data = event.data;
        console.log(
            'onRowValueChanged: (' + data.make + ', ' + data.model + ', ' + data.price + ', ' + data.field5 + ')'
        );
    }, []);

    const onBtStopEditing = useCallback(() => {
        gridRef.current!.api.stopEditing();
    }, []);

    const onBtStartEditing = useCallback(() => {
        gridRef.current!.api.setFocusedCell(1, 'make');
        gridRef.current!.api.startEditingCell({
            rowIndex: 1,
            colKey: 'make',
        });
    }, []);

    return (
        <div style={containerStyle}>
            <div className="example-wrapper">
                <div style={{ marginBottom: '5px' }}>
                    <button style={{ fontSize: '12px' }} onClick={onBtStartEditing}>
                        Start Editing Line 2
                    </button>
                    <button style={{ fontSize: '12px' }} onClick={onBtStopEditing}>
                        Stop Editing
                    </button>
                </div>
                <div style={gridStyle}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        editType={'fullRow'}
                        onCellValueChanged={onCellValueChanged}
                        onRowValueChanged={onRowValueChanged}
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
