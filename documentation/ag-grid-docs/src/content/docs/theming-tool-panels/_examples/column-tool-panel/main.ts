import type { GridApi, GridOptions } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry, createGrid, themeQuartz } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule]);

let gridApi: GridApi<IOlympicData>;

const myTheme = themeQuartz.withParams({
    columnSelectIndentSize: 40,
    columnDropCellBackgroundColor: 'purple',
    columnDropCellTextColor: 'white',
    columnDropCellDragHandleColor: 'white',
    columnDropCellBorder: { color: 'yellow', style: 'dashed', width: 2 },
});

const gridOptions: GridOptions<IOlympicData> = {
    theme: myTheme,
    rowData: null,
    columnDefs: [
        {
            headerName: 'Athlete',
            children: [
                { field: 'athlete', minWidth: 170, rowGroup: true },
                { field: 'age', rowGroup: true },
                { field: 'country' },
            ],
        },
        {
            headerName: 'Event',
            children: [{ field: 'year' }, { field: 'date' }, { field: 'sport' }],
        },
        {
            headerName: 'Medals',
            children: [{ field: 'gold' }, { field: 'silver' }, { field: 'bronze' }, { field: 'total' }],
        },
    ],
    defaultColDef: {
        editable: true,
        filter: true,
    },
    sideBar: 'columns',
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
