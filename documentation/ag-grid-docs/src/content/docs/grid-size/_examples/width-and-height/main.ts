import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete', width: 150 },
        { field: 'age', width: 90 },
        { field: 'country', width: 150 },
        { field: 'year', width: 90 },
        { field: 'date', width: 150 },
        { field: 'sport', width: 150 },
        { field: 'gold', width: 100 },
        { field: 'silver', width: 100 },
        { field: 'bronze', width: 100 },
        { field: 'total', width: 100 },
    ],
};

function fillLarge() {
    setWidthAndHeight('100%');
}

function fillMedium() {
    setWidthAndHeight('60%');
}

function fillExact() {
    setWidthAndHeight('400px');
}

function setWidthAndHeight(size: string) {
    const eGridDiv = document.querySelector<HTMLElement>('#myGrid')! as any;
    eGridDiv.style.setProperty('width', size);
    eGridDiv.style.setProperty('height', size);
}

const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
gridApi = createGrid(gridDiv, gridOptions);

fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then((response) => response.json())
    .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
