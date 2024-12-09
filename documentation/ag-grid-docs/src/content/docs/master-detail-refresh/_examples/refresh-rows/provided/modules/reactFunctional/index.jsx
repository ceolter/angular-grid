import React, { StrictMode, useCallback, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    HighlightChangesModule,
    ModuleRegistry,
    RowApiModule,
    RowSelectionModule,
    ValidationModule,
} from 'ag-grid-community';
import { ColumnMenuModule, ColumnsToolPanelModule, ContextMenuModule, MasterDetailModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

ModuleRegistry.registerModules([
    ClientSideRowModelApiModule,
    RowSelectionModule,
    RowApiModule,
    HighlightChangesModule,
    ClientSideRowModelModule,
    MasterDetailModule,
    ColumnMenuModule,
    ContextMenuModule,
    ColumnsToolPanelModule,
    ValidationModule /* Development Only */,
]);

let allRowData;

const GridExample = () => {
    const gridRef = useRef(null);
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState();
    const [columnDefs, setColumnDefs] = useState([
        // group cell renderer needed for expand / collapse icons
        { field: 'name', cellRenderer: 'agGroupCellRenderer' },
        { field: 'account' },
        { field: 'calls' },
        { field: 'minutes', valueFormatter: "x.toLocaleString() + 'm'" },
    ]);
    const defaultColDef = useMemo(() => {
        return {
            flex: 1,
            enableCellChangeFlash: true,
        };
    }, []);
    const getRowId = useCallback(function (params) {
        return String(params.data.account);
    }, []);
    const detailCellRendererParams = useMemo(() => {
        return {
            refreshStrategy: 'rows',
            detailGridOptions: {
                rowSelection: { mode: 'multiRow' },
                getRowId: (params) => {
                    return String(params.data.callId);
                },
                columnDefs: [
                    { field: 'callId' },
                    { field: 'direction' },
                    { field: 'number', minWidth: 150 },
                    { field: 'duration', valueFormatter: "x.toLocaleString() + 's'" },
                    { field: 'switchCode', minWidth: 150 },
                ],
                defaultColDef: {
                    flex: 1,
                    enableCellChangeFlash: true,
                },
            },
            getDetailRowData: (params) => {
                params.successCallback(params.data.callRecords);
            },
        };
    }, []);

    const onGridReady = useCallback((params) => {
        fetch('https://www.ag-grid.com/example-assets/master-detail-data.json')
            .then((resp) => resp.json())
            .then((data) => {
                allRowData = data;
                setRowData(data);
            });
    }, []);

    const onFirstDataRendered = useCallback((params) => {
        // arbitrarily expand a row for presentational purposes
        setTimeout(function () {
            gridRef.current.api.getDisplayedRowAtIndex(0).setExpanded(true);
        }, 0);
        setInterval(function () {
            if (!allRowData) {
                return;
            }
            const data = allRowData[0];
            const newCallRecords = [];
            data.callRecords.forEach(function (record, index) {
                newCallRecords.push({
                    name: record.name,
                    callId: record.callId,
                    duration: record.duration + (index % 2),
                    switchCode: record.switchCode,
                    direction: record.direction,
                    number: record.number,
                });
            });
            data.callRecords = newCallRecords;
            data.calls++;
            const tran = {
                update: [data],
            };
            gridRef.current.api.applyTransaction(tran);
        }, 2000);
    }, []);

    return (
        <div style={containerStyle}>
            <div style={gridStyle}>
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    getRowId={getRowId}
                    masterDetail={true}
                    detailCellRendererParams={detailCellRendererParams}
                    onGridReady={onGridReady}
                    onFirstDataRendered={onFirstDataRendered}
                />
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
