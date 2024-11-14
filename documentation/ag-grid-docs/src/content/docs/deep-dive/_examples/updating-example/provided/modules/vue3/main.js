import { createApp } from 'vue';
import { onMounted, ref } from 'vue';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

// Define the component configuration
const App = {
    name: 'App',
    template: `
    <ag-grid-vue
        style="width: 100%; height: 100%"
        :columnDefs="colDefs"
        :rowData="rowData"
    >
    </ag-grid-vue>
    `,
    components: {
        AgGridVue,
    },
    setup() {
        const rowData = ref([]);

        const colDefs = ref([
            { field: 'mission' },
            { field: 'company' },
            { field: 'location' },
            { field: 'date' },
            { field: 'price' },
            { field: 'successful' },
            { field: 'rocket' },
        ]);

        // Fetch data when the component is mounted
        onMounted(async () => {
            rowData.value = await fetchData();
        });

        const fetchData = async () => {
            const response = await fetch('https://www.ag-grid.com/example-assets/space-mission-data.json');
            return response.json();
        };

        return {
            rowData,
            colDefs,
        };
    },
};

createApp(App).mount('#app');
