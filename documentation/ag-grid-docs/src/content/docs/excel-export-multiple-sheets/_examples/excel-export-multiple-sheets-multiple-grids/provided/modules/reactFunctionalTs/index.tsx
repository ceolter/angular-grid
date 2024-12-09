import React, { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import type {
    ColDef,
    GetRowIdParams,
    GridApi,
    GridReadyEvent,
    RowDragEndEvent,
    RowSelectionOptions,
} from 'ag-grid-community';
import {
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    CsvExportModule,
    ModuleRegistry,
    RowDragModule,
    RowSelectionModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import { ExcelExportModule, exportMultipleSheetsAsExcel } from 'ag-grid-enterprise';
import type { CustomCellRendererProps } from 'ag-grid-react';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([
    ClientSideRowModelApiModule,
    TextFilterModule,
    RowDragModule,
    RowSelectionModule,
    ClientSideRowModelModule,
    CsvExportModule,
    ExcelExportModule,
    ValidationModule /* Development Only */,
]);

const SportRenderer = (props: CustomCellRendererProps) => {
    return (
        <i
            className="far fa-trash-alt"
            style={{ cursor: 'pointer' }}
            onClick={() => props.api.applyTransaction({ remove: [props.node.data] })}
        ></i>
    );
};

const leftColumns: ColDef[] = [
    {
        rowDrag: true,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        rowDragText: (params, dragItemCount) => {
            if (dragItemCount > 1) {
                return dragItemCount + ' athletes';
            }
            return params.rowNode!.data.athlete;
        },
    },
    { field: 'athlete' },
    { field: 'sport' },
];

const rightColumns: ColDef[] = [
    {
        rowDrag: true,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        rowDragText: (params, dragItemCount) => {
            if (dragItemCount > 1) {
                return dragItemCount + ' athletes';
            }
            return params.rowNode!.data.athlete;
        },
    },
    { field: 'athlete' },
    { field: 'sport' },
    {
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        maxWidth: 50,
        cellRenderer: SportRenderer,
    },
];

const defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    filter: true,
};

const rowSelection: RowSelectionOptions = {
    mode: 'multiRow',
};

const GridExample = () => {
    const [leftApi, setLeftApi] = useState<GridApi | null>(null);
    const [rightApi, setRightApi] = useState<GridApi | null>(null);
    const [rawData, setRawData] = useState<any[]>([]);
    const [leftRowData, setLeftRowData] = useState<any[] | null>(null);
    const [rightRowData, setRightRowData] = useState<any[]>([]);

    useEffect(() => {
        if (!rawData.length) {
            fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
                .then((resp) => resp.json())
                .then((data) => {
                    const athletes: any[] = [];
                    let i = 0;

                    while (athletes.length < 20 && i < data.length) {
                        var pos = i++;
                        if (athletes.some((rec) => rec.athlete === data[pos].athlete)) {
                            continue;
                        }
                        athletes.push(data[pos]);
                    }
                    setRawData(athletes);
                });
        }
    }, [rawData]);

    const loadGrids = useCallback(() => {
        setLeftRowData([...rawData.slice(0, rawData.length / 2)]);
        setRightRowData([...rawData.slice(rawData.length / 2)]);
        leftApi!.deselectAll();
    }, [leftApi, rawData]);

    useEffect(() => {
        if (rawData.length) {
            loadGrids();
        }
    }, [rawData, loadGrids]);

    const reset = () => {
        loadGrids();
    };

    const onExcelExport = () => {
        const spreadsheets: any[] = [];

        spreadsheets.push(
            leftApi!.getSheetDataForExcel({ sheetName: 'Athletes' }),
            rightApi!.getSheetDataForExcel({ sheetName: 'Selected Athletes' })
        );

        exportMultipleSheetsAsExcel({
            data: spreadsheets,
            fileName: 'ag-grid.xlsx',
        });
    };

    const getRowId = (params: GetRowIdParams) => params.data.athlete;

    const onDragStop = useCallback(
        (params: RowDragEndEvent) => {
            const nodes = params.nodes;

            leftApi!.applyTransaction({
                remove: nodes.map(function (node) {
                    return node.data;
                }),
            });
        },
        [leftApi]
    );

    useEffect(() => {
        if (!leftApi || !rightApi) {
            return;
        }
        const dropZoneParams = rightApi.getRowDropZoneParams({ onDragStop });

        leftApi.removeRowDropZone(dropZoneParams);
        leftApi.addRowDropZone(dropZoneParams);
    }, [leftApi, rightApi, onDragStop]);

    const onGridReady = (params: GridReadyEvent, side: number) => {
        if (side === 0) {
            setLeftApi(params.api);
        }

        if (side === 1) {
            setRightApi(params.api);
        }
    };

    const getTopToolBar = () => (
        <div>
            <button type="button" className="btn btn-default excel" style={{ marginRight: 5 }} onClick={onExcelExport}>
                <i className="far fa-file-excel" style={{ marginRight: 5, color: 'green' }}></i>Export to Excel
            </button>
            <button type="button" className="btn btn-default reset" onClick={reset}>
                <i className="fas fa-redo" style={{ marginRight: 5 }}></i>Reset
            </button>
        </div>
    );

    const getGridWrapper = (id: number) => (
        <div className="panel panel-primary" style={{ marginRight: '10px' }}>
            <div className="panel-heading">{id === 0 ? 'Athletes' : 'Selected Athletes'}</div>
            <div className="panel-body" style={{ height: '100%' }}>
                <AgGridReact
                    defaultColDef={defaultColDef}
                    getRowId={getRowId}
                    rowDragManaged={true}
                    rowSelection={id === 0 ? rowSelection : undefined}
                    rowDragMultiRow={id === 0}
                    suppressMoveWhenRowDragging={id === 0}
                    rowData={id === 0 ? leftRowData : rightRowData}
                    columnDefs={id === 0 ? leftColumns : rightColumns}
                    onGridReady={(params) => onGridReady(params, id)}
                />
            </div>
        </div>
    );

    return (
        <div className="top-container">
            {getTopToolBar()}
            <div className="grid-wrapper">
                {getGridWrapper(0)}
                {getGridWrapper(1)}
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
