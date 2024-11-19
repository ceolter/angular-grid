import React, { StrictMode, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, FirstDataRenderedEvent, GridReadyEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { MasterDetailModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import DetailCellRenderer from './detailCellRenderer';
import type { IAccount } from './interfaces';
import './styles.css';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    MasterDetailModule,
    ColumnMenuModule,
    ContextMenuModule,
    ColumnsToolPanelModule,
]);

let allRowData: any[];

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState<IAccount[]>();
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([
        // group cell renderer needed for expand / collapse icons
        { field: 'name', cellRenderer: 'agGroupCellRenderer' },
        { field: 'account' },
        { field: 'calls' },
        { field: 'minutes', valueFormatter: "x.toLocaleString() + 'm'" },
    ]);
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            flex: 1,
            enableCellChangeFlash: true,
        };
    }, []);
    const detailCellRenderer = useMemo(() => {
        return DetailCellRenderer;
    }, []);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        fetch('https://www.ag-grid.com/example-assets/master-detail-data.json')
            .then((resp) => resp.json())
            .then((data: IAccount[]) => {
                allRowData = data;
                setRowData(allRowData);
            });
    }, []);

    const onFirstDataRendered = useCallback(
        (params: FirstDataRenderedEvent) => {
            setInterval(() => {
                if (!allRowData) {
                    return;
                }
                const data = allRowData[0];
                const newCallRecords: any[] = [];
                data.callRecords.forEach((record: any, index: number) => {
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
                params.api.applyTransaction(tran);
            }, 2000);
        },
        [allRowData]
    );

    return (
        <div style={containerStyle}>
            <div style={gridStyle}>
                <AgGridReact<IAccount>
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    masterDetail={true}
                    detailCellRenderer={detailCellRenderer}
                    detailRowHeight={70}
                    groupDefaultExpanded={1}
                    onGridReady={onGridReady}
                    onFirstDataRendered={onFirstDataRendered}
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
