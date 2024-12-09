import { computed, createApp, defineComponent, ref } from 'vue';

import type { ColDef } from 'ag-grid-community';
import {
    ModuleRegistry,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
    colorSchemeDark,
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
    SideBarModule,
} from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';

ModuleRegistry.registerModules([
    TextEditorModule,
    TextFilterModule,
    SideBarModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    ExcelExportModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

const baseThemes = [
    { id: 'themeQuartz', theme: themeQuartz },
    { id: 'themeBalham', theme: themeBalham },
    { id: 'themeAlpine', theme: themeAlpine },
];

const colorSchemes = [
    { id: '(unchanged)', part: null },
    { id: 'colorSchemeLight', part: colorSchemeLight },
    { id: 'colorSchemeLightCold', part: colorSchemeLightCold },
    { id: 'colorSchemeLightWarm', part: colorSchemeLightWarm },
    { id: 'colorSchemeDark', part: colorSchemeDark },
    { id: 'colorSchemeDarkWarm', part: colorSchemeDarkWarm },
    { id: 'colorSchemeDarkBlue', part: colorSchemeDark },
    { id: 'colorSchemeVariable', part: colorSchemeVariable },
];

const iconSets = [
    { id: '(unchanged)', part: null },
    { id: 'iconSetQuartzLight', part: iconSetQuartzLight },
    { id: 'iconSetQuartzRegular', part: iconSetQuartzRegular },
    { id: 'iconSetQuartzBold', part: iconSetQuartzBold },
    { id: 'iconSetAlpine', part: iconSetAlpine },
    { id: 'iconSetMaterial', part: iconSetMaterial },
];

const VueExample = defineComponent({
    template: `
        <div style="height: 100%; display: flex; flex-direction: column">
            <p style="flex: 0 1 0%">
                Theme:
                <select style="margin-right: 16px" v-model="baseTheme">
                    <option v-for="t in baseThemes" :value="t">{{ t.id }}</option>
                </select>
                Icons:
                <select style="margin-right: 16px" v-model="iconSet">
                    <option v-for="iconSet in iconSets" :value="iconSet">{{ iconSet.id }}</option>
                </select>
                Color scheme:
                <select style="margin-right: 16px" v-model="colorScheme">
                    <option v-for="colorScheme in colorSchemes" :value="colorScheme">{{ colorScheme.id }}</option>
                </select>
            </p>
            <div style="flex: 1 1 0%">
                <ag-grid-vue
                    style="height: 100%;"
                    :theme="theme"
                    :columnDefs="columnDefs"
                    :defaultColDef="defaultColDef"
                    :rowData="rowData"
                    :sideBar="true"
                ></ag-grid-vue>
            </div>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    setup(props) {
        const baseTheme = ref(baseThemes[0]);
        const iconSet = ref(iconSets[0]);
        const colorScheme = ref(colorSchemes[0]);
        return {
            baseTheme,
            baseThemes,

            iconSet,
            iconSets,

            colorSchemes,
            colorScheme,

            theme: computed(() => {
                let theme = baseTheme.value.theme;
                if (colorScheme.value.part) {
                    theme = theme.withPart(colorScheme.value.part);
                }
                if (iconSet.value.part) {
                    theme = theme.withPart(iconSet.value.part);
                }
                return theme;
            }),

            columnDefs: <ColDef[]>[{ field: 'make' }, { field: 'model' }, { field: 'price' }],
            defaultColDef: <ColDef>{
                editable: true,
                flex: 1,
                minWidth: 100,
                filter: true,
            },
            rowData: (() => {
                const rowData = [];
                for (let i = 0; i < 10; i++) {
                    rowData.push({ make: 'Toyota', model: 'Celica', price: 35000 + i * 1000 });
                    rowData.push({ make: 'Ford', model: 'Mondeo', price: 32000 + i * 1000 });
                    rowData.push({ make: 'Porsche', model: 'Boxster', price: 72000 + i * 1000 });
                }
                return rowData;
            })(),
        };
    },
});

createApp(VueExample).mount('#app');
