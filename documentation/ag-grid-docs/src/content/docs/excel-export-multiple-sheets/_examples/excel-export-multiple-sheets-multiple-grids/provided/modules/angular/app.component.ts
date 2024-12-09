import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';

import type { ICellRendererAngularComp } from 'ag-grid-angular';
import { AgGridAngular } from 'ag-grid-angular';
import type {
    ColDef,
    GetRowIdParams,
    GridApi,
    GridReadyEvent,
    ICellRendererParams,
    RowSelectionOptions,
} from 'ag-grid-community';
import {
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    RowDragModule,
    RowSelectionModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import {
    ColumnMenuModule,
    ContextMenuModule,
    ExcelExportModule,
    exportMultipleSheetsAsExcel,
} from 'ag-grid-enterprise';

import './styles.css';

ModuleRegistry.registerModules([
    RowDragModule,
    ClientSideRowModelApiModule,
    TextFilterModule,
    RowSelectionModule,
    ClientSideRowModelModule,
    ExcelExportModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

@Component({
    standalone: true,
    template: ` <i class="far fa-trash-alt" style="cursor: pointer" (click)="applyTransaction()"></i> `,
})
export class SportRenderer implements ICellRendererAngularComp {
    private params!: ICellRendererParams;
    private value!: string;

    agInit(params: ICellRendererParams): void {
        this.params = params;
    }

    applyTransaction() {
        this.params.api.applyTransaction({ remove: [this.params.node.data] });
    }

    refresh() {
        return false;
    }
}

@Component({
    standalone: true,
    imports: [AgGridAngular, HttpClientModule],
    selector: 'my-app',
    template: ` <div class="top-container">
        <div>
            <button type="button" class="btn btn-default excel" style="margin-right: 5px;" (click)="onExcelExport()">
                <i class="far fa-file-excel" style="margin-right: 5px; color: green;"></i>Export to Excel
            </button>
            <button type="button" class="btn btn-default reset" (click)="reset()">
                <i class="fas fa-redo" style="margin-right: 5px;"></i>Reset
            </button>
        </div>
        <div class="grid-wrapper">
            <div class="panel panel-primary" style="margin-right: 10px;">
                <div class="panel-heading">Athletes</div>
                <div class="panel-body">
                    <div id="eLeftGrid">
                        <ag-grid-angular
                            style="height: 100%;"
                            [defaultColDef]="defaultColDef"
                            [rowSelection]="rowSelection"
                            [rowDragMultiRow]="true"
                            [getRowId]="getRowId"
                            [rowDragManaged]="true"
                            [suppressMoveWhenRowDragging]="true"
                            [rowData]="leftRowData"
                            [columnDefs]="leftColumns"
                            (gridReady)="onGridReady($event, 0)"
                        />
                    </div>
                </div>
            </div>
            <div class="panel panel-primary" style="margin-left: 10px;">
                <div class="panel-heading">Selected Athletes</div>
                <div class="panel-body">
                    <div id="eRightGrid">
                        <ag-grid-angular
                            style="height: 100%;"
                            [defaultColDef]="defaultColDef"
                            [getRowId]="getRowId"
                            [rowDragManaged]="true"
                            [rowData]="rightRowData"
                            [columnDefs]="rightColumns"
                            (gridReady)="onGridReady($event, 1)"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>`,
})
export class AppComponent {
    rawData: any[] = [];
    leftRowData: any[] = [];
    rightRowData: any[] = [];
    leftApi!: GridApi;
    rightApi!: GridApi;

    defaultColDef: ColDef = {
        flex: 1,
        minWidth: 100,
        filter: true,
    };

    rowSelection: RowSelectionOptions = {
        mode: 'multiRow',
    };

    leftColumns: ColDef[] = [
        {
            rowDrag: true,
            maxWidth: 50,
            suppressHeaderMenuButton: true,
            suppressHeaderFilterButton: true,
            rowDragText: (params, dragItemCount) => {
                if (dragItemCount > 1) {
                    return dragItemCount + ' athletes';
                }
                return params.rowNode!.data.athlete;
            },
        },
        { field: 'athlete' },
        { field: 'sport' },
    ];

    rightColumns: ColDef[] = [
        {
            rowDrag: true,
            maxWidth: 50,
            suppressHeaderMenuButton: true,
            suppressHeaderFilterButton: true,
            rowDragText: (params, dragItemCount) => {
                if (dragItemCount > 1) {
                    return dragItemCount + ' athletes';
                }
                return params.rowNode!.data.athlete;
            },
        },
        { field: 'athlete' },
        { field: 'sport' },
        {
            suppressHeaderMenuButton: true,
            suppressHeaderFilterButton: true,
            maxWidth: 50,
            cellRenderer: SportRenderer,
        },
    ];

    @ViewChild('eLeftGrid') eLeftGrid: any;
    @ViewChild('eRightGrid') eRightGrid: any;

    constructor(private http: HttpClient) {
        this.http.get('https://www.ag-grid.com/example-assets/olympic-winners.json').subscribe((data) => {
            const athletes: any[] = [];
            let i = 0;
            const dataArray = data as any[];
            while (athletes.length < 20 && i < dataArray.length) {
                var pos = i++;
                if (athletes.some((rec) => rec.athlete === dataArray[pos].athlete)) {
                    continue;
                }
                athletes.push(dataArray[pos]);
            }
            this.rawData = athletes;
            this.loadGrids();
        });
    }

    loadGrids = () => {
        this.leftRowData = [...this.rawData.slice(0, this.rawData.length / 2)];
        this.rightRowData = [...this.rawData.slice(this.rawData.length / 2)];
    };

    reset = () => {
        this.loadGrids();
    };

    getRowId = (params: GetRowIdParams) => params.data.athlete;

    onGridReady(params: GridReadyEvent, side: number) {
        if (side === 0) {
            this.leftApi = params.api;
        }

        if (side === 1) {
            this.rightApi = params.api;
            this.addGridDropZone();
        }
    }

    addGridDropZone() {
        const dropZoneParams = this.rightApi.getRowDropZoneParams({
            onDragStop: (params) => {
                const nodes = params.nodes;

                this.leftApi.applyTransaction({
                    remove: nodes.map(function (node) {
                        return node.data;
                    }),
                });
            },
        });

        this.leftApi.addRowDropZone(dropZoneParams);
    }

    onExcelExport() {
        const spreadsheets = [];

        spreadsheets.push(
            this.leftApi.getSheetDataForExcel({ sheetName: 'Athletes' })!,
            this.rightApi.getSheetDataForExcel({ sheetName: 'Selected Athletes' })!
        );

        exportMultipleSheetsAsExcel({
            data: spreadsheets,
            fileName: 'ag-grid.xlsx',
        });
    }
}
