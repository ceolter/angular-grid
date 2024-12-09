import { createApp, defineComponent } from 'vue';

import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    DragAndDropModule,
    ModuleRegistry,
    RowApiModule,
    RowDragModule,
    RowStyleModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

import './style.css';

ModuleRegistry.registerModules([
    DragAndDropModule,
    ClientSideRowModelApiModule,
    RowApiModule,
    TextFilterModule,
    RowDragModule,
    RowStyleModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const VueExample = defineComponent({
    template: /* html */ `
        <div class="outer">
            <div style="height: 100%" class="inner-col" v-on:dragover="gridDragOver($event)" v-on:drop="gridDrop($event, 'left')">
                <ag-grid-vue
                    style="height: 100%; width: 100%;"
                    ref="leftGrid"
                    :gridOptions="leftGridOptions"
                    :columnDefs="leftColumnDefs"
                    :rowClassRules="rowClassRules"
                    :rowData="leftRowData"
                    :rowDragManaged="true">
                </ag-grid-vue>
            </div>
            <div class="inner-col factory-panel">
                <span id="eBin" class="factory factory-bin" v-on:dragover="binDragOver($event)" v-on:drop="binDrop($event)">
                    <i class="far fa-trash-alt"><span class="filename"> Trash - </span></i>
                    Drop target to destroy row
                    </span>
                <span draggable="true" class="factory factory-red" v-on:dragstart="dragStart($event, 'Red')">
                    <i class="far fa-plus-square"><span class="filename"> Create - </span></i>
                    Drag source for new red item
                </span>
                <span draggable="true" class="factory factory-green" v-on:dragstart="dragStart($event, 'Green')">
                    <i class="far fa-plus-square"><span class="filename"> Create - </span></i>
                    Drag source for new green item
                </span>
                <span draggable="true" class="factory factory-blue" v-on:dragstart="dragStart($event, 'Blue')">
                    <i class="far fa-plus-square"><span class="filename"> Create - </span></i>
                    Drag source for new blue item
                </span>
            </div>
            <div style="height: 100%" class="inner-col" v-on:dragover="gridDragOver($event)" v-on:drop="gridDrop($event, 'right')">
                <ag-grid-vue
                    style="height: 100%; width: 100%"
                    ref="rightGrid"
                    :gridOptions="rightGridOptions"
                    :columnDefs ="rightColumnDefs"
                    :rowClassRules="rowClassRules"
                    :rowData="rightRowData"
                    :rowDragManaged="true">
                </ag-grid-vue>
            </div>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    data: function () {
        return {
            leftGridOptions: null,
            rightGridOptions: null,
            leftGridApi: null,
            rightGridApi: null,
            leftColumnDefs: null,
            rightColumnDefs: null,
            rowClassRules: null,
            leftRowData: null,
            rightRowData: null,
            rowIdSequence: 100,
        };
    },
    beforeMount() {
        const baseDefaultColDef = <ColDef>{
            flex: 1,
            filter: true,
        };

        const baseGridOptions = <GridOptions>{
            getRowId: (params) => {
                return String(params.data.id);
            },
            rowDragManaged: true,
        };

        const baseColumnDefs = <ColDef[]>[
            { field: 'id', dndSource: true },
            { field: 'color' },
            { field: 'value1' },
            { field: 'value2' },
        ];

        this.leftColumnDefs = [...baseColumnDefs];
        this.rightColumnDefs = [...baseColumnDefs];

        this.leftRowData = this.createRowData();
        this.rightRowData = [];

        this.leftGridOptions = <GridOptions>{
            ...baseGridOptions,
            defaultColDef: {
                ...baseDefaultColDef,
            },
        };

        this.rightGridOptions = <GridOptions>{
            ...baseGridOptions,
            rowData: [],
            defaultColDef: {
                ...baseDefaultColDef,
            },
        };

        this.rowClassRules = {
            'red-row': 'data.color == "Red"',
            'green-row': 'data.color == "Green"',
            'blue-row': 'data.color == "Blue"',
        };
    },

    mounted() {
        this.leftGridApi = <GridApi>this.$refs.leftGrid.api;
        this.rightGridApi = <GridApi>this.$refs.rightGrid.api;
    },

    methods: {
        createRowData() {
            return ['Red', 'Green', 'Blue'].map((color) => this.createDataItem(color));
        },

        createDataItem(color) {
            return {
                id: this.rowIdSequence++,
                color: color,
                value1: Math.floor(Math.random() * 100),
                value2: Math.floor(Math.random() * 100),
            };
        },

        dragStart($event, color) {
            var newItem = this.createDataItem(color);
            var jsonData = JSON.stringify(newItem);

            event.dataTransfer.setData('application/json', jsonData);
        },

        gridDragOver($event) {
            var dragSupported = event.dataTransfer.types.length;

            if (dragSupported) {
                event.dataTransfer.dropEffect = 'copy';
                event.preventDefault();
            }
        },

        gridDrop($event, grid) {
            event.preventDefault();

            var jsonData = event.dataTransfer.getData('application/json');
            var data = JSON.parse(jsonData);

            // if data missing or data has no it, do nothing
            if (!data || data.id == null) {
                return;
            }

            var gridApi = grid == 'left' ? this.leftGridApi : this.rightGridApi;

            // do nothing if row is already in the grid, otherwise we would have duplicates
            var rowAlreadyInGrid = !!gridApi.getRowNode(data.id);
            if (rowAlreadyInGrid) {
                console.log('not adding row to avoid duplicates in the grid');
                return;
            }

            var transaction = {
                add: [data],
            };
            gridApi.applyTransaction(transaction);
        },

        binDragOver($event) {
            var dragSupported = event.dataTransfer.types.length;

            if (dragSupported) {
                event.dataTransfer.dropEffect = 'move';
                event.preventDefault();
            }
        },

        binDrop($event) {
            event.preventDefault();

            var jsonData = event.dataTransfer.getData('application/json');
            var data = JSON.parse(jsonData);

            // if data missing or data has no id, do nothing
            if (!data || data.id == null) {
                return;
            }

            var transaction = {
                remove: [data],
            };

            var rowIsInLeftGrid = !!this.leftGridApi.getRowNode(data.id);
            if (rowIsInLeftGrid) {
                this.leftGridApi.applyTransaction(transaction);
            }

            var rowIsInRightGrid = !!this.rightGridApi.getRowNode(data.id);
            if (rowIsInRightGrid) {
                this.rightGridApi.applyTransaction(transaction);
            }
        },
    },
});

createApp(VueExample).mount('#app');
