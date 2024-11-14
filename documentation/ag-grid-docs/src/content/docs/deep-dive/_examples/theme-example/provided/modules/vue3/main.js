import { createApp } from 'vue';
import { ref } from 'vue';

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
        const rowData = ref([
            {
                mission: 'CRS SpX-25',
                company: 'SpaceX',
                location: 'LC-39A, Kennedy Space Center, Florida, USA',
                date: '2022-07-15',
                time: '0:44:00',
                rocket: 'Falcon 9 Block 5',
                price: 12480000,
                successful: true,
            },
            {
                mission: 'LARES 2 & Cubesats',
                company: 'ESA',
                location: 'ELV-1, Guiana Space Centre, French Guiana, France',
                date: '2022-07-13',
                time: '13:13:00',
                rocket: 'Vega C',
                price: 4470000,
                successful: true,
            },
            {
                mission: 'Wise One Looks Ahead (NROL-162)',
                company: 'Rocket Lab',
                location: 'Rocket Lab LC-1A, Māhia Peninsula, New Zealand',
                date: '2022-07-13',
                time: '6:30:00',
                rocket: 'Electron/Curie',
                price: 9750000,
                successful: true,
            },
        ]);

        const colDefs = ref([
            { field: 'mission' },
            { field: 'company' },
            { field: 'location' },
            { field: 'date' },
            { field: 'price' },
            { field: 'successful' },
            { field: 'rocket' },
        ]);

        return {
            rowData,
            colDefs,
        };
    },
};

createApp(App).mount('#app');
