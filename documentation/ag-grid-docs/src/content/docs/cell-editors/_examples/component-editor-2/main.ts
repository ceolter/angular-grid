import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RichSelectModule } from 'ag-grid-enterprise';

import { getData } from './data';
import { GenderRenderer } from './genderRenderer_typescript';
import { MoodEditor } from './moodEditor_typescript';
import { MoodRenderer } from './moodRenderer_typescript';
import { SimpleTextEditor } from './simpleTextEditor_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RichSelectModule]);

const columnDefs: ColDef[] = [
    { field: 'first_name', headerName: 'Provided Text' },
    {
        field: 'last_name',
        headerName: 'Custom Text',
        cellEditor: SimpleTextEditor,
    },
    {
        field: 'age',
        headerName: 'Provided Number',
        cellEditor: 'agNumberCellEditor',
    },
    {
        field: 'gender',
        headerName: 'Provided Rich Select',
        cellRenderer: GenderRenderer,
        cellEditor: 'agRichSelectCellEditor',
        cellEditorParams: {
            cellRenderer: GenderRenderer,
            values: ['Male', 'Female'],
        },
    },
    {
        field: 'mood',
        headerName: 'Custom Mood',
        cellRenderer: MoodRenderer,
        cellEditor: MoodEditor,
        cellEditorPopup: true,
    },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: columnDefs,
    rowData: getData(),
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
