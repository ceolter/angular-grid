import React, { StrictMode, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridPreDestroyedEvent, GridReadyEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import type { TAthlete } from './data';
import { getData } from './data';
import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

interface ColumnWidth {
    field: string;
    width: number;
}

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const [gridVisible, setGridVisible] = useState(true);
    const [columnsWidthOnPreDestroyed, setColumnsWidthOnPreDestroyed] = useState<ColumnWidth[]>([]);
    const [gridApi, setGridApi] = useState<GridApi>();
    const [rowData, setRowData] = useState<any[]>(getData());
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([
        { field: 'name', headerName: 'Athlete' },
        { field: 'medals.gold', headerName: 'Gold Medals' },
        { field: 'person.age', headerName: 'Age' },
    ]);
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            editable: true,
        };
    }, []);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        setGridApi(params.api);
    }, []);

    const onGridPreDestroyed = useCallback(
        (params: GridPreDestroyedEvent<TAthlete>) => {
            const allColumns = gridApi?.getColumns();
            if (!allColumns) {
                return;
            }

            const currentColumnWidths = allColumns.map((column) => ({
                field: column.getColDef().field || '-',
                width: column.getActualWidth(),
            }));

            setColumnsWidthOnPreDestroyed(currentColumnWidths);
            setGridApi(undefined);
        },
        [gridApi]
    );

    const updateColumnWidth = useCallback(() => {
        if (!gridApi) {
            return;
        }

        const newWidths = gridApi.getColumns()!.map((column) => {
            return { key: column.getColId(), newWidth: Math.round((150 + Math.random() * 100) * 100) / 100 };
        });
        gridApi.setColumnWidths(newWidths);
    }, [gridApi]);

    const destroyGrid = useCallback(() => {
        setGridVisible(false);
    }, []);

    const reloadGrid = useCallback(() => {
        const updatedColumnDefs = columnDefs.map((val) => {
            const colDef = val;
            const result = {
                ...colDef,
            };

            if (colDef.field) {
                const width = columnsWidthOnPreDestroyed.find((columnWidth) => columnWidth.field === colDef.field);
                result.width = width ? width.width : colDef.width;
            }

            return result;
        });

        setColumnsWidthOnPreDestroyed([]);
        setColumnDefs(updatedColumnDefs);
        setGridVisible(true);
    }, [columnsWidthOnPreDestroyed, columnDefs]);

    return (
        <div style={containerStyle}>
            <div className="test-container">
                <div className="test-header">
                    {gridVisible && (
                        <div id="exampleButtons" style={{ marginBottom: '1rem' }}>
                            <button onClick={() => updateColumnWidth()}>Change Columns Width</button>
                            <button onClick={() => destroyGrid()}>Destroy Grid</button>
                        </div>
                    )}
                    {Array.isArray(columnsWidthOnPreDestroyed) && columnsWidthOnPreDestroyed.length > 0 && (
                        <div id="gridPreDestroyedState">
                            State captured on grid pre-destroyed event:
                            <br />
                            <strong>Column fields and widths</strong>
                            <div className="values">
                                <ul>
                                    {columnsWidthOnPreDestroyed.map((columnWidth, index) => (
                                        <li key={index}>
                                            {columnWidth.field} : {columnWidth.width}px
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <button onClick={() => reloadGrid()}>Reload Grid</button>
                        </div>
                    )}
                </div>
                <div style={{ height: '100%', boxSizing: 'border-box' }}>
                    <div
                        style={{
                            height: '100%',
                            width: '100%',
                        }}
                    >
                        {gridVisible && (
                            <AgGridReact
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                rowData={rowData}
                                onGridReady={onGridReady}
                                onGridPreDestroyed={onGridPreDestroyed}
                            />
                        )}
                    </div>
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
