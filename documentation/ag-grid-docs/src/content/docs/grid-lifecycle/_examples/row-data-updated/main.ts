import type { FirstDataRenderedEvent, GridApi, GridOptions, RowDataUpdatedEvent } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';

import type { TAthlete } from './data';
import { fetchDataAsync } from './data';

ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule /* Development Only */]);

const updateRowCount = (id: string) => {
    const element = document.querySelector(`#${id} > .value`);
    element!.textContent = `${new Date().toLocaleTimeString()}`;
};

const setBtnReloadDataDisabled = (disabled: boolean) => {
    (document.getElementById('btnReloadData') as HTMLButtonElement).disabled = disabled;
};

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'name', headerName: 'Athlete' },
        { field: 'person.age', headerName: 'Age' },
        { field: 'medals.gold', headerName: 'Gold Medals' },
    ],
    loading: true,
    onFirstDataRendered: (event: FirstDataRenderedEvent) => {
        updateRowCount('firstDataRendered');
        console.log('First Data Rendered');
    },
    onRowDataUpdated: (event: RowDataUpdatedEvent<TAthlete>) => {
        updateRowCount('rowDataUpdated');
        console.log('Row Data Updated');
    },
    onGridReady: () => {
        console.log('Loading Data ...');
        fetchDataAsync()
            .then((data) => {
                console.log('Data Loaded');
                gridApi!.setGridOption('rowData', data);
            })
            .catch((error) => {
                console.error('Failed to load data', error);
            })
            .finally(() => {
                gridApi!.setGridOption('loading', false);
                setBtnReloadDataDisabled(false);
            });
    },
};

function onBtnReloadData() {
    console.log('Reloading Data ...');
    setBtnReloadDataDisabled(true);
    gridApi!.setGridOption('loading', true);
    fetchDataAsync()
        .then((data) => {
            console.log('Data Reloaded');
            gridApi!.setGridOption('rowData', data);
        })
        .catch((error) => {
            console.error('Failed to reload data', error);
        })
        .finally(() => {
            gridApi!.setGridOption('loading', false);
            setBtnReloadDataDisabled(false);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
