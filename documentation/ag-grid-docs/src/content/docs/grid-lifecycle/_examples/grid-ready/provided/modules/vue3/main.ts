import { createApp, defineComponent, onBeforeMount, ref, shallowRef } from 'vue';

import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { ClientSideRowModelModule, ColumnApiModule, ModuleRegistry, ValidationModule } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

import { getData } from './data';
import './styles.css';

ModuleRegistry.registerModules([ColumnApiModule, ClientSideRowModelModule, ValidationModule /* Development Only */]);

const VueExample = defineComponent({
    template: `
        <div style="height: 100%">
            <div class="test-container">
                <div class="test-header">
                    <div style="margin-bottom: 1rem;">
                        <input type="checkbox" id="pinFirstColumnOnLoad">
                        <label for="pinFirstColumnOnLoad">Pin first column on load</label>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <button id="reloadGridButton" v-on:click="reloadGrid()">Reload Grid</button>
                    </div>
                </div>
                <ag-grid-vue
                    v-if="isVisible"              
                    style="width: 100%; height: 100%;"
                    :columnDefs="columnDefs"
                    @grid-ready="onGridReady"
                    :rowData="rowData"></ag-grid-vue>
            </div>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    setup(props) {
        const columnDefs = ref<ColDef[]>([
            {
                field: 'name',
                headerName: 'Athlete',
                width: 250,
            },
            {
                field: 'person.country',
                headerName: 'Country',
            },
            {
                field: 'person.age',
                headerName: 'Age',
            },
            {
                field: 'medals.gold',
                headerName: 'Gold Medals',
            },
            {
                field: 'medals.silver',
                headerName: 'Silver Medals',
            },
            {
                field: 'medals.bronze',
                headerName: 'Bronze Medals',
            },
        ]);

        const gridApi = shallowRef<GridApi | null>(null);

        const rowData = ref<any[]>(null);
        const isVisible = ref(true);

        onBeforeMount(() => {
            rowData.value = getData();
        });

        const reloadGrid = () => {
            isVisible.value = false;
            setTimeout(() => (isVisible.value = true), 1);
        };
        const onGridReady = (params: GridReadyEvent) => {
            gridApi.value = params.api;

            const checkbox = document.querySelector('#pinFirstColumnOnLoad');
            const shouldPinFirstColumn = checkbox && checkbox.checked;

            if (shouldPinFirstColumn) {
                params.api.applyColumnState({
                    state: [{ colId: 'name', pinned: 'left' }],
                });
            }
        };

        return {
            columnDefs,
            gridApi,
            rowData,
            onGridReady,
            reloadGrid,
            isVisible,
        };
    },
});

createApp(VueExample).mount('#app');
