import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColGroupDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

declare let window: any;

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RowGroupingModule]);

const columnDefs: ColGroupDef[] = [
    {
        headerName: 'Athlete',
        children: [
            { field: 'athlete' },
            { field: 'country', columnGroupShow: 'open' },
            { field: 'sport', columnGroupShow: 'open' },
            { field: 'year', columnGroupShow: 'open' },
            { field: 'date', columnGroupShow: 'open' },
        ],
    },
    {
        headerName: 'Medals',
        children: [
            { field: 'total', columnGroupShow: 'closed' },
            { field: 'gold', columnGroupShow: 'open' },
            { field: 'silver', columnGroupShow: 'open' },
            { field: 'bronze', columnGroupShow: 'open' },
        ],
    },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        width: 150,
    },
    columnDefs: columnDefs,
    rowData: null,
};

function saveState() {
    window.groupState = gridApi!.getColumnGroupState();
    console.log('group state saved', window.groupState);
    console.log('column state saved');
}

function restoreState() {
    if (!window.groupState) {
        console.log('no columns state to restore by, you must save state first');
        return;
    }
    gridApi!.setColumnGroupState(window.groupState);
    console.log('column state restored');
}

function resetState() {
    gridApi!.resetColumnGroupState();
    console.log('column state reset');
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
