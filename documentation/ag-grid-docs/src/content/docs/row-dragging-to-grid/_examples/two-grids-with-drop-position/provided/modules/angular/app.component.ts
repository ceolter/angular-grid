import { Component, ViewChild } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GetRowIdParams, GridApi, GridReadyEvent, RowDropZoneParams } from 'ag-grid-community';
import {
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    RowApiModule,
    RowDragModule,
    RowStyleModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';

import './styles.css';

ModuleRegistry.registerModules([
    RowDragModule,
    ClientSideRowModelApiModule,
    RowApiModule,
    TextFilterModule,
    RowStyleModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);
@Component({
    standalone: true,
    imports: [AgGridAngular],
    selector: 'my-app',
    template: `
        <div class="example-wrapper">
            <div class="inner-col">
                <div class="toolbar">
                    <button
                        class="factory factory-red"
                        data-color="Red"
                        data-side="left"
                        (click)="onFactoryButtonClick($event)"
                    >
                        <i class="far fa-plus-square"></i>Add Red
                    </button>
                    <button
                        class="factory factory-green"
                        data-color="Green"
                        data-side="left"
                        (click)="onFactoryButtonClick($event)"
                    >
                        <i class="far fa-plus-square"></i>Add Green
                    </button>
                    <button
                        class="factory factory-blue"
                        data-color="Blue"
                        data-side="left"
                        (click)="onFactoryButtonClick($event)"
                    >
                        <i class="far fa-plus-square"></i>Add Blue
                    </button>
                </div>
                <div style="height: 100%;" class="inner-col" #eLeftGrid>
                    <ag-grid-angular
                        style="height: 100%;"
                        [defaultColDef]="defaultColDef"
                        [getRowId]="getRowId"
                        [rowClassRules]="rowClassRules"
                        [rowDragManaged]="true"
                        [suppressMoveWhenRowDragging]="true"
                        [rowData]="leftRowData"
                        [columnDefs]="columns"
                        (gridReady)="onGridReady($event, 'Left')"
                    />
                </div>
            </div>

            <div class="inner-col vertical-toolbar">
                <span class="bin" #eBin>
                    <i class="far fa-trash-alt fa-3x" #eBinIcon></i>
                </span>
            </div>

            <div class="inner-col">
                <div class="toolbar">
                    <button
                        class="factory factory-red"
                        data-color="Red"
                        data-side="right"
                        (click)="onFactoryButtonClick($event)"
                    >
                        <i class="far fa-plus-square"></i>Add Red
                    </button>
                    <button
                        class="factory factory-green"
                        data-color="Green"
                        data-side="right"
                        (click)="onFactoryButtonClick($event)"
                    >
                        <i class="far fa-plus-square"></i>Add Green
                    </button>
                    <button
                        class="factory factory-blue"
                        data-color="Blue"
                        data-side="right"
                        (click)="onFactoryButtonClick($event)"
                    >
                        <i class="far fa-plus-square"></i>Add Blue
                    </button>
                </div>
                <div style="height: 100%;" class="inner-col" #eRightGrid>
                    <ag-grid-angular
                        style="height: 100%;"
                        [defaultColDef]="defaultColDef"
                        [getRowId]="getRowId"
                        [rowClassRules]="rowClassRules"
                        [rowDragManaged]="true"
                        [suppressMoveWhenRowDragging]="true"
                        [rowData]="rightRowData"
                        [columnDefs]="columns"
                        (gridReady)="onGridReady($event, 'Right')"
                    />
                </div>
            </div>
        </div>
    `,
})
export class AppComponent {
    leftRowData: any[] = [];
    rightRowData: any[] = [];
    leftApi!: GridApi;
    rightApi!: GridApi;

    rowClassRules = {
        'red-row': 'data.color == "Red"',
        'green-row': 'data.color == "Green"',
        'blue-row': 'data.color == "Blue"',
    };

    defaultColDef: ColDef = {
        flex: 1,
        minWidth: 100,
        filter: true,
    };

    columns: ColDef[] = [{ field: 'id', rowDrag: true }, { field: 'color' }, { field: 'value1' }, { field: 'value2' }];

    @ViewChild('eLeftGrid') eLeftGrid: any;
    @ViewChild('eRightGrid') eRightGrid: any;
    @ViewChild('eBin') eBin: any;
    @ViewChild('eBinIcon') eBinIcon: any;

    constructor() {
        this.leftRowData = createRowBlock(2);
        this.rightRowData = createRowBlock(2);
    }

    getRowId = (params: GetRowIdParams) => {
        return String(params.data.id);
    };

    onGridReady(params: GridReadyEvent, side: string) {
        const api = params.api;
        if (side === 'Left') {
            this.leftApi = api;
        } else {
            this.rightApi = api;
        }

        if (this.leftApi && this.rightApi) {
            this.addBinZone(this.leftApi);
            this.addBinZone(this.rightApi);
            this.addGridDropZone('Left', this.leftApi);
            this.addGridDropZone('Right', this.rightApi);
        }
    }

    addRecordToGrid(side: string, data: any) {
        // if data missing or data has no it, do nothing
        if (!data || data.id == null) {
            return;
        }

        const api = side === 'left' ? this.leftApi : this.rightApi;
        // do nothing if row is already in the grid, otherwise we would have duplicates
        const rowAlreadyInGrid = !!api.getRowNode(data.id);

        if (rowAlreadyInGrid) {
            console.log('not adding row to avoid duplicates in the grid');
            return;
        }

        const transaction = {
            add: [data],
        };

        api.applyTransaction(transaction);
    }

    onFactoryButtonClick(e: any) {
        const button = e.currentTarget,
            buttonColor = button.getAttribute('data-color'),
            side = button.getAttribute('data-side'),
            data = createDataItem(buttonColor);

        this.addRecordToGrid(side, data);
    }

    binDrop(data: any) {
        // if data missing or data has no id, do nothing
        if (!data || data.id == null) {
            return;
        }

        const transaction = {
            remove: [data],
        };

        [this.leftApi, this.rightApi].forEach((api) => {
            const rowsInGrid = !!api.getRowNode(data.id);

            if (rowsInGrid) {
                api.applyTransaction(transaction);
            }
        });
    }

    addBinZone(api: GridApi) {
        const dropZone: RowDropZoneParams = {
            getContainer: () => this.eBinIcon.nativeElement,
            onDragEnter: () => {
                this.eBin.nativeElement.style.color = 'blue';
                this.eBinIcon.nativeElement.style.transform = 'scale(1.5)';
            },
            onDragLeave: () => {
                this.eBin.nativeElement.style = '';
                this.eBinIcon.nativeElement.style.transform = 'scale(1)';
            },
            onDragStop: (params) => {
                this.binDrop(params.node.data);
                this.eBin.nativeElement.style = '';
                this.eBinIcon.nativeElement.style.transform = 'scale(1)';
            },
        };

        api.addRowDropZone(dropZone);
    }

    addGridDropZone(side: string, api: GridApi) {
        const dropApi = side === 'Left' ? this.rightApi : this.leftApi;
        const dropZone = dropApi.getRowDropZoneParams();

        api.addRowDropZone(dropZone!);
    }
}

let rowIdSequence = 100;

function createDataItem(color: string) {
    const obj = {
        id: rowIdSequence++,
        color: color,
        value1: Math.floor(Math.random() * 100),
        value2: Math.floor(Math.random() * 100),
    };

    return obj;
}

const createRowBlock = (blocks: any) =>
    Array.apply(null, Array(blocks || 1))
        .map(() => ['Red', 'Green', 'Blue'].map((color) => createDataItem(color)))
        .reduce((prev, curr) => prev.concat(curr), []);
