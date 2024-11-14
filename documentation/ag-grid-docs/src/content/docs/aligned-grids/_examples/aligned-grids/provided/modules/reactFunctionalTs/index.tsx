import React, { StrictMode, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, ColGroupDef, GridReadyEvent, SizeColumnsToFitGridStrategy } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const GridExample = () => {
    const topGrid = useRef<AgGridReact>(null);
    const bottomGrid = useRef<AgGridReact>(null);

    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(
        () => [
            { field: 'athlete' },
            { field: 'age' },
            { field: 'country' },
            { field: 'year' },
            { field: 'sport' },
            {
                headerName: 'Medals',
                children: [
                    {
                        columnGroupShow: 'closed',
                        colId: 'total',
                        valueGetter: 'data.gold + data.silver + data.bronze',
                        width: 200,
                    },
                    { columnGroupShow: 'open', field: 'gold', width: 100 },
                    { columnGroupShow: 'open', field: 'silver', width: 100 },
                    { columnGroupShow: 'open', field: 'bronze', width: 100 },
                ],
            },
        ],
        []
    );

    const defaultColDef = useMemo<ColDef>(
        () => ({
            filter: true,
            minWidth: 100,
        }),
        []
    );

    const [rowData, setRowData] = useState([]);

    const autoSizeStrategy = useMemo<SizeColumnsToFitGridStrategy>(
        () => ({
            type: 'fitGridWidth',
        }),
        []
    );

    const onGridReady = (params: GridReadyEvent) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => setRowData(data));
    };

    const onCbAthlete = (event: any) => {
        // we only need to update one grid, as the other is a slave
        topGrid.current!.api.setColumnsVisible(['athlete'], event.target.checked);
    };

    const onCbAge = (event: any) => {
        // we only need to update one grid, as the other is a slave
        topGrid.current!.api.setColumnsVisible(['age'], event.target.checked);
    };

    const onCbCountry = (event: any) => {
        // we only need to update one grid, as the other is a slave
        topGrid.current!.api.setColumnsVisible(['country'], event.target.checked);
    };

    return (
        <div className="container">
            <div className="header">
                <label>
                    <input type="checkbox" defaultChecked={true} onChange={(event) => onCbAthlete(event)} />
                    Athlete
                </label>
                <label>
                    <input type="checkbox" defaultChecked={true} onChange={(event) => onCbAge(event)} />
                    Age
                </label>
                <label>
                    <input type="checkbox" defaultChecked={true} onChange={(event) => onCbCountry(event)} />
                    Country
                </label>
            </div>

            <div className="grid">
                <AgGridReact
                    ref={topGrid}
                    alignedGrids={[bottomGrid]}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    autoSizeStrategy={autoSizeStrategy}
                    onGridReady={onGridReady}
                />
            </div>

            <div className="divider"></div>

            <div className="grid">
                <AgGridReact
                    ref={bottomGrid}
                    alignedGrids={[topGrid]}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
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
