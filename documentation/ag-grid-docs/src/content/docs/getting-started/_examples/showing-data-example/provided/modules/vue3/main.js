import { createApp } from 'vue';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const CustomButtonComponent = {
    template: `
        <div>        
            <button v-on:click="buttonClicked">Push Me!</button>
        </div>
    `,
    methods: {
        buttonClicked() {
            alert('clicked');
        },
    },
};

const VueExample = {
    template: `
        <div style="height: 100%">
            <ag-grid-vue
                style="width: 100%; height: 100%;"
                :columnDefs="columnDefs"
                @grid-ready="onGridReady"
                :rowData="rowData"></ag-grid-vue>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
        CustomButtonComponent,
    },
    data: function () {
        return {
            columnDefs: [
                {
                    headerName: 'Make & Model',
                    valueGetter: (p) => p.data.make + ' ' + p.data.model,
                    flex: 2,
                },
                {
                    field: 'price',
                    valueFormatter: (p) => '£' + Math.floor(p.value).toLocaleString(),
                    flex: 1,
                },
                {
                    field: 'electric',
                    flex: 1,
                },
                {
                    field: 'button',
                    cellRenderer: 'CustomButtonComponent',
                    flex: 1,
                },
            ],
            gridApi: null,

            rowData: null,
        };
    },
    created() {
        this.rowData = [
            { make: 'Tesla', model: 'Model Y', price: 64950, electric: true },
            { make: 'Ford', model: 'F-Series', price: 33850, electric: false },
            { make: 'Toyota', model: 'Corolla', price: 29600, electric: false },
            { make: 'Mercedes', model: 'EQA', price: 48890, electric: true },
            { make: 'Fiat', model: '500', price: 15774, electric: false },
            { make: 'Nissan', model: 'Juke', price: 20675, electric: false },
        ];
    },
    methods: {
        onGridReady(params) {
            this.gridApi = params.api;
        },
    },
};

const gridDiv = document.querySelector('#myGrid');

createApp(VueExample).mount('#app');
