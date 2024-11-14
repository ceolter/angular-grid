import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { CustomDateComponent } from './customDateComponent_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const filterParams = {
    comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
        const dateAsString = cellValue;
        const dateParts = dateAsString.split('/');
        const cellDate = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]));

        if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
            return 0;
        }

        if (cellDate < filterLocalDateAtMidnight) {
            return -1;
        }

        if (cellDate > filterLocalDateAtMidnight) {
            return 1;
        }
    },
};

const columnDefs: ColDef[] = [
    { field: 'athlete' },
    { field: 'country' },
    {
        field: 'date',
        minWidth: 190,
        filter: 'agDateColumnFilter',
        filterParams: filterParams,
    },
    { field: 'sport' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
        floatingFilter: true,
    },
    columnDefs: columnDefs,
    rowData: null,
    components: {
        agDateInput: CustomDateComponent,
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data) => {
            gridApi!.setGridOption('rowData', data);
        });
});
