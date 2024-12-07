import { createApp, defineComponent, onMounted, ref } from 'vue';

import type { ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

ModuleRegistry.registerModules([AllCommunityModule]);

// Row Data Interface
interface IRow {
    mission: string;
    company: string;
    location: string;
    date: string;
    time: string;
    rocket: string;
    price: number;
    successful: boolean;
}

// Define the component configuration
const App = defineComponent({
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
        const rowData = ref<IRow[]>([]);

        const colDefs = ref<ColDef[]>([
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
});

createApp(App).mount('#app');
