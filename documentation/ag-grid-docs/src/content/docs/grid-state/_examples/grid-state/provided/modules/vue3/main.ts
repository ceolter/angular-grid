import { createApp, defineComponent, ref, shallowRef } from 'vue';

import type {
    ColDef,
    GridApi,
    GridPreDestroyedEvent,
    GridReadyEvent,
    GridState,
    RowSelectionOptions,
    StateUpdatedEvent,
} from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    GridStateModule,
    ModuleRegistry,
    NumberFilterModule,
    RowSelectionModule,
    ValidationModule,
} from 'ag-grid-community';
import {
    CellSelectionModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    PivotModule,
    SetFilterModule,
} from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';

import './styles.css';

ModuleRegistry.registerModules([
    NumberFilterModule,
    RowSelectionModule,
    GridStateModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    SetFilterModule,
    CellSelectionModule,
    PivotModule,
    ValidationModule /* Development Only */,
]);

const VueExample = defineComponent({
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
        const columnDefs = ref<ColDef[]>([
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
        const gridApi = shallowRef<GridApi | null>(null);
        const defaultColDef = ref<ColDef>({
            flex: 1,
            minWidth: 100,
            filter: true,
            enableRowGroup: true,
            enablePivot: true,
            enableValue: true,
        });
        const rowSelection = ref<RowSelectionOptions>({
            mode: 'multiRow',
        });
        const rowData = ref<any[]>(null);
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
        const onGridReady = (params: GridReadyEvent) => {
            gridApi.value = params.api;

            const updateData = (data) => (rowData.value = data);

            fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
                .then((resp) => resp.json())
                .then((data) => updateData(data));
        };
        const onGridPreDestroyed = (params: GridPreDestroyedEvent) => {
            console.log('Grid state on destroy (can be persisted)', params.state);
        };
        const onStateUpdated = (params: StateUpdatedEvent) => {
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
});

createApp(VueExample).mount('#app');
