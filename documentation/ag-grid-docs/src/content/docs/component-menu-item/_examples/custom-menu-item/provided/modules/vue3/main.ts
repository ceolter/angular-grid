import { createApp, defineComponent, onBeforeMount, ref, shallowRef } from 'vue';

import type {
    ColDef,
    GetContextMenuItemsParams,
    GetMainMenuItemsParams,
    GridApi,
    GridReadyEvent,
} from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule } from 'ag-grid-community';
import {
    CellSelectionModule,
    ClipboardModule,
    ColumnMenuModule,
    ContextMenuModule,
    ExcelExportModule,
} from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';

import MenuItem from './menuItemVue';

ModuleRegistry.registerModules([
    ColumnMenuModule,
    ContextMenuModule,
    ExcelExportModule,
    CellSelectionModule,
    ClipboardModule,
    ValidationModule /* Development Only */,
]);

const VueExample = defineComponent({
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
        const columnDefs = ref<ColDef[]>([
            { field: 'athlete' },
            { field: 'country' },
            { field: 'sport' },
            { field: 'year' },
            { field: 'gold' },
            { field: 'silver' },
            { field: 'bronze' },
        ]);
        const gridApi = shallowRef<GridApi | null>(null);
        const defaultColDef = ref<ColDef>({
            flex: 1,
            minWidth: 100,
        });
        const getMainMenuItems = ref(null);
        const getContextMenuItems = ref(null);
        const rowData = ref<any[]>(null);

        onBeforeMount(() => {
            getMainMenuItems.value = (params: GetMainMenuItemsParams) => {
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
            getContextMenuItems.value = (params: GetContextMenuItemsParams) => {
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

        const onGridReady = (params: GridReadyEvent) => {
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
});

createApp(VueExample).mount('#app');
