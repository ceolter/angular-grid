import React, { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

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
    colorSchemeVariable,
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
import { AgGridReact } from 'ag-grid-react';

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

const baseThemes = [
    { id: 'themeQuartz', value: themeQuartz },
    { id: 'themeBalham', value: themeBalham },
    { id: 'themeAlpine', value: themeAlpine },
];

const colorSchemes = [
    { id: '(unchanged)', value: null },
    { id: 'colorSchemeLight', value: colorSchemeLight },
    { id: 'colorSchemeLightCold', value: colorSchemeLightCold },
    { id: 'colorSchemeLightWarm', value: colorSchemeLightWarm },
    { id: 'colorSchemeDark', value: colorSchemeDark },
    { id: 'colorSchemeDarkWarm', value: colorSchemeDarkWarm },
    { id: 'colorSchemeDarkBlue', value: colorSchemeDarkBlue },
    { id: 'colorSchemeVariable', value: colorSchemeVariable },
];

const iconSets = [
    { id: '(unchanged)', value: null },
    { id: 'iconSetQuartzLight', value: iconSetQuartzLight },
    { id: 'iconSetQuartzRegular', value: iconSetQuartzRegular },
    { id: 'iconSetQuartzBold', value: iconSetQuartzBold },
    { id: 'iconSetAlpine', value: iconSetAlpine },
    { id: 'iconSetMaterial', value: iconSetMaterial },
];

const GridExample = () => {
    const [baseTheme, setBaseTheme] = useState(baseThemes[0]);
    const [colorScheme, setColorScheme] = useState(colorSchemes[0]);
    const [iconSet, setIconSet] = useState(iconSets[0]);

    const theme = useMemo(() => {
        let theme = baseTheme.value;
        if (colorScheme.value) {
            theme = theme.withPart(colorScheme.value);
        }
        if (iconSet.value) {
            theme = theme.withPart(iconSet.value);
        }
        return theme;
    }, [baseTheme, colorScheme, iconSet]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <p style={{ flex: 0 }}>
                Theme: <PartSelector options={baseThemes} value={baseTheme} setValue={setBaseTheme} />
                Icons: <PartSelector options={iconSets} value={iconSet} setValue={setIconSet} />
                Color scheme: <PartSelector options={colorSchemes} value={colorScheme} setValue={setColorScheme} />
            </p>
            <div style={{ flex: 1 }}>
                <AgGridReact
                    theme={theme}
                    columnDefs={columnDefs}
                    rowData={rowData}
                    defaultColDef={defaultColDef}
                    sideBar
                />
            </div>
        </div>
    );
};

const PartSelector = ({ options, value, setValue }) => (
    <select
        onChange={(e) => setValue(options.find((t) => t?.id === e.currentTarget.value) || null)}
        style={{ marginRight: 16 }}
        value={value?.id}
    >
        {options.map((option, i) => (
            <option key={i}>{option.id}</option>
        ))}
    </select>
);

const rowData = (() => {
    const rowData = [];
    for (let i = 0; i < 10; i++) {
        rowData.push({ make: 'Toyota', model: 'Celica', price: 35000 + i * 1000 });
        rowData.push({ make: 'Ford', model: 'Mondeo', price: 32000 + i * 1000 });
        rowData.push({ make: 'Porsche', model: 'Boxster', price: 72000 + i * 1000 });
    }
    return rowData;
})();

const columnDefs = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];

const defaultColDef = {
    editable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
};

const root = createRoot(document.getElementById('root'));
root.render(
    <StrictMode>
        <GridExample />
    </StrictMode>
);
