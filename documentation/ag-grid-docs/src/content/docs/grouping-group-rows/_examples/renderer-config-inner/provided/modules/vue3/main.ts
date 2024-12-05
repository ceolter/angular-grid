import { createApp, defineComponent, onBeforeMount, ref, shallowRef } from 'vue';

import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';

import CustomMedalCellRenderer from './customMedalCellRenderer';
import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, RowGroupingModule]);

const VueExample = defineComponent({
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
        const columnDefs = ref<ColDef[]>([
            { field: 'athlete' },
            { field: 'year' },
            { field: 'sport' },
            { field: 'total', rowGroup: true },
        ]);
        const gridApi = shallowRef<GridApi | null>();
        const defaultColDef = ref<ColDef>({
            flex: 1,
            minWidth: 100,
        });
        const autoGroupColumnDef = ref<ColDef>({
            headerName: 'Gold Medals',
            minWidth: 220,
            cellRendererParams: {
                suppressCount: true,
                innerRenderer: 'CustomMedalCellRenderer',
            },
        });
        const groupDisplayType = ref(null);
        const rowData = ref<any[]>(null);

        onBeforeMount(() => {
            groupDisplayType.value = 'multipleColumns';
        });

        const onGridReady = (params: GridReadyEvent) => {
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
});

createApp(VueExample).mount('#app');
