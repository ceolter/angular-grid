import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions, RowClassParams, RowStyle } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { CustomPinnedRowRenderer } from './customPinnedRowRenderer_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: ColDef[] = [
    {
        field: 'athlete',
        cellRendererSelector: (params) => {
            if (params.node.rowPinned) {
                return {
                    component: CustomPinnedRowRenderer,
                    params: {
                        style: { color: '#5577CC' },
                    },
                };
            } else {
                // rows that are not pinned don't use any cell renderer
                return undefined;
            }
        },
    },
    {
        field: 'country',
        cellRendererSelector: (params) => {
            if (params.node.rowPinned) {
                return {
                    component: CustomPinnedRowRenderer,
                    params: {
                        style: { fontStyle: 'italic' },
                    },
                };
            } else {
                // rows that are not pinned don't use any cell renderer
                return undefined;
            }
        },
    },
    { field: 'sport' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        flex: 1,
    },
    columnDefs: columnDefs,
    rowData: null,
    getRowStyle: (params: RowClassParams): RowStyle | undefined => {
        if (params.node.rowPinned) {
            return { fontWeight: 'bold' };
        }
    },
    // no rows to pin to start with
    pinnedTopRowData: [
        { athlete: 'TOP 1 (athlete)', country: 'TOP 1 (country)', sport: 'TOP 1 (sport)' },
        { athlete: 'TOP 2 (athlete)', country: 'TOP 2 (country)', sport: 'TOP 2 (sport)' },
    ],
    pinnedBottomRowData: [
        { athlete: 'BOTTOM 1 (athlete)', country: 'BOTTOM 1 (country)', sport: 'BOTTOM 1 (sport)' },
        { athlete: 'BOTTOM 2 (athlete)', country: 'BOTTOM 2 (country)', sport: 'BOTTOM 2 (sport)' },
    ],
};

function createData(count: number, prefix: string): any[] {
    const result: any[] = [];
    for (let i = 0; i < count; i++) {
        result.push({
            athlete: prefix + ' Athlete ' + i,
            age: prefix + ' Age ' + i,
            country: prefix + ' Country ' + i,
            year: prefix + ' Year ' + i,
            date: prefix + ' Date ' + i,
            sport: prefix + ' Sport ' + i,
        });
    }
    return result;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
