import { createApp, onBeforeMount, ref, shallowRef } from 'vue';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';

import CustomMedalCellRenderer from './customMedalCellRenderer.js';
import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RowGroupingModule]);

const VueExample = {
    template: `
        <div style="height: 100%">
                <ag-grid-vue
      style="width: 100%; height: 100%;"
      :columnDefs="columnDefs"
      @grid-ready="onGridReady"
      :defaultColDef="defaultColDef"
      :autoGroupColumnDef="autoGroupColumnDef"
      :groupDisplayType="groupDisplayType"
      :rowData="rowData"></ag-grid-vue>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
        CustomMedalCellRenderer,
    },
    setup(props) {
        const columnDefs = ref([
            { field: 'total', rowGroup: true },
            { field: 'country' },
            { field: 'year' },
            { field: 'athlete' },
            { field: 'sport' },
        ]);
        const gridApi = shallowRef();
        const defaultColDef = ref({
            flex: 1,
            minWidth: 100,
        });
        const autoGroupColumnDef = ref({
            headerName: 'Gold Medals',
            minWidth: 220,
            cellRendererParams: {
                suppressCount: true,
                innerRenderer: 'CustomMedalCellRenderer',
            },
        });
        const groupDisplayType = ref(null);
        const rowData = ref(null);

        onBeforeMount(() => {
            groupDisplayType.value = 'multipleColumns';
        });

        const onGridReady = (params) => {
            gridApi.value = params.api;

            const updateData = (data) => (rowData.value = data);

            fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
                .then((resp) => resp.json())
                .then((data) => updateData(data));
        };

        return {
            columnDefs,
            gridApi,
            defaultColDef,
            autoGroupColumnDef,
            groupDisplayType,
            rowData,
            onGridReady,
        };
    },
};

createApp(VueExample).mount('#app');
