import { createApp } from 'vue';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const SportRenderer = {
    template: `<i class="far fa-trash-alt" style="cursor: pointer" @click="applyTransaction()"></i>`,
    methods: {
        applyTransaction() {
            this.params.api.applyTransaction({ remove: [this.params.node.data] });
        },
    },
};

const VueExample = {
    template: /* html */ `
        <div class="top-container">
            <div class="example-toolbar panel panel-default">
                <div class="panel-body">
                    <input type="radio" id="move" name="radio" checked ref="eMoveRadio">
                    <label for="move">Remove Source Rows</label>
                    <input type="radio" id="deselect" name="radio" ref="eDeselectRadio">
                    <label for="deselect">Only Deselect Source Rows</label>
                    <input type="radio" id="none" name="radio">
                    <label for="none">None</label>
                    <span class="input-group-button">
                        <button type="button" class="btn btn-default reset" style="margin-left: 5px;" @click="reset()">
                            <i class="fas fa-redo" style="margin-right: 5px;"></i>Reset
                        </button>
                    </span>
                </div>
            </div>
            <div class="grid-wrapper">
                <div class="panel panel-primary" style="margin-right: 10px;">
                    <div class="panel-heading">Athletes</div>
                    <div class="panel-body">
                        <ag-grid-vue
                                style="height: 100%;"
                                :defaultColDef="defaultColDef"
                                :rowSelection="rowSelection"
                                :rowDragMultiRow="true"
                                :getRowId="getRowId"
                                :rowDragManaged="true"
                                :suppressMoveWhenRowDragging="true"
                                :rowData="leftRowData"
                                :columnDefs="leftColumns"
                                @grid-ready="onGridReady($event, 0)"
                                >
                        </ag-grid-vue>
                    </div>
                </div>
                <div class="panel panel-primary" style="margin-left: 10px;">
                    <div class="panel-heading">Selected Athletes</div>
                    <div class="panel-body">
                        <ag-grid-vue
                                style="height: 100%;"
                                :defaultColDef="defaultColDef"
                                :getRowId="getRowId"
                                :rowDragManaged="true"
                                :rowData="rightRowData"
                                :columnDefs="rightColumns"
                                @grid-ready="onGridReady($event, 1)"
                                >
                        </ag-grid-vue>
                    </div>
                </div>
            </div>
        </div>`,
    components: {
        'ag-grid-vue': AgGridVue,
        SportRenderer,
    },
    data: function () {
        return {
            leftRowData: null,
            rightRowData: [],
            leftApi: null,
            rightApi: null,

            defaultColDef: {
                flex: 1,
                minWidth: 100,
                filter: true,
            },
            rowSelection: {
                mode: 'multiRow',
            },
            leftColumns: [
                {
                    rowDrag: true,
                    maxWidth: 50,
                    suppressHeaderMenuButton: true,
                    suppressHeaderFilterButton: true,
                    rowDragText: (params, dragItemCount) => {
                        if (dragItemCount > 1) {
                            return dragItemCount + ' athletes';
                        }
                        return params.rowNode.data.athlete;
                    },
                },
                { field: 'athlete' },
                { field: 'sport' },
            ],
            rightColumns: [
                {
                    rowDrag: true,
                    maxWidth: 50,
                    suppressHeaderMenuButton: true,
                    suppressHeaderFilterButton: true,
                    rowDragText: (params, dragItemCount) => {
                        if (dragItemCount > 1) {
                            return dragItemCount + ' athletes';
                        }
                        return params.rowNode.data.athlete;
                    },
                },
                { field: 'athlete' },
                { field: 'sport' },
                {
                    suppressHeaderMenuButton: true,
                    suppressHeaderFilterButton: true,
                    maxWidth: 50,
                    cellRenderer: 'SportRenderer',
                },
            ],
        };
    },
    beforeMount() {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => {
                const athletes = [];
                let i = 0;

                while (athletes.length < 20 && i < data.length) {
                    var pos = i++;
                    if (athletes.some((rec) => rec.athlete === data[pos].athlete)) {
                        continue;
                    }
                    athletes.push(data[pos]);
                }
                this.rawData = athletes;
                this.loadGrids();
            });
    },
    methods: {
        getRowId(params) {
            return params.data.athlete;
        },

        loadGrids() {
            this.leftRowData = [...this.rawData];
            this.rightRowData = [];
        },

        reset() {
            this.$refs.eMoveRadio.checked = true;

            this.loadGrids();
        },

        onGridReady(params, side) {
            if (side === 0) {
                this.leftApi = params.api;
            }

            if (side === 1) {
                this.rightApi = params.api;
                this.addGridDropZone();
            }
        },

        addGridDropZone() {
            const dropZoneParams = this.rightApi.getRowDropZoneParams({
                onDragStop: (params) => {
                    var deselectCheck = this.$refs.eDeselectRadio.checked;
                    var moveCheck = this.$refs.eMoveRadio.checked;
                    var nodes = params.nodes;

                    if (moveCheck) {
                        this.leftApi.applyTransaction({
                            remove: nodes.map(function (node) {
                                return node.data;
                            }),
                        });
                    } else if (deselectCheck) {
                        this.leftApi.setNodesSelected({ nodes, newValue: false });
                    }
                },
            });

            this.leftApi.addRowDropZone(dropZoneParams);
        },
    },
};

createApp(VueExample).mount('#app');
