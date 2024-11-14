import { createApp } from 'vue';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const VueExample = {
    template: `
        <div style="display: flex; flex-direction: column; height: 100%">
            <div style="margin-bottom: 5px;">
                <button @click="fillLarge">Fill 100%</button>
                <button @click="fillMedium">Fill 60%</button>
                <button @click="fillExact">Exactly 400 x 400 pixels</button>
            </div>
            <div style="width: 100%; flex: 1 1 auto;">
                <ag-grid-vue :style="{width, height}"
                             @grid-ready="onGridReady"
                             :columnDefs="columnDefs"
                             :rowData="rowData"
                             ></ag-grid-vue>
            </div>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    data: function () {
        return {
            columnDefs: null,
            rowData: null,
            height: '100%',
            width: '100%',
        };
    },
    beforeMount() {
        this.columnDefs = [
            { field: 'athlete', width: 150 },
            { field: 'age', width: 90 },
            { field: 'country', width: 150 },
            { field: 'year', width: 90 },
            { field: 'date', width: 150 },
            { field: 'sport', width: 150 },
            { field: 'gold', width: 100 },
            { field: 'silver', width: 100 },
            { field: 'bronze', width: 100 },
            { field: 'total', width: 100 },
        ];
    },
    mounted() {},
    methods: {
        fillLarge() {
            this.setWidthAndHeight('100%', '100%');
        },
        fillMedium() {
            this.setWidthAndHeight('60%', '60%');
        },
        fillExact() {
            this.setWidthAndHeight('400px', '400px');
        },
        setWidthAndHeight(width, height) {
            this.width = width;
            this.height = height;
        },
        onGridReady(params) {
            const updateData = (data) => (this.rowData = data);

            fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
                .then((resp) => resp.json())
                .then((data) => updateData(data));
        },
    },
};

var minRowHeight = 25;

var currentRowHeight = minRowHeight;

createApp(VueExample).mount('#app');
