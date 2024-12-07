import { createApp, defineComponent, ref, shallowRef } from 'vue';

import type { ColDef } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

import MedalRenderer from './medalRenderer';
import './styles.css';

ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule /* Development Only */]);

const VueExample = defineComponent({
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
        const columnDefs = ref<ColDef[]>([
            {
                headerName: 'Component By Name',
                field: 'country',
                cellRenderer: 'medalRenderer',
            },
        ]);

        const defaultColDef = ref<ColDef>({
            flex: 1,
            minWidth: 100,
        });

        const rowData = ref<any[]>(null);

        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => (rowData.value = data));

        return {
            columnDefs,
            defaultColDef,
            rowData,
        };
    },
});

createApp(VueExample).mount('#app');
