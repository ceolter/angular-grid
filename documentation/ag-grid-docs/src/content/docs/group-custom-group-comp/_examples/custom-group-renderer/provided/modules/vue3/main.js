import { createApp } from 'vue';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';

import CustomGroupCellRenderer from './customGroupCellRendererVue.js';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RowGroupingModule]);

const VueExample = {
    template: `
        <div style="height: 100%">
                <ag-grid-vue
                
                style="width: 100%; height: 100%;"
                :columnDefs="columnDefs"
                @grid-ready="onGridReady"
                @cell-double-clicked="onCellDoubleClicked"
                @cell-key-down="onCellKeyDown"
                :autoGroupColumnDef="autoGroupColumnDef"
                :defaultColDef="defaultColDef"
                :groupDefaultExpanded="groupDefaultExpanded"
                :rowData="rowData"></ag-grid-vue>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
        CustomGroupCellRenderer,
    },
    data: function () {
        return {
            columnDefs: [
                { field: 'country', rowGroup: true, hide: true },
                { field: 'year', rowGroup: true, hide: true },
                { field: 'athlete' },
                { field: 'total', aggFunc: 'sum' },
            ],
            gridApi: null,
            defaultColDef: {
                flex: 1,
                minWidth: 120,
            },
            autoGroupColumnDef: null,
            groupDefaultExpanded: null,
            rowData: null,
        };
    },
    created() {
        this.autoGroupColumnDef = {
            cellRenderer: 'CustomGroupCellRenderer',
        };
        this.groupDefaultExpanded = 1;
    },
    methods: {
        onGridReady(params) {
            this.gridApi = params.api;

            const updateData = (data) => params.api.setGridOption('rowData', data);

            fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
                .then((resp) => resp.json())
                .then((data) => updateData(data));
        },
        onCellDoubleClicked: (params) => {
            if (params.colDef.showRowGroup) {
                params.node.setExpanded(!params.node.expanded);
            }
        },
        onCellKeyDown: (params) => {
            if (!('colDef' in params)) {
                return;
            }
            if (!(params.event instanceof KeyboardEvent)) {
                return;
            }
            if (params.event.code !== 'Enter') {
                return;
            }
            if (params.colDef.showRowGroup) {
                params.node.setExpanded(!params.node.expanded);
            }
        },
    },
};

createApp(VueExample).mount('#app');
