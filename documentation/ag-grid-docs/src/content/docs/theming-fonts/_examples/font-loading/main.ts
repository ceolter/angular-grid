import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    AllCommunityModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    createGrid,
    themeQuartz,
} from 'ag-grid-community';
import { ColumnsToolPanelModule, FiltersToolPanelModule, SideBarModule } from 'ag-grid-enterprise';

import './style.css';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    SideBarModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
]);

const columnDefs: ColDef[] = [
    { field: 'athlete', minWidth: 170 },
    { field: 'age' },
    { field: 'country' },
    { field: 'year' },
    { field: 'date' },
];

let gridApi: GridApi<IOlympicData>;

const myTheme = themeQuartz.withParams({
    // the grid will load these fonts for you if loadThemeGoogleFonts=true
    fontFamily: { googleFont: 'Delius' },
    headerFontFamily: { googleFont: 'Sixtyfour Convergence' },
    cellFontFamily: { googleFont: 'Turret Road' },
    // these fonts are awesome, so they should be large too
    fontSize: 20,
    headerFontSize: 25,
});

const gridOptions: GridOptions<IOlympicData> = {
    theme: myTheme,
    loadThemeGoogleFonts: true,
    rowData: null,
    columnDefs: columnDefs,
    defaultColDef: {
        editable: true,
        filter: true,
    },
    sideBar: true,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
