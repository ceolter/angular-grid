import { createApp } from 'vue';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const colDefsMedalsIncluded = [
    { field: 'athlete' },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
    { field: 'age' },
    { field: 'country' },
    { field: 'sport' },
    { field: 'year' },
    { field: 'date' },
];

const colDefsMedalsExcluded = [
    { field: 'athlete' },
    { field: 'age' },
    { field: 'country' },
    { field: 'sport' },
    { field: 'year' },
    { field: 'date' },
];

const VueExample = {
    template: `
        <div style="height: 100%">
            <div class="test-container">
                <div class="test-header">
                    <button v-on:click="onBtExcludeMedalColumns()">Exclude Medal Columns</button>
                    <button v-on:click="onBtIncludeMedalColumns()">Include Medal Columns</button>
                </div>
                <ag-grid-vue
                        style="width: 100%; height: 100%;"
                        id="myGrid"
                        :columnDefs="columnDefs"
                        @grid-ready="onGridReady"
                        :defaultColDef="defaultColDef"
                        :rowData="rowData"></ag-grid-vue>
            </div>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    data: function () {
        return {
            columnDefs: colDefsMedalsIncluded,
            gridApi: null,
            defaultColDef: {
                initialWidth: 100,
            },
            rowData: null,
        };
    },
    beforeMount() {},
    methods: {
        onBtExcludeMedalColumns() {
            this.gridApi.setGridOption('columnDefs', colDefsMedalsExcluded);
        },
        onBtIncludeMedalColumns() {
            this.gridApi.setGridOption('columnDefs', colDefsMedalsIncluded);
        },
        onGridReady(params) {
            this.gridApi = params.api;

            const updateData = (data) => {
                this.onBtIncludeMedalColumns();
                this.rowData = data;
            };

            fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
                .then((resp) => resp.json())
                .then((data) => updateData(data));
        },
    },
};

createApp(VueExample).mount('#app');
