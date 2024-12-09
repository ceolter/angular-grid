import { createApp } from 'vue';

import { ClientSideRowModelModule, ColumnApiModule, ModuleRegistry, ValidationModule } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

import './styles.css';

ModuleRegistry.registerModules([ColumnApiModule, ClientSideRowModelModule, ValidationModule /* Development Only */]);

const VueExample = {
    template: `
      <div style="height: 100%">
      <div class="test-container">
        <div class="test-header">
          <button v-on:click="onBtWithState()">Set Columns with State</button>
          <button v-on:click="onBtRemove()">Remove Columns</button>
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
                width: 100, // resets col widths if manually resized
                pinned: null,
                sort: null,
            },
            rowData: null,
        };
    },
    beforeMount() {
        this.columnDefs = this.getColumnDefs();
    },
    methods: {
        onBtWithState() {
            this.gridApi.setGridOption('columnDefs', this.getColumnDefs());
        },
        onBtRemove() {
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
        getColumnDefs() {
            return [
                {
                    field: 'athlete',
                    width: 100,
                    sort: 'asc',
                },
                { field: 'age' },
                {
                    field: 'country',
                    pinned: 'left',
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
    },
};

createApp(VueExample).mount('#app');
