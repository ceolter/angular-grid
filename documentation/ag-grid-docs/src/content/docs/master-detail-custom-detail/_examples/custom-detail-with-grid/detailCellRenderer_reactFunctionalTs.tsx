import React, { useEffect } from 'react';

import type { ColDef, DetailGridInfo, GridReadyEvent } from 'ag-grid-community';
import type { CustomCellRendererProps } from 'ag-grid-react';
import { AgGridReact } from 'ag-grid-react';

const DetailCellRenderer = ({ data, node, api }: CustomCellRendererProps) => {
    const rowId = node.id!;

    useEffect(() => {
        return () => {
            if (!api.isDestroyed()) {
                console.log('removing detail grid info with id: ', rowId);
                api.removeDetailGridInfo(rowId);
            }
        };
    }, []);

    const colDefs = [
        { field: 'callId' },
        { field: 'direction' },
        { field: 'number' },
        { field: 'duration', valueFormatter: "x.toLocaleString() + 's'" },
        { field: 'switchCode' },
    ];

    const defaultColDef: ColDef = {
        flex: 1,
        minWidth: 120,
    };

    const onGridReady = (params: GridReadyEvent) => {
        const gridInfo: DetailGridInfo = {
            id: rowId,
            api: params.api,
        };

        console.log('adding detail grid info with id: ', rowId);

        api.addDetailGridInfo(rowId, gridInfo);
    };

    return (
        <div className="full-width-panel">
            <div className="full-width-details">
                <div className="full-width-detail">
                    <b>Name: </b>
                    {data.name}
                </div>
                <div className="full-width-detail">
                    <b>Account: </b>
                    {data.account}
                </div>
            </div>
            <AgGridReact
                className="full-width-grid"
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                rowData={data.callRecords}
                onGridReady={onGridReady}
            />
        </div>
    );
};

export default DetailCellRenderer;
