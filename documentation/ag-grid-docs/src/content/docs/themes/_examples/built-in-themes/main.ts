import type { ColDef, GridOptions } from 'ag-grid-community';
import {
    AllCommunityModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    createGrid,
    themeAlpine,
    themeBalham,
    themeQuartz,
} from 'ag-grid-community';
import { ColumnsToolPanelModule, FiltersToolPanelModule, SideBarModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    SideBarModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
]);

const baseThemes = [themeQuartz, themeBalham, themeAlpine];
const theme = baseThemes[0];

const columnDefs: ColDef[] = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];

const rowData: any[] = (() => {
    const rowData: any[] = [];
    for (let i = 0; i < 10; i++) {
        rowData.push({ make: 'Toyota', model: 'Celica', price: 35000 + i * 1000 });
        rowData.push({ make: 'Ford', model: 'Mondeo', price: 32000 + i * 1000 });
        rowData.push({ make: 'Porsche', model: 'Boxster', price: 72000 + i * 1000 });
    }
    return rowData;
})();

const defaultColDef = {
    editable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
};

const gridOptions: GridOptions<IOlympicData> = {
    theme: theme,
    columnDefs,
    rowData,
    defaultColDef,
    sideBar: true,
};

const gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);

function setBaseTheme(id: string) {
    const theme = baseThemes.find((theme) => theme.id === id)!;
    gridApi.setGridOption('theme', theme);
}
