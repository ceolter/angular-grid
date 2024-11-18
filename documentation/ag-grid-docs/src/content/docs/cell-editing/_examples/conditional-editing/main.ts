import { ClientSideRowModelModule } from 'ag-grid-community';
import type { CellClassParams, EditableCallbackParams, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

let editableYear = 2012;

function isCellEditable(params: EditableCallbackParams | CellClassParams) {
    return params.data.year === editableYear;
}

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete', type: 'editableColumn' },
        { field: 'age', type: 'editableColumn' },
        { field: 'year' },
        { field: 'country' },
        { field: 'sport' },
        { field: 'total' },
    ],
    columnTypes: {
        editableColumn: {
            editable: (params: EditableCallbackParams<IOlympicData>) => {
                return isCellEditable(params);
            },
            cellStyle: (params: CellClassParams<IOlympicData>) => {
                if (isCellEditable(params)) {
                    return { backgroundColor: '#2244CC44' };
                }
            },
        },
    },
};

function setEditableYear(year: number) {
    editableYear = year;
    // Redraw to re-apply the new cell style
    gridApi!.redrawRows();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
