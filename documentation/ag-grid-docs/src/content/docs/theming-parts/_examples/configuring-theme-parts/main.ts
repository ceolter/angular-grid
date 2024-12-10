import type { ColDef, GridOptions, Part, Theme } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    NumberFilterModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
    colorSchemeDark,
    colorSchemeDarkBlue,
    colorSchemeDarkWarm,
    colorSchemeLight,
    colorSchemeLightCold,
    colorSchemeLightWarm,
    createGrid,
    iconSetAlpine,
    iconSetMaterial,
    iconSetQuartzBold,
    iconSetQuartzLight,
    iconSetQuartzRegular,
    themeAlpine,
    themeBalham,
    themeQuartz,
} from 'ag-grid-community';
import {
    ColumnMenuModule,
    ColumnsToolPanelModule,
    ContextMenuModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    PivotModule,
    SideBarModule,
} from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    TextEditorModule,
    TextFilterModule,
    NumberFilterModule,
    NumberEditorModule,
    SideBarModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    ExcelExportModule,
    ColumnMenuModule,
    ContextMenuModule,
    PivotModule,
    ValidationModule /* Development Only */,
]);

const baseThemes: Record<string, Theme> = {
    quartz: themeQuartz,
    balham: themeBalham,
    alpine: themeAlpine,
};
let baseTheme = themeQuartz;

const colorSchemes: Record<string, Part> = {
    light: colorSchemeLight,
    lightCold: colorSchemeLightCold,
    lightWarm: colorSchemeLightWarm,
    dark: colorSchemeDark,
    darkWarm: colorSchemeDarkWarm,
    darkBlue: colorSchemeDarkBlue,
};
let colorScheme: Part | null = null;

const iconSets: Record<string, Part> = {
    quartzLight: iconSetQuartzLight,
    quartzRegular: iconSetQuartzRegular,
    quartzBold: iconSetQuartzBold,
    alpine: iconSetAlpine,
    material: iconSetMaterial,
};
let iconSet: Part | null = null;

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
    theme: buildTheme(),
    columnDefs,
    rowData,
    defaultColDef,
    sideBar: true,
};

const gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);

function setBaseTheme(id: string) {
    baseTheme = baseThemes[id];
    gridApi.setGridOption('theme', buildTheme());
}

function setIconSet(id: string) {
    iconSet = iconSets[id] || null;
    gridApi.setGridOption('theme', buildTheme());
}

function setColorScheme(id: string) {
    colorScheme = colorSchemes[id] || null;
    gridApi.setGridOption('theme', buildTheme());
}

function buildTheme() {
    let theme = baseTheme;
    if (iconSet) {
        theme = theme.withPart(iconSet);
    }
    if (colorScheme) {
        theme = theme.withPart(colorScheme);
    }
    return theme;
}
