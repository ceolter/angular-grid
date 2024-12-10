import { computed, createApp, defineComponent, onBeforeMount, ref, shallowRef } from 'vue';

import type { ColDef } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    NumberFilterModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
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
import { AgGridVue } from 'ag-grid-vue3';

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

const VueExample = defineComponent({
    template: `
        <div style="height: 100%; display: flex; flex-direction: column">
            <p style="flex: 0 1 0%">
                Theme:
                <select style="margin-right: 16px" v-model="theme">
                    <option v-for="(theme, id) in themes" :value="theme">{{ id }}</option>
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
        const theme = ref(themeQuartz);
        return {
            theme,
            themes: {
                themeQuartz,
                themeBalham,
                themeAlpine,
            },

            columnDefs: <ColDef[]>[{ field: 'make' }, { field: 'model' }, { field: 'price' }],
            defaultColDef: <ColDef>{
                editable: true,
                flex: 1,
                minWidth: 100,
                filter: true,
            },
            rowData: <any[]>(() => {
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
