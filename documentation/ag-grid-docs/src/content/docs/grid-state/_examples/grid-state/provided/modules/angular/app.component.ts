// NOTE: Angular CLI does not support component CSS imports: angular-cli/issues/23273
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import type {
    ColDef,
    GridApi,
    GridOptions,
    GridPreDestroyedEvent,
    GridReadyEvent,
    GridState,
    RowSelectionOptions,
    StateUpdatedEvent,
} from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';
import {
    CellSelectionModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    PivotModule,
    SetFilterModule,
} from 'ag-grid-enterprise';

import type { IOlympicData } from './interfaces';
import './styles.css';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,

    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    SetFilterModule,
    CellSelectionModule,
    PivotModule,
]);

@Component({
    standalone: true,
    imports: [AgGridAngular, HttpClientModule],
    selector: 'my-app',
    template: `
        <div class="example-wrapper">
            <div>
                <span class="button-group">
                    <button (click)="reloadGrid()">Recreate Grid with Current State</button>
                    <button (click)="printState()">Print State</button>
                </span>
            </div>
            @if (gridVisible) {
                <ag-grid-angular
                    style="width: 100%; height: 100%;"
                    [columnDefs]="columnDefs"
                    [defaultColDef]="defaultColDef"
                    [sideBar]="true"
                    [pagination]="true"
                    [rowSelection]="rowSelection"
                    [suppressColumnMoveAnimation]="true"
                    [rowData]="rowData"
                    [initialState]="initialState"
                    [gridOptions]="gridOptions"
                    (stateUpdated)="onStateUpdated($event)"
                    (gridReady)="onGridReady($event)"
                />
            }
        </div>
    `,
})
export class AppComponent {
    private gridApi!: GridApi<IOlympicData>;

    public columnDefs: ColDef[] = [
        { field: 'athlete', minWidth: 150 },
        { field: 'age', maxWidth: 90 },
        { field: 'country', minWidth: 150 },
        { field: 'year', maxWidth: 90 },
        { field: 'date', minWidth: 150 },
        { field: 'sport', minWidth: 150 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ];
    public defaultColDef: ColDef = {
        flex: 1,
        minWidth: 100,
        filter: true,
        enableRowGroup: true,
        enablePivot: true,
        enableValue: true,
    };
    public rowSelection: RowSelectionOptions = {
        mode: 'multiRow',
    };
    public rowData?: IOlympicData[];
    public gridVisible = true;
    public initialState?: GridState;
    public gridOptions: GridOptions = {
        onGridPreDestroyed: (params: GridPreDestroyedEvent<IOlympicData>) => {
            console.log('Grid state on destroy (can be persisted)', params.state);
        },
    };

    constructor(
        private http: HttpClient,
        private cdRef: ChangeDetectorRef
    ) {}

    reloadGrid(): void {
        const state = this.gridApi.getState();
        this.gridVisible = false;
        this.cdRef.detectChanges();
        this.initialState = state;
        this.rowData = undefined;
        setTimeout(() => {
            this.gridVisible = true;
            this.cdRef.detectChanges();
        });
    }

    printState(): void {
        console.log('Grid state', this.gridApi.getState());
    }

    onStateUpdated(params: StateUpdatedEvent<IOlympicData>): void {
        console.log('State updated', params.state);
    }

    onGridReady(params: GridReadyEvent<IOlympicData>): void {
        this.gridApi = params.api;
        this.http
            .get<IOlympicData[]>('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .subscribe((data) => (this.rowData = data));
    }
}
