import { createApp, defineComponent, onBeforeMount, ref, shallowRef } from 'vue';

import {
    CellDoubleClickedEvent,
    CellKeyDownEvent,
    ColDef,
    GridApi,
    GridReadyEvent,
    ICellRenderer,
    ModuleRegistry,
    ValidationModule,
} from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';

import CustomGroupCellRenderer from './customGroupCellRenderer';
import './styles.css';

ModuleRegistry.registerModules([RowGroupingModule, ValidationModule /* Development Only */]);

const VueExample = defineComponent({
    template: `
        <div style="height: 100%">
            <ag-grid-vue
              style="width: 100%; height: 100%;"
              :columnDefs="columnDefs"
              @grid-ready="onGridReady"
              :groupRowRenderer="groupRowRenderer"
              :defaultColDef="defaultColDef"
              :groupDisplayType="groupDisplayType"
              :rowData="rowData"
              @cell-double-clicked="onCellDoubleClicked"
              @cell-key-down="onCellKeyDown">
            </ag-grid-vue>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
        CustomGroupCellRenderer,
    },
    setup(props) {
        const columnDefs = ref<ColDef[]>([
            { field: 'country', hide: true, rowGroup: true },
            { field: 'year', hide: true, rowGroup: true },
            { field: 'athlete' },
            { field: 'sport' },
            { field: 'total', aggFunc: 'sum' },
        ]);
        const gridApi = shallowRef<GridApi | null>(null);
        const defaultColDef = ref<ColDef>({
            flex: 1,
            minWidth: 120,
        });

        const groupRowRenderer = ref<ICellRenderer>(null);
        const groupDisplayType = ref(null);
        const rowData = ref<any[]>(null);

        onBeforeMount(() => {
            groupRowRenderer.value = 'CustomGroupCellRenderer';
            groupDisplayType.value = 'groupRows';
        });

        const onCellDoubleClicked = (params: CellDoubleClickedEvent) => {
            if (params.colDef.showRowGroup) {
                params.node.setExpanded(!params.node.expanded);
            }
        };
        const onCellKeyDown = (params: CellKeyDownEvent) => {
            if (!('colDef' in params)) {
                return;
            }
            if (!(params.event instanceof KeyboardEvent)) {
                return;
            }
            if (params.event.code !== 'Enter') {
                return;
            }
            if (params.colDef.showRowGroup) {
                params.node.setExpanded(!params.node.expanded);
            }
        };
        const onGridReady = (params: GridReadyEvent) => {
            gridApi.value = params.api;

            const updateData = (data) => (rowData.value = data);

            fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
                .then((resp) => resp.json())
                .then((data) => updateData(data));
        };

        return {
            columnDefs,
            gridApi,
            groupRowRenderer,
            defaultColDef,
            groupDisplayType,
            rowData,
            onGridReady,
            onCellDoubleClicked,
            onCellKeyDown,
        };
    },
});

createApp(VueExample).mount('#app');
