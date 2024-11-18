import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions, ISelectCellEditorParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { colors } from './colors';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: ColDef[] = [
    {
        headerName: 'Select Editor Without Max Height and Max Width',
        field: 'color',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: colors,
        } as ISelectCellEditorParams,
    },
    {
        headerName: 'Select Editor With Max Height and Max Width',
        field: 'color',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: colors,
            valueListMaxHeight: 200,
            valueListMaxWidth: 150,
        } as ISelectCellEditorParams,
    },
];

function getRandomNumber(min: number, max: number) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const data = Array.from(Array(20).keys()).map(() => {
    const color = colors[getRandomNumber(0, colors.length - 1)];
    return { color };
});

let gridApi: GridApi;

const gridOptions: GridOptions = {
    defaultColDef: {
        flex: 1,
        editable: true,
    },
    columnDefs: columnDefs,
    rowData: data,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
