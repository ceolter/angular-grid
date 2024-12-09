import React, { StrictMode, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { ColDef, ColGroupDef, ICellRendererParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    RowApiModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import type { CustomCellRendererProps } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([
    TextEditorModule,
    TextFilterModule,
    NumberEditorModule,
    RowApiModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

export interface ImageCellRendererParams extends CustomCellRendererProps {
    rendererImage: string;
    divisor?: number;
}

const createImageArr = (imageMultiplier: number, image: string) => {
    const arr = [];
    for (let i = 0; i < imageMultiplier; i++) {
        const imgSrc = 'https://www.ag-grid.com/example-assets/weather/' + image;
        arr.push(imgSrc);
    }
    return arr;
};

const DeltaRenderer = (params: ICellRendererParams) => {
    const imgSrc =
        params.value > 15
            ? 'https://www.ag-grid.com/example-assets/weather/fire-plus.png'
            : 'https://www.ag-grid.com/example-assets/weather/fire-minus.png';
    return (
        <span>
            <img src={imgSrc} />
            {params.value}
        </span>
    );
};

const IconRenderer = (params: ImageCellRendererParams) => {
    const value = params.value / (params.divisor ?? 1);
    const imgSrcArr = createImageArr(value, params.rendererImage);
    return (
        <span>
            {imgSrcArr.map((image, index) => (
                <img key={index} src={image} />
            ))}
        </span>
    );
};

const GridExample = () => {
    const [rowData, setRowData] = useState<any[]>();

    const columnDefs = useMemo<(ColDef<any, any> | ColGroupDef<any>)[]>(
        () => [
            {
                headerName: 'Month',
                field: 'Month',
                width: 75,
            },
            {
                headerName: 'Max Temp',
                field: 'Max temp (C)',
                width: 120,
                cellRenderer: DeltaRenderer,
            },
            {
                headerName: 'Min Temp',
                field: 'Min temp (C)',
                width: 120,
                cellRenderer: DeltaRenderer,
            },
            {
                headerName: 'Frost',
                field: 'Days of air frost (days)',
                width: 233,
                cellRenderer: IconRenderer,
                cellRendererParams: {
                    rendererImage: 'frost.png',
                },
            },
            {
                headerName: 'Sunshine',
                field: 'Sunshine (hours)',
                width: 190,
                cellRenderer: IconRenderer,
                cellRendererParams: {
                    rendererImage: 'sun.png',
                    divisor: 24,
                },
            },
            {
                headerName: 'Rainfall',
                field: 'Rainfall (mm)',
                width: 180,
                cellRenderer: IconRenderer,
                cellRendererParams: {
                    rendererImage: 'rain.png',
                    divisor: 10,
                },
            },
        ],
        []
    );

    const gridRef = useRef<AgGridReact>(null);

    const onGridReady = () => {
        fetch('https://www.ag-grid.com/example-assets/weather-se-england.json')
            .then((resp) => resp.json())
            .then((data) => setRowData(data));
    };

    const randomiseFrost = () => {
        // iterate over the "days of air frost" and make each a random number.
        gridRef.current!.api.forEachNode((rowNode) => {
            rowNode.setDataValue('Days of air frost (days)', Math.floor(Math.random() * 4) + 1);
        });
    };

    const defaultColDef = useMemo(
        () => ({
            editable: true,
            flex: 1,
            minWidth: 100,
            filter: true,
        }),
        []
    );

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div className="example-wrapper">
                <div style={{ marginBottom: '5px' }}>
                    <button onClick={randomiseFrost}>Randomise Frost</button>
                </div>

                <div
                    id="myGrid"
                    style={{
                        height: '100%',
                        width: '100%',
                    }}
                >
                    <AgGridReact
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
