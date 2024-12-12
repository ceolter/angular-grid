import type { ColDef, GridOptions, Part } from 'ag-grid-community';
import {
    AllCommunityModule,
    ModuleRegistry,
    colorSchemeDarkBlue,
    colorSchemeDarkWarm,
    colorSchemeLightCold,
    colorSchemeLightWarm,
    createGrid,
    themeQuartz,
} from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

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

const createThemedGrid = (colorScheme: Part, selector: string) => {
    const gridOptions: GridOptions<IOlympicData> = {
        theme: themeQuartz.withPart(colorScheme),
        columnDefs,
        rowData,
        defaultColDef,
    };
    createGrid(document.querySelector<HTMLElement>(selector)!, gridOptions);
};

createThemedGrid(colorSchemeLightWarm, '#grid1');
createThemedGrid(colorSchemeLightCold, '#grid2');
createThemedGrid(colorSchemeDarkWarm, '#grid3');
createThemedGrid(colorSchemeDarkBlue, '#grid4');
