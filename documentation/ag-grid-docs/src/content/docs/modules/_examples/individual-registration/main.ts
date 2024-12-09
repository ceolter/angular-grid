import type { ColDef, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    CsvExportModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import {
    ClipboardModule,
    ColumnMenuModule,
    ContextMenuModule,
    ExcelExportModule,
    SetFilterModule,
} from 'ag-grid-enterprise';

// Register shared Modules globally
ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [{ field: 'id' }, { field: 'color' }, { field: 'value1' }];
const defaultColDef = {
    flex: 1,
    minWidth: 100,
    filter: true,
    floatingFilter: true,
};

let rowIdSequence = 100;
function createRowBlock() {
    return ['Red', 'Green', 'Blue'].map((color) => ({
        id: rowIdSequence++,
        color: color,
        value1: Math.floor(Math.random() * 100),
    }));
}

const baseGridOptions: GridOptions = {
    defaultColDef: defaultColDef,
    columnDefs: columnDefs,
};

const leftGridOptions: GridOptions = {
    ...baseGridOptions,
    rowData: createRowBlock(),
};

const rightGridOptions: GridOptions = {
    ...baseGridOptions,
    rowData: createRowBlock(),
};

function loadGrid(side: string) {
    const grid = document.querySelector<HTMLElement>('#e' + side + 'Grid')!;
    const modules =
        side === 'Left'
            ? [SetFilterModule, ClipboardModule, CsvExportModule]
            : [TextFilterModule, NumberFilterModule, CsvExportModule, ExcelExportModule];
    createGrid(grid, side === 'Left' ? leftGridOptions : rightGridOptions, { modules: modules });
}

loadGrid('Left');
loadGrid('Right');
