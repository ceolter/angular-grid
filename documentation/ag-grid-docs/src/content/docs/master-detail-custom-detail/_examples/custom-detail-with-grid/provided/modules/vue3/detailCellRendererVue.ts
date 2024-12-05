import { AgGridVue } from 'ag-grid-vue3';

export default {
    template: `
      <div class="full-width-panel">
      <div class="full-width-details">
        <div class="full-width-detail"><b>Name: </b>{{ params.data.name }}</div>
        <div class="full-width-detail"><b>Account: </b>{{ params.data.account }}</div>
      </div>
      <ag-grid-vue style="height: 100%;"
                   class="full-width-grid"
                   :gridOptions="gridOptions"
                   :columnDefs="colDefs"
                   :defaultColDef="defaultColDef"
                   :rowData="rowData"
                   @grid-ready="onGridReady">
      </ag-grid-vue>
      </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    data: function () {
        return {
            gridOptions: null,
            colDefs: null,
            rowData: null,
        };
    },
    beforeMount() {
        this.gridOptions = {};
        this.colDefs = [
            { field: 'callId' },
            { field: 'direction' },
            { field: 'number' },
            { field: 'duration', valueFormatter: "x.toLocaleString() + 's'" },
            { field: 'switchCode' },
        ];
        this.defaultColDef = {
            flex: 1,
            minWidth: 120,
        };
    },
    mounted() {
        this.rowData = this.params.data.callRecords;
        this.rowId = this.params.node.id;
        this.masterGridApi = this.params.api;
    },
    beforeDestroy() {
        console.log('removing detail grid info with id: ', this.rowId);
        this.masterGridApi.removeDetailGridInfo(this.rowId);
    },
    methods: {
        onGridReady(params) {
            let gridInfo = {
                id: this.rowId,
                api: params.api,
            };

            console.log('adding detail grid info with id: ', this.rowId);
            this.masterGridApi.addDetailGridInfo(this.rowId, gridInfo);
        },
    },
};
