import { createApp, ref, shallowRef } from 'vue';

import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

import MedalRenderer from './medalRenderer.js';
import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const VueExample = {
    template: `
        <div style="height: 100%">
            <div class="example-wrapper">
                <ag-grid-vue
                    style="width: 100%; height: 100%;"
                    :columnDefs="columnDefs"
                    :defaultColDef="defaultColDef"
                    :rowData="rowData">
                </ag-grid-vue>
            </div>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
        medalRenderer: MedalRenderer,
    },
    setup(props) {
        const columnDefs = ref([
            {
                headerName: 'Component By Name',
                field: 'country',
                cellRenderer: 'medalRenderer',
            },
        ]);

        const defaultColDef = ref({
            flex: 1,
            minWidth: 100,
        });

        const rowData = ref(null);

        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => (rowData.value = data));

        return {
            columnDefs,
            defaultColDef,
            rowData,
        };
    },
};

createApp(VueExample).mount('#app');
