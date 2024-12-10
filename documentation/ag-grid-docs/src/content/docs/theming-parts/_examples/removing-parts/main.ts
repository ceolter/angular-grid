import type { ColDef, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    GridStateModule,
    ModuleRegistry,
    NumberEditorModule,
    NumberFilterModule,
    RowSelectionModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
    themeQuartz,
} from 'ag-grid-community';

import './style.css';

ModuleRegistry.registerModules([
    TextEditorModule,
    TextFilterModule,
    NumberFilterModule,
    NumberEditorModule,
    RowSelectionModule,
    GridStateModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const myCustomTheme = themeQuartz.withoutPart('checkboxStyle');

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
    initialState: {
        rowSelection: ['1', '2', '3'],
    },
    rowSelection: { mode: 'multiRow', checkboxes: true },
};

createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);
