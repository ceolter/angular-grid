import { createApp, defineComponent } from 'vue';

import type { ColDef, ColGroupDef, GridOptions } from 'ag-grid-community';
import {
    AlignedGridsModule,
    ClientSideRowModelModule,
    ColumnAutoSizeModule,
    ModuleRegistry,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

ModuleRegistry.registerModules([
    TextFilterModule,
    ColumnAutoSizeModule,
    AlignedGridsModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const VueExample = defineComponent({
    template: `
        <div style="height: 100%">
            <ag-grid-vue
                style="width: 100%; height: 45%;"
                ref="topGrid"
                :gridOptions="topOptions"
                :columnDefs="columnDefs"
                :rowData="rowData">
            </ag-grid-vue>
            <div style='height: 5%'></div>
            <ag-grid-vue
                style="width: 100%; height: 45%;"
                ref="bottomGrid"
                :gridOptions="bottomOptions"
                :columnDefs="columnDefs"
                :rowData="rowData">
            </ag-grid-vue>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    data: function () {
        return {
            topOptions: <GridOptions>{
                alignedGrids: () => [this.$refs.bottomGrid],
                defaultColDef: {
                    filter: true,
                    flex: 1,
                    minWidth: 120,
                },
                autoSizeStrategy: {
                    type: 'fitGridWidth',
                },
            },
            bottomOptions: <GridOptions>{
                alignedGrids: () => [this.$refs.topGrid],
                defaultColDef: {
                    filter: true,
                    flex: 1,
                    minWidth: 120,
                },
            },
            topGridApi: null,
            columnDefs: <(ColDef | ColGroupDef)[]>[
                {
                    headerName: 'Group 1',
                    groupId: 'Group1',
                    children: [
                        { field: 'athlete', pinned: true },
                        { field: 'age', pinned: true, columnGroupShow: 'open' },
                        { field: 'country' },
                        { field: 'year', columnGroupShow: 'open' },
                        { field: 'date' },
                        { field: 'sport', columnGroupShow: 'open' },
                    ],
                },
                {
                    headerName: 'Group 2',
                    groupId: 'Group2',
                    children: [
                        { field: 'athlete', pinned: true },
                        { field: 'age', pinned: true, columnGroupShow: 'open' },
                        { field: 'country' },
                        { field: 'year', columnGroupShow: 'open' },
                        { field: 'date' },
                        { field: 'sport', columnGroupShow: 'open' },
                    ],
                },
            ],

            rowData: null,
        };
    },
    mounted() {
        this.topGridApi = this.$refs.topGrid.api;

        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((rowData) => {
                this.rowData = rowData;

                // mix up some columns
                this.topGridApi.moveColumnByIndex(11, 4);
                this.topGridApi.moveColumnByIndex(11, 4);
            });
    },
});

createApp(VueExample).mount('#app');
