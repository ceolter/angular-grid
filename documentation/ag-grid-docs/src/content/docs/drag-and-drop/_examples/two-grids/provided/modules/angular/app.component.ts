import { Component } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
    standalone: true,
    imports: [AgGridAngular],
    selector: 'my-app',
    template: `
        <div class="outer">
            <div
                style="height: 100%;"
                class="inner-col"
                (dragover)="gridDragOver($event)"
                (drop)="gridDrop($event, 'left')"
            >
                <ag-grid-angular
                    style="height: 100%"
                    [gridOptions]="leftGridOptions"
                    [columnDefs]="columnDefs"
                    (gridReady)="onGridReady($event, 'left')"
                >
                </ag-grid-angular>
            </div>

            <div class="inner-col factory-panel">
                <span id="eBin" (dragover)="binDragOver($event)" (drop)="binDrop($event)" class="factory factory-bin">
                    <i class="far fa-trash-alt"><span class="filename"> Trash - </span></i>
                    Drop target to destroy row
                </span>
                <span draggable="true" (dragstart)="dragStart($event, 'Red')" class="factory factory-red">
                    <i class="far fa-plus-square"><span class="filename"> Create - </span></i>
                    Drag source for new red item
                </span>
                <span draggable="true" (dragstart)="dragStart($event, 'Green')" class="factory factory-green">
                    <i class="far fa-plus-square"><span class="filename"> Create - </span></i>
                    Drag source for new green item
                </span>
                <span draggable="true" (dragstart)="dragStart($event, 'Blue')" class="factory factory-blue">
                    <i class="far fa-plus-square"><span class="filename"> Create - </span></i>
                    Drag source for new blue item
                </span>
            </div>

            <div
                style="height: 100%;"
                class="inner-col"
                (dragover)="gridDragOver($event)"
                (drop)="gridDrop($event, 'right')"
            >
                <ag-grid-angular
                    style="height: 100%"
                    [gridOptions]="rightGridOptions"
                    [columnDefs]="columnDefs"
                    (gridReady)="onGridReady($event, 'right')"
                >
                </ag-grid-angular>
            </div>
        </div>
    `,
})
export class AppComponent {
    private leftGridApi!: GridApi;
    private rightGridApi!: GridApi;

    rowIdSequence = 100;

    columnDefs: ColDef[] = [
        { field: 'id', dndSource: true },
        { field: 'color' },
        { field: 'value1' },
        { field: 'value2' },
    ];

    leftGridOptions: GridOptions = {
        defaultColDef: {
            flex: 1,
            filter: true,
        },
        rowClassRules: {
            'red-row': 'data.color == "Red"',
            'green-row': 'data.color == "Green"',
            'blue-row': 'data.color == "Blue"',
        },
        getRowId: (params) => {
            return String(params.data.id);
        },
        rowData: this.createLeftRowData(),
        rowDragManaged: true,
    };

    rightGridOptions: GridOptions = {
        defaultColDef: {
            flex: 1,
            filter: true,
        },
        rowClassRules: {
            'red-row': 'data.color == "Red"',
            'green-row': 'data.color == "Green"',
            'blue-row': 'data.color == "Blue"',
        },
        getRowId: (params) => {
            return String(params.data.id);
        },
        rowData: [],
        rowDragManaged: true,
    };

    createLeftRowData() {
        const data: any[] = [];
        ['Red', 'Green', 'Blue'].forEach((color) => {
            data.push(this.createDataItem(color));
        });
        return data;
    }

    createDataItem(color: string) {
        return {
            id: this.rowIdSequence++,
            color: color,
            value1: Math.floor(Math.random() * 100),
            value2: Math.floor(Math.random() * 100),
        };
    }

    binDragOver(event: any) {
        const dragSupported = event.dataTransfer.types.indexOf('application/json') >= 0;
        if (dragSupported) {
            event.dataTransfer.dropEffect = 'move';
            event.preventDefault();
        }
    }

    binDrop(event: any) {
        event.preventDefault();
        const jsonData = event.dataTransfer.getData('application/json');
        const data = JSON.parse(jsonData);

        // if data missing or data has no id, do nothing
        if (!data || data.id == null) {
            return;
        }

        const transaction = {
            remove: [data],
        };

        const rowIsInLeftGrid = !!this.leftGridApi.getRowNode(data.id);
        if (rowIsInLeftGrid) {
            this.leftGridApi.applyTransaction(transaction);
        }

        const rowIsInRightGrid = !!this.rightGridApi.getRowNode(data.id);
        if (rowIsInRightGrid) {
            this.rightGridApi.applyTransaction(transaction);
        }
    }

    dragStart(event: any, color: string) {
        const newItem = this.createDataItem(color);
        const jsonData = JSON.stringify(newItem);
        event.dataTransfer.setData('application/json', jsonData);
    }

    gridDragOver(event: any) {
        const dragSupported = event.dataTransfer.types.length;

        if (dragSupported) {
            event.dataTransfer.dropEffect = 'copy';
            event.preventDefault();
        }
    }

    gridDrop(event: any, grid: string) {
        event.preventDefault();

        const jsonData = event.dataTransfer.getData('application/json');
        const data = JSON.parse(jsonData);

        // if data missing or data has no it, do nothing
        if (!data || data.id == null) {
            return;
        }

        const gridApi = grid == 'left' ? this.leftGridApi : this.rightGridApi;

        // do nothing if row is already in the grid, otherwise we would have duplicates
        const rowAlreadyInGrid = !!gridApi!.getRowNode(data.id);
        if (rowAlreadyInGrid) {
            console.log('not adding row to avoid duplicates in the grid');
            return;
        }

        const transaction = {
            add: [data],
        };
        gridApi!.applyTransaction(transaction);
    }

    onGridReady(params: GridReadyEvent, grid: 'left' | 'right') {
        if (grid === 'left') {
            this.leftGridApi = params.api;
        } else {
            this.rightGridApi = params.api;
        }
    }
}
