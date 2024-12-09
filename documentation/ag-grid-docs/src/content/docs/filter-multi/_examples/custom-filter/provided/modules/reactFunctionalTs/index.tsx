import React, { StrictMode, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { ColDef, GridReadyEvent, IMultiFilterParams } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, NumberFilterModule, ValidationModule } from 'ag-grid-community';
import {
    ClipboardModule,
    ColumnMenuModule,
    ContextMenuModule,
    FiltersToolPanelModule,
    MultiFilterModule,
    SetFilterModule,
} from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import YearFilter from './YearFilter';
import YearFloatingFilter from './YearFloatingFilter';
import type { IOlympicData } from './interfaces';
import './style.css';

ModuleRegistry.registerModules([
    NumberFilterModule,
    ClientSideRowModelModule,
    MultiFilterModule,
    SetFilterModule,
    ColumnMenuModule,
    ContextMenuModule,
    ClipboardModule,
    FiltersToolPanelModule,
    ValidationModule /* Development Only */,
]);

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState<IOlympicData[]>();
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([
        { field: 'athlete', filter: 'agMultiColumnFilter' },
        { field: 'sport', filter: 'agMultiColumnFilter' },
        {
            field: 'year',
            filter: 'agMultiColumnFilter',
            filterParams: {
                filters: [
                    {
                        filter: YearFilter,
                        floatingFilterComponent: YearFloatingFilter,
                    },
                    {
                        filter: 'agNumberColumnFilter',
                    },
                ],
            } as IMultiFilterParams,
        },
    ]);
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            flex: 1,
            minWidth: 200,
            floatingFilter: true,
            suppressHeaderMenuButton: true,
            suppressHeaderContextMenu: true,
        };
    }, []);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data: IOlympicData[]) => setRowData(data));
    }, []);

    return (
        <div style={containerStyle}>
            <div style={gridStyle}>
                <AgGridReact<IOlympicData>
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
