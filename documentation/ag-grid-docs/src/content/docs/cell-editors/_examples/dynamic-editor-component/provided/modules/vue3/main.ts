import { createApp, defineComponent } from 'vue';

import type {
    CellEditingStartedEvent,
    CellEditingStoppedEvent,
    ColDef,
    ICellEditorParams,
    RowEditingStartedEvent,
    RowEditingStoppedEvent,
} from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    TextEditorModule,
    ValidationModule,
} from 'ag-grid-community';
import { ColumnMenuModule, ColumnsToolPanelModule, ContextMenuModule, RichSelectModule } from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';

import { getData } from './data.ts';
import MoodEditor from './moodEditorVue.ts';
import NumericCellEditor from './numericCellEditorVue.ts';
import './styles.css';

ModuleRegistry.registerModules([
    NumberEditorModule,
    TextEditorModule,
    ClientSideRowModelModule,
    ColumnMenuModule,
    ContextMenuModule,
    ColumnsToolPanelModule,
    RichSelectModule,
    ValidationModule /* Development Only */,
]);

const VueExample = defineComponent({
    template: `
        <div style="height: 100%">
            <ag-grid-vue
                    style="width: 100%; height: 100%;"
                    id="myGrid"
                    :columnDefs="columnDefs"
                    :defaultColDef="defaultColDef"
                    :rowData="rowData"                    
                    @row-editing-started="onRowEditingStarted"
                    @row-editing-stopped="onRowEditingStopped"
                    @cell-editing-started="onCellEditingStarted"
                    @cell-editing-stopped="onCellEditingStopped"></ag-grid-vue>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
        MoodEditor,
        NumericCellEditor,
    },
    data: function () {
        return {
            columnDefs: <ColDef[]>[
                {
                    field: 'type',
                },
                {
                    field: 'value',
                    editable: true,
                    cellEditorSelector: (params: ICellEditorParams) => {
                        if (params.data.type === 'age') {
                            return {
                                component: 'NumericCellEditor',
                            };
                        }
                        if (params.data.type === 'gender') {
                            return {
                                component: 'agRichSelectCellEditor',
                                params: {
                                    values: ['Male', 'Female'],
                                },
                            };
                        }
                        if (params.data.type === 'mood') {
                            return {
                                component: 'MoodEditor',
                                popup: true,
                                popupPosition: 'under',
                            };
                        }
                        return undefined;
                    },
                },
            ],
            defaultColDef: <ColDef>{
                flex: 1,
                cellDataType: false,
            },
            rowData: null,
        };
    },
    created() {
        this.rowData = getData();
    },
    methods: {
        onRowEditingStarted(event: RowEditingStartedEvent) {
            console.log('never called - not doing row editing');
        },
        onRowEditingStopped(event: RowEditingStoppedEvent) {
            console.log('never called - not doing row editing');
        },
        onCellEditingStarted(event: CellEditingStartedEvent) {
            console.log('cellEditingStarted');
        },
        onCellEditingStopped(event: CellEditingStoppedEvent) {
            console.log('cellEditingStopped');
        },
    },
});

createApp(VueExample).mount('#app');
