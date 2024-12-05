import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
// NOTE: Angular CLI does not support component CSS imports: angular-cli/issues/23273
import type {
    ColDef,
    ColGroupDef,
    GridApi,
    GridReadyEvent,
    ICellRendererParams,
    RowSelectionOptions,
} from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { FiltersToolPanelModule, RowGroupingModule, SetFilterModule } from 'ag-grid-enterprise';

import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, RowGroupingModule, SetFilterModule, FiltersToolPanelModule]);

@Component({
    standalone: true,
    imports: [AgGridAngular, HttpClientModule],
    selector: 'my-app',
    template: `<div class="test-container">
        <div class="test-header">
            <input
                type="text"
                id="filter-text-box"
                style="width: 100px;"
                (input)="onQuickFilterChanged()"
                placeholder="Filter..."
            />

            <span style="padding-left: 20px;">
                <b>Period:</b>
                <button (click)="onChangeMonth(-1)">
                    <i class="fa fa-chevron-left"></i>
                </button>
                <button (click)="onChangeMonth(1)">
                    <i class="fa fa-chevron-right"></i>
                </button>
                <span id="monthName" style="width: 100px; display: inline-block;">Year to Jan</span>
            </span>

            <span style="padding-left: 20px;">
                <b>Legend:</b>&nbsp;&nbsp;
                <div class="cell-bud legend-box"></div>
                Actual&nbsp;&nbsp;
                <div class="cell-act legend-box"></div>
                Budget
            </span>
        </div>
        <ag-grid-angular
            style="width: 100%; height: 100%;"
            [columnDefs]="columnDefs"
            suppressMovableColumns
            [context]="context"
            [defaultColDef]="defaultColDef"
            [autoGroupColumnDef]="autoGroupColumnDef"
            [rowSelection]="rowSelection"
            [rowData]="rowData"
            (gridReady)="onGridReady($event)"
        />
    </div>`,
})
export class AppComponent {
    private gridApi!: GridApi;

    public columnDefs: (ColDef | ColGroupDef)[] = [
        {
            field: 'country',
            rowGroup: true,
            hide: true,
        },
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
    ];
    public context: any = {
        month: 0,
        months: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
    };
    public defaultColDef: ColDef = {
        flex: 1,
        minWidth: 120,
    };
    public autoGroupColumnDef: ColDef = {
        headerName: 'Location',
        field: 'city',
        minWidth: 260,
        cellRenderer: 'agGroupCellRenderer',
    };
    public rowSelection: RowSelectionOptions = {
        mode: 'multiRow',
        headerCheckbox: false,
        groupSelects: 'descendants',
    };
    public rowData!: any[];

    constructor(private http: HttpClient) {}

    onChangeMonth(i: number) {
        let newMonth = (this.context.month += i);
        if (newMonth < -1) {
            newMonth = -1;
        }
        if (newMonth > 5) {
            newMonth = 5;
        }
        // Mutate the context object in place
        this.context.month = newMonth;
        document.querySelector('#monthName')!.textContent = monthNames[newMonth + 1];
        this.gridApi.refreshClientSideRowModel('aggregate');
        this.gridApi.refreshCells();
    }

    onQuickFilterChanged() {
        this.gridApi.setGridOption(
            'quickFilterText',
            (document.getElementById('filter-text-box') as HTMLInputElement).value
        );
    }

    onGridReady(params: GridReadyEvent) {
        this.gridApi = params.api;

        this.http.get<any[]>('https://www.ag-grid.com/example-assets/monthly-sales.json').subscribe((data) => {
            this.rowData = data;
        });
    }
}

const monthValueGetter =
    '(ctx.month < ctx.months.indexOf(colDef.field)) ? data[colDef.field + "_bud"] : data[colDef.field + "_act"]';
const monthCellClassRules = {
    'cell-act': 'ctx.month < ctx.months.indexOf(colDef.field)',
    'cell-bud': 'ctx.month >= ctx.months.indexOf(colDef.field)',
    'cell-negative': 'x < 0',
};
const yearToDateValueGetter =
    'var total = 0; ctx.months.forEach( function(monthName, monthIndex) { if (monthIndex<=ctx.month) { total += data[monthName + "_act"]; } }); return total; ';
const accountingCellRenderer = function (params: ICellRendererParams) {
    if (params.value == null) {
        return '';
    } else if (params.value >= 0) {
        return params.value.toLocaleString();
    } else {
        return '(' + Math.abs(params.value).toLocaleString() + ')';
    }
};
const monthNames = [
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
