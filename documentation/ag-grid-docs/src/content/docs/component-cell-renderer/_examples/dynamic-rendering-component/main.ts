import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    CellEditingStartedEvent,
    CellEditingStoppedEvent,
    GridApi,
    GridOptions,
    ICellRendererParams,
    RowEditingStartedEvent,
    RowEditingStoppedEvent,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { GenderRenderer } from './genderRenderer_typescript';
import { MoodRenderer } from './moodRenderer_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

interface IRow {
    value: number | string;
    type: 'age' | 'gender' | 'mood';
}

const rowData: IRow[] = [
    { value: 14, type: 'age' },
    { value: 'Female', type: 'gender' },
    { value: 'Happy', type: 'mood' },
    { value: 21, type: 'age' },
    { value: 'Male', type: 'gender' },
    { value: 'Sad', type: 'mood' },
];

let gridApi: GridApi<IRow>;

const gridOptions: GridOptions<IRow> = {
    columnDefs: [
        { field: 'value' },
        {
            headerName: 'Rendered Value',
            field: 'value',
            cellRendererSelector: (params: ICellRendererParams<IRow>) => {
                const moodDetails = {
                    component: MoodRenderer,
                };

                const genderDetails = {
                    component: GenderRenderer,
                    params: { values: ['Male', 'Female'] },
                };
                if (params.data) {
                    if (params.data.type === 'gender') return genderDetails;
                    else if (params.data.type === 'mood') return moodDetails;
                }
                return undefined;
            },
        },
        { field: 'type' },
    ],
    defaultColDef: {
        flex: 1,
        cellDataType: false,
    },
    rowData: rowData,
    onRowEditingStarted: (event: RowEditingStartedEvent<IRow>) => {
        console.log('never called - not doing row editing');
    },
    onRowEditingStopped: (event: RowEditingStoppedEvent<IRow>) => {
        console.log('never called - not doing row editing');
    },
    onCellEditingStarted: (event: CellEditingStartedEvent<IRow>) => {
        console.log('cellEditingStarted');
    },
    onCellEditingStopped: (event: CellEditingStoppedEvent<IRow>) => {
        console.log('cellEditingStopped');
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
