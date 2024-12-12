import type { ColDef, GridOptions } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry, createGrid, themeQuartz } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule]);

const myTheme = themeQuartz
    .withParams(
        {
            backgroundColor: '#FFE8E0',
            foregroundColor: '#361008CC',
            browserColorScheme: 'light',
        },
        'light-red'
    )
    .withParams(
        {
            backgroundColor: '#201008',
            foregroundColor: '#FFFFFFCC',
            browserColorScheme: 'dark',
        },
        'dark-red'
    );

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
    flex: 1,
    minWidth: 100,
    filter: true,
    enableValue: true,
    enableRowGroup: true,
    enablePivot: true,
};

const gridOptions: GridOptions<IOlympicData> = {
    theme: myTheme,
    columnDefs,
    rowData,
    defaultColDef,
    sideBar: true,
};

const gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);

function setDarkMode(enabled: boolean) {
    document.body.dataset.agThemeMode = enabled ? 'dark-red' : 'light-red';
}
setDarkMode(false);
