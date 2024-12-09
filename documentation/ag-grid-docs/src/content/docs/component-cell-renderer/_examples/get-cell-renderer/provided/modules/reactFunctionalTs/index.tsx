import React, { StrictMode, useCallback, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { ColDef, GridReadyEvent, ValueGetterParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    NumberFilterModule,
    RenderApiModule,
    RowApiModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import type { IOlympicData } from './interfaces';
import MedalCellRenderer from './medalCellRenderer';
import './styles.css';

ModuleRegistry.registerModules([
    RenderApiModule,
    NumberEditorModule,
    TextEditorModule,
    TextFilterModule,
    NumberFilterModule,
    RowApiModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const GridExample = () => {
    const gridRef = useRef<AgGridReact<IOlympicData>>(null);
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState<IOlympicData[]>();
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([
        { field: 'athlete', width: 150 },
        { field: 'country', width: 150 },
        { field: 'year', width: 100 },
        { field: 'gold', width: 100, cellRenderer: MedalCellRenderer },
        { field: 'silver', width: 100, cellRenderer: MedalCellRenderer },
        { field: 'bronze', width: 100, cellRenderer: MedalCellRenderer },
        {
            field: 'total',
            editable: false,
            valueGetter: (params: ValueGetterParams) => params.data.gold + params.data.silver + params.data.bronze,
            width: 100,
        },
    ]);
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            editable: true,
            flex: 1,
            minWidth: 100,
            filter: true,
        };
    }, []);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data: IOlympicData[]) => {
                setRowData(data);
            });
    }, []);

    const onCallGold = useCallback(() => {
        console.log('=========> calling all gold');
        // pass in list of columns, here it's gold only
        const params = { columns: ['gold'] };
        const instances = gridRef.current!.api.getCellRendererInstances(params) as any[];
        instances.forEach((instance) => {
            instance.medalUserFunction();
        });
    }, []);

    const onFirstRowGold = useCallback(() => {
        console.log('=========> calling gold row one');
        // pass in one column and one row to identify one cell
        const firstRowNode = gridRef.current!.api.getDisplayedRowAtIndex(0)!;
        const params = { columns: ['gold'], rowNodes: [firstRowNode] };
        const instances = gridRef.current!.api.getCellRendererInstances(params) as any[];
        instances.forEach((instance) => {
            instance.medalUserFunction();
        });
    }, []);

    const onCallAllCells = useCallback(() => {
        console.log('=========> calling everything');
        // no params, goes through all rows and columns where cell renderer exists
        const instances = gridRef.current!.api.getCellRendererInstances() as any[];
        instances.forEach((instance) => {
            instance.medalUserFunction();
        });
    }, []);

    return (
        <div style={containerStyle}>
            <div className="example-wrapper">
                <div style={{ marginBottom: '5px' }}>
                    <button onClick={onCallGold}>Gold</button>
                    <button onClick={onFirstRowGold}>First Row Gold</button>
                    <button onClick={onCallAllCells}>All Cells</button>
                </div>

                <div style={gridStyle}>
                    <AgGridReact<IOlympicData>
                        ref={gridRef}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
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
