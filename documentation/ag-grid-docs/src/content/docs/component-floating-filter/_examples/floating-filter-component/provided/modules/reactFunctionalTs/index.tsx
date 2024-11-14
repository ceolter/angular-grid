import React, { StrictMode, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridReadyEvent, INumberFilterParams } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import SliderFloatingFilter from './sliderFloatingFilter';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const filterParams: INumberFilterParams = {
    filterOptions: ['greaterThan'],
    maxNumConditions: 1,
};

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState<IOlympicData[]>();
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([
        { field: 'athlete', filter: false },
        {
            field: 'gold',
            filter: 'agNumberColumnFilter',
            filterParams: filterParams,
            floatingFilterComponent: SliderFloatingFilter,
            floatingFilterComponentParams: {
                maxValue: 7,
            },
            suppressFloatingFilterButton: true,
            suppressHeaderMenuButton: false,
        },
        {
            field: 'silver',
            filter: 'agNumberColumnFilter',
            filterParams: filterParams,
            floatingFilterComponent: SliderFloatingFilter,
            floatingFilterComponentParams: {
                maxValue: 5,
            },
            suppressFloatingFilterButton: true,
            suppressHeaderMenuButton: false,
        },
        {
            field: 'bronze',
            filter: 'agNumberColumnFilter',
            filterParams: filterParams,
            floatingFilterComponent: SliderFloatingFilter,
            floatingFilterComponentParams: {
                maxValue: 10,
            },
            suppressFloatingFilterButton: true,
            suppressHeaderMenuButton: false,
        },
    ]);
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            flex: 1,
            minWidth: 100,
            filter: true,
            floatingFilter: true,
        };
    }, []);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data: IOlympicData[]) => {
                setRowData(data);
            });
    }, []);

    return (
        <div style={containerStyle}>
            <div style={{ height: '100%', boxSizing: 'border-box' }}>
                <div style={gridStyle}>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        alwaysShowVerticalScroll
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
