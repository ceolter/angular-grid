import { createApp } from 'vue';

import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

import './styles.css';

ModuleRegistry.registerModules([
    TextFilterModule,
    NumberFilterModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const VueExample = {
    template: `
      <div style="height: 100%">
      <div class="test-container">
        <div class="test-header">
          <button v-on:click="setColsA()">Column Set A</button>
          <button v-on:click="setColsB()">Column Set B</button>
          <button v-on:click="clearColDefs()">Clear</button>
        </div>
        <ag-grid-vue
            style="width: 100%; height: 100%;"
            id="myGrid"
            :columnDefs="columnDefs"
            @grid-ready="onGridReady"
            :defaultColDef="defaultColDef"
            :maintainColumnOrder="true"
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
                filter: true,
            },
            rowData: null,
        };
    },
    beforeMount() {
        this.columnDefs = this.getColumnDefsA();
    },
    methods: {
        setColsA() {
            this.gridApi.setGridOption('columnDefs', this.getColumnDefsA());
        },
        setColsB() {
            this.gridApi.setGridOption('columnDefs', this.getColumnDefsB());
        },
        clearColDefs() {
            this.gridApi.setGridOption('columnDefs', []);
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
        getColumnDefsA() {
            return [
                { field: 'athlete', headerName: 'A Athlete' },
                { field: 'age', headerName: 'A Age' },
                { field: 'country', headerName: 'A Country' },
                { field: 'sport', headerName: 'A Sport' },
                { field: 'year', headerName: 'A Year' },
                { field: 'date', headerName: 'A Date' },
                { field: 'gold', headerName: 'A Gold' },
                { field: 'silver', headerName: 'A Silver' },
                { field: 'bronze', headerName: 'A Bronze' },
                { field: 'total', headerName: 'A Total' },
            ];
        },
        getColumnDefsB() {
            return [
                { field: 'gold', headerName: 'B Gold' },
                { field: 'silver', headerName: 'B Silver' },
                { field: 'bronze', headerName: 'B Bronze' },
                { field: 'total', headerName: 'B Total' },
                { field: 'athlete', headerName: 'B Athlete' },
                { field: 'age', headerName: 'B Age' },
                { field: 'country', headerName: 'B Country' },
                { field: 'sport', headerName: 'B Sport' },
                { field: 'year', headerName: 'B Year' },
                { field: 'date', headerName: 'B Date' },
            ];
        },
    },
};

createApp(VueExample).mount('#app');
