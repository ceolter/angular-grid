import { createApp, ref, shallowRef } from 'vue';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { CellSelectionModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';

import './styles.css';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,

    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    SetFilterModule,
    CellSelectionModule,
]);

const VueExample = {
    template: `
        <div style="height: 100%">
            <div class="example-wrapper">
                <div>
                    <span class="button-group">
                        <button v-on:click="reloadGrid()">Recreate Grid with Current State</button>
                        <button v-on:click="printState()">Print State</button>
                    </span>
                </div>
                <ag-grid-vue
                    v-if="gridVisible"
                    style="width: 100%; height: 100%;"
                    :columnDefs="columnDefs"
                    @grid-ready="onGridReady"
                    :defaultColDef="defaultColDef"
                    :sideBar="true"
                    :pagination="true"
                    :rowSelection="rowSelection"
                    :suppressColumnMoveAnimation="true"
                    :rowData="rowData"
                    :initialState="initialState"
                    @grid-pre-destroyed="onGridPreDestroyed"
                    @state-updated="onStateUpdated"
                ></ag-grid-vue>
            </div>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    setup(props) {
        const columnDefs = ref([
            { field: 'athlete', minWidth: 150 },
            { field: 'age', maxWidth: 90 },
            { field: 'country', minWidth: 150 },
            { field: 'year', maxWidth: 90 },
            { field: 'date', minWidth: 150 },
            { field: 'sport', minWidth: 150 },
            { field: 'gold' },
            { field: 'silver' },
            { field: 'bronze' },
            { field: 'total' },
        ]);
        const gridApi = shallowRef();
        const defaultColDef = ref({
            flex: 1,
            minWidth: 100,
            filter: true,
            enableRowGroup: true,
            enablePivot: true,
            enableValue: true,
        });
        const rowSelection = ref({
            mode: 'multiRow',
        });
        const rowData = ref(null);
        const gridVisible = ref(true);
        const initialState = ref(undefined);

        const reloadGrid = () => {
            const state = gridApi.value.getState();
            gridVisible.value = false;
            setTimeout(() => {
                initialState.value = state;
                rowData.value = undefined;
                gridVisible.value = true;
            });
        };
        const printState = () => {
            console.log('Grid state', gridApi.value.getState());
        };
        const onGridReady = (params) => {
            gridApi.value = params.api;

            const updateData = (data) => (rowData.value = data);

            fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
                .then((resp) => resp.json())
                .then((data) => updateData(data));
        };
        const onGridPreDestroyed = (params) => {
            console.log('Grid state on destroy (can be persisted)', params.state);
        };
        const onStateUpdated = (params) => {
            console.log('State updated', params.state);
        };

        return {
            columnDefs,
            gridApi,
            defaultColDef,
            rowSelection,
            rowData,
            gridVisible,
            initialState,
            onGridReady,
            onGridPreDestroyed,
            onStateUpdated,
            reloadGrid,
            printState,
        };
    },
};

createApp(VueExample).mount('#app');
