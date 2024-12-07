import { createApp, defineComponent, onMounted, ref } from 'vue';

import type {
    CellValueChangedEvent,
    ColDef,
    RowSelectionOptions,
    SelectionChangedEvent,
    ValueFormatterParams,
} from 'ag-grid-community';
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

const CompanyLogoRenderer = {
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
};

const MissionResultRenderer = {
    template: `
    <span style="display: flex; justify-content: center; height: 100%; align-items: center;">
      <img
        :alt="params.value"
        :src="'https://www.ag-grid.com/example-assets/icons/' + cellValue + '.png'"
        style="width: auto; height: auto;"
      />
    </span>
    `,
    setup(props) {
        const cellValue = props.params.value ? 'tick-in-circle' : 'cross-in-circle';
        return {
            cellValue,
        };
    },
};

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
        :rowSelection="rowSelection"
        @cell-value-changed="onCellValueChanged"
        @selection-changed="onSelectionChanged"
    >
    </ag-grid-vue>
    `,
    components: {
        AgGridVue,
        companyLogoRenderer: CompanyLogoRenderer,
        missionResultRenderer: MissionResultRenderer,
    },
    methods: {
        onCellValueChanged(event: CellValueChangedEvent) {
            console.log(`New Cell Value: ${event.value}`);
        },
        onSelectionChanged(event: SelectionChangedEvent) {
            console.log('Row Selection Event!');
        },
    },
    setup() {
        const rowData = ref<IRow[]>([]);

        // Fetch data when the component is mounted
        onMounted(async () => {
            rowData.value = await fetchData();
        });

        const dateFormatter = (params) => {
            return new Date(params.value).toLocaleDateString('en-us', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        };

        const colDefs = ref<ColDef[]>([
            {
                field: 'mission',
                width: 150,
            },
            {
                field: 'company',
                width: 130,
                cellRenderer: 'companyLogoRenderer',
            },
            {
                field: 'location',
                width: 225,
            },
            {
                field: 'date',
                valueFormatter: dateFormatter,
            },
            {
                field: 'price',
                width: 130,
                valueFormatter: (params: ValueFormatterParams) => {
                    return '£' + params.value.toLocaleString();
                },
            },
            {
                field: 'successful',
                width: 120,
                cellRenderer: 'missionResultRenderer',
            },
            { field: 'rocket' },
        ]);

        const rowSelection = ref<RowSelectionOptions>({
            mode: 'multiRow',
            headerCheckbox: false,
        });

        const defaultColDef = ref<ColDef>({
            filter: true,
            editable: true,
        });

        const fetchData = async () => {
            const response = await fetch('https://www.ag-grid.com/example-assets/space-mission-data.json');
            return response.json();
        };

        return {
            rowData,
            colDefs,
            rowSelection,
            defaultColDef,
        };
    },
});

createApp(App).mount('#app');
