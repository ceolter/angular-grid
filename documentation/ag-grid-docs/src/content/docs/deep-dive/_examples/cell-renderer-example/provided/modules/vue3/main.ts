import { createApp, defineComponent, onMounted, ref } from 'vue';

import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
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

const CompanyLogoRenderer = defineComponent({
    template: `
        <span style="display: flex; height: 100%; width: 100%; align-items: center;">
          <img :src="'https://www.ag-grid.com/example-assets/space-company-logos/' + cellValueLowerCase + '.png'" style="display: block; width: 25px; height: auto; max-height: 50%; margin-right: 12px; filter: brightness(1.1);" />
          <p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">{{ cellValue }}</p>
        </span>
    `,
    setup(props) {
        const cellValue = props.params.value;
        const cellValueLowerCase = cellValue.toLowerCase();
        return {
            cellValue,
            cellValueLowerCase,
        };
    },
});

// Define the component configuration
const App = defineComponent({
    name: 'App',
    template: `
        <ag-grid-vue
            style="width: 100%; height: 100%"
            :columnDefs="colDefs"
            :rowData="rowData"
            :defaultColDef="defaultColDef"
            :pagination="true"
        >
        </ag-grid-vue>
    `,
    components: {
        AgGridVue,
        companyLogoRenderer: CompanyLogoRenderer,
    },
    setup() {
        const rowData = ref<IRow[]>([]);

        const colDefs = ref<ColDef[]>([
            {
                field: 'mission',
                filter: true,
            },
            {
                field: 'company',
                cellRenderer: 'companyLogoRenderer',
            },
            { field: 'location' },
            { field: 'date' },
            {
                field: 'price',
                valueFormatter: (params: ValueFormatterParams) => {
                    return '£' + params.value.toLocaleString();
                },
            },
            { field: 'successful' },
            { field: 'rocket' },
        ]);

        const defaultColDef = ref<ColDef>({
            filter: true,
        });

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
            defaultColDef,
        };
    },
});

createApp(App).mount('#app');
