import { createApp, defineComponent } from 'vue';

import type { ColDef } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    NumberFilterModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
    colorSchemeDarkBlue,
    colorSchemeDarkWarm,
    colorSchemeLightCold,
    colorSchemeLightWarm,
    themeAlpine,
    themeBalham,
    themeQuartz,
} from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

ModuleRegistry.registerModules([
    TextEditorModule,
    TextFilterModule,
    NumberFilterModule,
    NumberEditorModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const VueExample = defineComponent({
    template: `
        <div style="height: 100%; display: flex; flex-direction: column">
            <div style="display: flex; gap: 16px">
                <p style="flex: 1 1 0%">colorSchemeLightWarm:</p>
                <p style="flex: 1 1 0%">colorSchemeLightCold:</p>
            </div>
            <div style="flex: 1 1 0%; display: flex; gap: 16px">
                <div style="flex: 1 1 0%">
                    <ag-grid-vue
                        style="height: 100%;"
                        :columnDefs="columnDefs"
                        :defaultColDef="defaultColDef"
                        :rowData="rowData"
                        :theme="theme1"
                    ></ag-grid-vue>
                </div>
                <div style="flex: 1 1 0%">
                    <ag-grid-vue
                        style="height: 100%;"
                        :columnDefs="columnDefs"
                        :defaultColDef="defaultColDef"
                        :rowData="rowData"
                        :theme="theme2"
                    ></ag-grid-vue>
                </div>
            </div>
            <div style="display: flex; gap: 16px">
                <p style="flex: 1 1 0%">colorSchemeDarkWarm:</p>
                <p style="flex: 1 1 0%">colorSchemeDarkBlue:</p>
            </div>
            <div style="flex: 1 1 0%; display: flex; gap: 16px">
                <div style="flex: 1 1 0%;">
                    <ag-grid-vue
                        style="height: 100%;"
                        :columnDefs="columnDefs"
                        :defaultColDef="defaultColDef"
                        :rowData="rowData"
                        :theme="theme3"
                    ></ag-grid-vue>
                </div>
                <div style="flex: 1 1 0%;">
                    <ag-grid-vue
                        style="height: 100%;"
                        :columnDefs="columnDefs"
                        :defaultColDef="defaultColDef"
                        :rowData="rowData"
                        :theme="theme4"
                    ></ag-grid-vue>
                </div>
            </div>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    setup(props) {
        return {
            theme1: themeQuartz.withPart(colorSchemeLightWarm),
            theme2: themeQuartz.withPart(colorSchemeLightCold),
            theme3: themeQuartz.withPart(colorSchemeDarkWarm),
            theme4: themeQuartz.withPart(colorSchemeDarkBlue),

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
