import { createApp } from 'vue';

import { ClientSideRowModelModule, ModuleRegistry, ValidationModule } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

import './styles.css';

ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule /* Development Only */]);

const athleteColumn = {
    headerName: 'Athlete',
    valueGetter: (params) => {
        return params.data.athlete;
    },
};

const VueExample = {
    template: `
      <div style="height: 100%">
      <div class="test-container">
        <div class="test-header">
          <button v-on:click="onBtIncludeMedalColumns()">Include Medal Columns</button>
          <button v-on:click="onBtExcludeMedalColumns()">Exclude Medal Columns</button>
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
            columnDefs: [],
            gridApi: null,
            defaultColDef: {
                initialWidth: 100,
            },
            rowData: null,
        };
    },
    beforeMount() {
        this.columnDefs = this.getColDefsMedalsIncluded();
    },
    methods: {
        onBtExcludeMedalColumns() {
            this.gridApi.setGridOption('columnDefs', this.getColDefsMedalsExcluded());
        },
        onBtIncludeMedalColumns() {
            this.gridApi.setGridOption('columnDefs', this.getColDefsMedalsIncluded());
        },
        onGridReady(params) {
            this.gridApi = params.api;

            const updateData = (data) => {
                this.rowData = data;
            };

            fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
                .then((resp) => resp.json())
                .then((data) => updateData(data));
        },
        getColDefsMedalsIncluded() {
            return [
                athleteColumn,
                {
                    colId: 'myAgeCol',
                    headerName: 'Age',
                    valueGetter: (params) => {
                        return params.data.age;
                    },
                },
                {
                    headerName: 'Country',
                    headerClass: 'country-header',
                    valueGetter: (params) => {
                        return params.data.country;
                    },
                },
                { field: 'sport' },
                { field: 'year' },
                { field: 'date' },
                { field: 'gold' },
                { field: 'silver' },
                { field: 'bronze' },
                { field: 'total' },
            ];
        },
        getColDefsMedalsExcluded() {
            return [
                athleteColumn,
                {
                    colId: 'myAgeCol',
                    headerName: 'Age',
                    valueGetter: (params) => {
                        return params.data.age;
                    },
                },
                {
                    headerName: 'Country',
                    headerClass: 'country-header',
                    valueGetter: (params) => {
                        return params.data.country;
                    },
                },
                { field: 'sport' },
                { field: 'year' },
                { field: 'date' },
            ];
        },
    },
};

createApp(VueExample).mount('#app');
