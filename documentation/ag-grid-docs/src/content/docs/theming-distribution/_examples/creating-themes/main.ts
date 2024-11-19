import type { ColDef, GridOptions } from 'ag-grid-community';
import {
    AllCommunityModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    colorSchemeVariable,
    createGrid,
    createTheme,
    iconSetMaterial,
} from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const myCustomTheme = createTheme()
    // add just the parts you want
    .withPart(iconSetMaterial)
    .withPart(colorSchemeVariable)
    // set default param values
    .withParams({
        accentColor: 'red',
        foregroundColor: '#660000',
        iconSize: 18,
    });

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

const gridOptions: GridOptions<IOlympicData> = {
    theme: myCustomTheme,
    columnDefs,
    rowData,
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    rowSelection: { mode: 'multiRow', checkboxes: true },
};

createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);
