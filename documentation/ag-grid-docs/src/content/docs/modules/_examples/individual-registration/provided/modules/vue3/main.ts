import { createApp, defineComponent } from 'vue';

import type { ColDef } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    CsvExportModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import {
    ClipboardModule,
    ColumnMenuModule,
    ContextMenuModule,
    ExcelExportModule,
    SetFilterModule,
} from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';

import './styles.css';

// Register shared Modules globally
ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

let rowIdSequence = 100;
const createRowBlock = () =>
    ['Red', 'Green', 'Blue'].map((color) => ({
        id: rowIdSequence++,
        color: color,
        value1: Math.floor(Math.random() * 100),
    }));

const VueExample = defineComponent({
    /* html */
    template: `<div class="example-wrapper">

            <div class="inner-col">
                <div style="height: 100%;" class="inner-col">
                    <ag-grid-vue
                        style="height: 100%;"
                        :defaultColDef="defaultColDef"
                        :rowData="leftRowData"
                        :columnDefs="columns"
                        :modules="leftModules"
                        >
                    </ag-grid-vue>
                </div>
            </div>

            <div class="inner-col">
                <div style="height: 100%;" class="inner-col">
                    <ag-grid-vue
                        style="height: 100%;"
                        :defaultColDef="defaultColDef"
                        :rowData="rightRowData"
                        :columnDefs="columns"
                        :modules="rightModules"
                        >
                    </ag-grid-vue>
                </div>
            </div>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    data: function () {
        return {
            leftRowData: [],
            rightRowData: [],
            leftModules: [SetFilterModule, ClipboardModule, CsvExportModule],
            rightModules: [TextFilterModule, NumberFilterModule, CsvExportModule, ExcelExportModule],
            defaultColDef: <ColDef>{
                flex: 1,
                minWidth: 100,
                filter: true,
                floatingFilter: true,
            },
            columns: <ColDef[]>[{ field: 'id' }, { field: 'color' }, { field: 'value1' }],
        };
    },
    beforeMount() {
        this.leftRowData = createRowBlock();
        this.rightRowData = createRowBlock();
    },
});

createApp(VueExample).mount('#app');
