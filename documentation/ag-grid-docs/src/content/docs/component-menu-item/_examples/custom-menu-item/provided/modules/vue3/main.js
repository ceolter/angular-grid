import { createApp, onBeforeMount, ref, shallowRef } from 'vue';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ClipboardModule } from 'ag-grid-enterprise';
import { ExcelExportModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { CellSelectionModule } from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';

import MenuItem from './menuItemVue.js';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,

    ColumnMenuModule,
    ContextMenuModule,
    ExcelExportModule,
    CellSelectionModule,
    ClipboardModule,
]);

const VueExample = {
    template: `
        <div style="height: 100%">
            <ag-grid-vue
                style="width: 100%; height: 100%;"
                :columnDefs="columnDefs"
                @grid-ready="onGridReady"
                :defaultColDef="defaultColDef"
                :rowData="rowData"
                :getMainMenuItems="getMainMenuItems"
                :getContextMenuItems="getContextMenuItems"
            >
            </ag-grid-vue>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
        MenuItem,
    },
    setup(props) {
        const columnDefs = ref([
            { field: 'athlete' },
            { field: 'country' },
            { field: 'sport' },
            { field: 'year' },
            { field: 'gold' },
            { field: 'silver' },
            { field: 'bronze' },
        ]);
        const gridApi = shallowRef();
        const defaultColDef = ref({
            flex: 1,
            minWidth: 100,
        });
        const getMainMenuItems = ref(null);
        const getContextMenuItems = ref(null);
        const rowData = ref(null);

        onBeforeMount(() => {
            getMainMenuItems.value = (params) => {
                return [
                    ...params.defaultItems,
                    'separator',
                    {
                        name: 'Click Alert Button and Close Menu',
                        menuItem: 'MenuItem',
                        menuItemParams: {
                            buttonValue: 'Alert',
                        },
                    },
                    {
                        name: 'Click Alert Button and Keep Menu Open',
                        suppressCloseOnSelect: true,
                        menuItem: 'MenuItem',
                        menuItemParams: {
                            buttonValue: 'Alert',
                        },
                    },
                ];
            };
            getContextMenuItems.value = (params) => {
                return [
                    ...(params.defaultItems || []),
                    'separator',
                    {
                        name: 'Click Alert Button and Close Menu',
                        menuItem: 'MenuItem',
                        menuItemParams: {
                            buttonValue: 'Alert',
                        },
                    },
                    {
                        name: 'Click Alert Button and Keep Menu Open',
                        suppressCloseOnSelect: true,
                        menuItem: 'MenuItem',
                        menuItemParams: {
                            buttonValue: 'Alert',
                        },
                    },
                ];
            };
        });

        const onGridReady = (params) => {
            gridApi.value = params.api;

            const updateData = (data) => {
                rowData.value = data;
            };

            fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
                .then((resp) => resp.json())
                .then((data) => updateData(data));
        };

        return {
            columnDefs,
            gridApi,
            defaultColDef,
            rowData,
            getMainMenuItems,
            getContextMenuItems,
            onGridReady,
        };
    },
};

createApp(VueExample).mount('#app');
