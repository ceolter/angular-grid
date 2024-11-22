import React, { StrictMode, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GetContextMenuItemsParams, GetMainMenuItemsParams, GridReadyEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ClipboardModule } from 'ag-grid-enterprise';
import { ExcelExportModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { CellSelectionModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import type { IOlympicData } from './interfaces';
import MenuItem from './menuItem';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,

    ColumnMenuModule,
    ContextMenuModule,
    ExcelExportModule,
    CellSelectionModule,
    ClipboardModule,
]);

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState<IOlympicData[]>();
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([
        { field: 'athlete' },
        { field: 'country' },
        { field: 'sport' },
        { field: 'year' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
    ]);
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            flex: 1,
            minWidth: 100,
        };
    }, []);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data: IOlympicData[]) => {
                setRowData(data);
            });
    }, []);

    const getMainMenuItems = useCallback((params: GetMainMenuItemsParams) => {
        return [
            ...params.defaultItems,
            'separator',
            {
                name: 'Click Alert Button and Close Menu',
                menuItem: MenuItem,
                menuItemParams: {
                    buttonValue: 'Alert',
                },
            },
            {
                name: 'Click Alert Button and Keep Menu Open',
                suppressCloseOnSelect: true,
                menuItem: MenuItem,
                menuItemParams: {
                    buttonValue: 'Alert',
                },
            },
        ];
    }, []);

    const getContextMenuItems = useCallback((params: GetContextMenuItemsParams) => {
        return [
            ...(params.defaultItems || []),
            'separator',
            {
                name: 'Click Alert Button and Close Menu',
                menuItem: MenuItem,
                menuItemParams: {
                    buttonValue: 'Alert',
                },
            },
            {
                name: 'Click Alert Button and Keep Menu Open',
                suppressCloseOnSelect: true,
                menuItem: MenuItem,
                menuItemParams: {
                    buttonValue: 'Alert',
                },
            },
        ];
    }, []);

    return (
        <div style={containerStyle}>
            <div style={gridStyle}>
                <AgGridReact<IOlympicData>
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    getMainMenuItems={getMainMenuItems}
                    getContextMenuItems={getContextMenuItems}
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
