import { createApp, defineComponent } from 'vue';

import type { ColDef, GridApi, GridReadyEvent, ICellRenderer, ICellRendererParams, IRowNode } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const DeltaRenderer = defineComponent({
    template: `<span>
        <img :src="src" />
        {{displayValue}}
        </span>`,
    data: function () {
        return {
            src: '',
            displayValue: '',
        };
    },
    beforeMount() {
        this.updateDisplay(this.params);
    },
    methods: {
        refresh(params: ICellRendererParams) {
            this.updateDisplayValue(params);
        },
        updateDisplay(params) {
            this.displayValue = params.value;
            if (params.value > 15) {
                this.src = 'https://www.ag-grid.com/example-assets/weather/fire-plus.png';
            } else {
                this.src = 'https://www.ag-grid.com/example-assets/weather/fire-minus.png';
            }
        },
    },
});

const IconRenderer = defineComponent({
    template: `<span>
        <img v-for="images in arr" :src="src" />
        </span>`,
    data: function () {
        return {
            arr: [],
            src: '',
        };
    },
    beforeMount() {
        this.updateDisplay(this.params);
    },
    methods: {
        refresh(params) {
            this.updateDisplay(params);
        },
        updateDisplay(params) {
            this.src = `https://www.ag-grid.com/example-assets/weather/${params.rendererImage}`;
            this.arr = new Array(Math.floor(params.value / (params.divisor || 1)));
        },
    },
});

const VueExample = defineComponent({
    template: `
        <div style="height: 100%">
        <div class="example-wrapper">
            <div style="margin-bottom: 5px;">
                <button v-on:click="randomiseFrost()">Randomise Frost</button>
            </div>
            <ag-grid-vue
                    style="width: 100%; height: 100%;"
                    :components="components"
                    :columnDefs="columnDefs"
                    :rowData="rowData"
                    :defaultColDef="defaultColDef"
                    @grid-ready="onGridReady">
            </ag-grid-vue>
        </div>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
        iconRenderer: IconRenderer,
        deltaRenderer: DeltaRenderer,
    },
    data: function () {
        return {
            gridApi: null,
            components: {
                iconRenderer: IconRenderer,
                deltaRenderer: DeltaRenderer,
            },
            columnDefs: this.getColumnDefs(false),
            defaultColDef: {
                editable: true,
                flex: 1,
                minWidth: 100,
                filter: true,
            },
            rowData: null,

            frostPrefix: false,
        };
    },

    methods: {
        onGridReady(params: GridReadyEvent) {
            this.gridApi = params.api;

            const updateData = (data) => this.gridApi.setGridOption('rowData', data);

            fetch('https://www.ag-grid.com/example-assets/weather-se-england.json')
                .then((resp) => resp.json())
                .then((data) => updateData(data));
        },
        randomiseFrost() {
            // iterate over the "days of air frost" and generate random number
            this.gridApi.forEachNode((rowNode: IRowNode) => {
                rowNode.setDataValue('Days of air frost (days)', Math.floor(Math.random() * 4) + 1);
            });
        },
        getColumnDefs(): ColDef[] {
            return [
                {
                    headerName: 'Month',
                    field: 'Month',
                    width: 75,
                },
                {
                    headerName: 'Max Temp',
                    field: 'Max temp (C)',
                    width: 120,
                    cellRenderer: 'deltaRenderer',
                },
                {
                    headerName: 'Min Temp',
                    field: 'Min temp (C)',
                    width: 120,
                    cellRenderer: 'deltaRenderer',
                },
                {
                    headerName: 'Frost',
                    field: 'Days of air frost (days)',
                    width: 233,
                    cellRenderer: 'iconRenderer',
                    cellRendererParams: { rendererImage: 'frost.png' }, // Complementing the Cell Renderer parameters
                },
                {
                    headerName: 'Sunshine',
                    field: 'Sunshine (hours)',
                    width: 190,
                    cellRenderer: 'iconRenderer',
                    cellRendererParams: {
                        rendererImage: 'sun.png',
                        divisor: 24,
                    }, // Complementing the Cell Renderer parameters
                },
                {
                    headerName: 'Rainfall',
                    field: 'Rainfall (mm)',
                    width: 180,
                    cellRenderer: 'iconRenderer',
                    cellRendererParams: {
                        rendererImage: 'rain.png',
                        divisor: 10,
                    }, // Complementing the Cell Renderer parameters
                },
            ];
        },
    },
});

createApp(VueExample).mount('#app');
