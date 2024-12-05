import { createApp, defineComponent, onBeforeMount, ref, shallowRef } from 'vue';

import type {
    ColDef,
    ColGroupDef,
    GridApi,
    GridReadyEvent,
    ICellRendererParams,
    RowSelectionOptions,
} from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';

import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, RowGroupingModule, SetFilterModule, FiltersToolPanelModule]);

const VueExample = defineComponent({
    template: `
        <div style="height: 100%">
            <div class="test-container">
                <div class="test-header">
                    <input type="text" id="filter-text-box" style="width: 100px;" v-on:input="onQuickFilterChanged()" placeholder="Filter...">
                    <span style="padding-left: 20px;">
                        <b>Period:</b>
                        <button v-on:click="onChangeMonth(-1)"><i class="fa fa-chevron-left"></i></button>
                        <button v-on:click="onChangeMonth(1)"><i class="fa fa-chevron-right"></i></button>
                        <span id="monthName" style="width: 100px; display: inline-block;">Year to Jan</span>
                    </span>
                    <span style="padding-left: 20px;">
                        <b>Legend:</b>&nbsp;&nbsp;
                        <div class="cell-bud legend-box"></div> Actual&nbsp;&nbsp;
                        <div class="cell-act legend-box"></div> Budget
                    </span>
                </div>
                <ag-grid-vue
                
                style="width: 100%; height: 100%;"
                :columnDefs="columnDefs"
                :suppressMovableColumns="true"
                @grid-ready="onGridReady"
                :context="context"
                :defaultColDef="defaultColDef"
                :autoGroupColumnDef="autoGroupColumnDef"
                :rowSelection="rowSelection"
                :rowData="rowData"></ag-grid-vue></div>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    setup(props) {
        const columnDefs = ref<(ColDef | ColGroupDef)[]>([
            { field: 'country', rowGroup: true, hide: true },
            {
                headerName: 'Monthly Data',
                children: [
                    {
                        field: 'jan',
                        cellRenderer: accountingCellRenderer,
                        cellClass: 'cell-figure',
                        valueGetter: monthValueGetter,
                        cellClassRules: monthCellClassRules,
                        aggFunc: 'sum',
                    },
                    {
                        field: 'feb',
                        cellRenderer: accountingCellRenderer,
                        cellClass: 'cell-figure',
                        valueGetter: monthValueGetter,
                        cellClassRules: monthCellClassRules,
                        aggFunc: 'sum',
                    },
                    {
                        field: 'mar',
                        cellRenderer: accountingCellRenderer,
                        cellClass: 'cell-figure',
                        valueGetter: monthValueGetter,
                        cellClassRules: monthCellClassRules,
                        aggFunc: 'sum',
                    },
                    {
                        field: 'apr',
                        cellRenderer: accountingCellRenderer,
                        cellClass: 'cell-figure',
                        valueGetter: monthValueGetter,
                        cellClassRules: monthCellClassRules,
                        aggFunc: 'sum',
                    },
                    {
                        field: 'may',
                        cellRenderer: accountingCellRenderer,
                        cellClass: 'cell-figure',
                        valueGetter: monthValueGetter,
                        cellClassRules: monthCellClassRules,
                        aggFunc: 'sum',
                    },
                    {
                        field: 'jun',
                        cellRenderer: accountingCellRenderer,
                        cellClass: 'cell-figure',
                        valueGetter: monthValueGetter,
                        cellClassRules: monthCellClassRules,
                        aggFunc: 'sum',
                    },
                    {
                        headerName: 'YTD',
                        cellClass: 'cell-figure',
                        cellRenderer: accountingCellRenderer,
                        valueGetter: yearToDateValueGetter,
                        aggFunc: 'sum',
                    },
                ],
            },
        ]);
        const gridApi = shallowRef<GridApi | null>(null);
        const defaultColDef = ref<ColDef>({
            flex: 1,
            minWidth: 120,
        });
        const context = ref(null);
        const autoGroupColumnDef = ref<ColDef>(null);
        const rowData = ref<any[]>(null);
        const rowSelection = ref<RowSelectionOptions>(null);

        onBeforeMount(() => {
            context.value = {
                month: 0,
                months: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
            };
            autoGroupColumnDef.value = {
                headerName: 'Location',
                field: 'city',
                minWidth: 260,
                cellRenderer: 'agGroupCellRenderer',
            };
            rowSelection.value = {
                mode: 'multiRow',
                headerCheckbox: false,
                groupSelects: 'descendants',
            };
        });

        const onChangeMonth = (i) => {
            var newMonth = (context.value.month += i);
            if (newMonth < -1) {
                newMonth = -1;
            }
            if (newMonth > 5) {
                newMonth = 5;
            }
            // Mutate the context object in place
            context.value.month = newMonth;
            document.querySelector('#monthName').textContent = monthNames[newMonth + 1];
            gridApi.value.refreshClientSideRowModel('aggregate');
            gridApi.value.refreshCells();
        };
        const onQuickFilterChanged = () => {
            gridApi.value.setGridOption('quickFilterText', document.getElementById('filter-text-box').value);
        };
        const onGridReady = (params: GridReadyEvent) => {
            gridApi.value = params.api;

            const updateData = (data) => {
                rowData.value = data;
            };

            fetch('https://www.ag-grid.com/example-assets/monthly-sales.json')
                .then((resp) => resp.json())
                .then((data) => updateData(data));
        };

        return {
            columnDefs,
            gridApi,
            context,
            defaultColDef,
            autoGroupColumnDef,
            rowSelection,
            rowData,
            onGridReady,
            onChangeMonth,
            onQuickFilterChanged,
        };
    },
});

var monthValueGetter =
    '(ctx.month < ctx.months.indexOf(colDef.field)) ? data[colDef.field + "_bud"] : data[colDef.field + "_act"]';

var monthCellClassRules = {
    'cell-act': 'ctx.month < ctx.months.indexOf(colDef.field)',
    'cell-bud': 'ctx.month >= ctx.months.indexOf(colDef.field)',
    'cell-negative': 'x < 0',
};

var yearToDateValueGetter =
    'var total = 0; ctx.months.forEach( function(monthName, monthIndex) { if (monthIndex<=ctx.month) { total += data[monthName + "_act"]; } }); return total; ';

var accountingCellRenderer = function (params: ICellRendererParams) {
    if (params.value == null) {
        return '';
    } else if (params.value >= 0) {
        return params.value.toLocaleString();
    } else {
        return '(' + Math.abs(params.value).toLocaleString() + ')';
    }
};

var monthNames = [
    'Budget Only',
    'Year to Jan',
    'Year to Feb',
    'Year to Mar',
    'Year to Apr',
    'Year to May',
    'Year to Jun',
    'Year to Jul',
    'Year to Aug',
    'Year to Sep',
    'Year to Oct',
    'Year to Nov',
    'Full Year',
];

createApp(VueExample).mount('#app');
