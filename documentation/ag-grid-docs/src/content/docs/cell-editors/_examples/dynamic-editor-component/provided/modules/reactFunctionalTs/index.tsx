import React, { StrictMode, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    CellEditingStartedEvent,
    CellEditingStoppedEvent,
    CellEditorSelectorResult,
    ColDef,
    ICellEditorParams,
    RowEditingStartedEvent,
    RowEditingStoppedEvent,
} from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { RichSelectModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import type { IRow } from './data';
import { getData } from './data';
import MoodEditor from './moodEditor';
import NumericCellEditor from './numericCellEditor';
import './styles.css';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnMenuModule,
    ContextMenuModule,
    ColumnsToolPanelModule,
    RichSelectModule,
]);

const cellEditorSelector: (params: ICellEditorParams<IRow>) => CellEditorSelectorResult | undefined = (
    params: ICellEditorParams<IRow>
) => {
    if (params.data.type === 'age') {
        return {
            component: NumericCellEditor,
        };
    }
    if (params.data.type === 'gender') {
        return {
            component: 'agRichSelectCellEditor',
            params: {
                values: ['Male', 'Female'],
            },
        };
    }
    if (params.data.type === 'mood') {
        return {
            component: MoodEditor,
            popup: true,
            popupPosition: 'under',
        };
    }
    return undefined;
};

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState<IRow[]>(getData());
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([
        { field: 'type' },
        {
            field: 'value',
            editable: true,
            cellEditorSelector: cellEditorSelector,
        },
    ]);
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            flex: 1,
            cellDataType: false,
        };
    }, []);

    const onRowEditingStarted = useCallback((event: RowEditingStartedEvent) => {
        console.log('never called - not doing row editing');
    }, []);

    const onRowEditingStopped = useCallback((event: RowEditingStoppedEvent) => {
        console.log('never called - not doing row editing');
    }, []);

    const onCellEditingStarted = useCallback((event: CellEditingStartedEvent) => {
        console.log('cellEditingStarted');
    }, []);

    const onCellEditingStopped = useCallback((event: CellEditingStoppedEvent) => {
        console.log('cellEditingStopped');
    }, []);

    return (
        <div style={containerStyle}>
            <div style={gridStyle}>
                <AgGridReact<IRow>
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    onRowEditingStarted={onRowEditingStarted}
                    onRowEditingStopped={onRowEditingStopped}
                    onCellEditingStarted={onCellEditingStarted}
                    onCellEditingStopped={onCellEditingStopped}
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
