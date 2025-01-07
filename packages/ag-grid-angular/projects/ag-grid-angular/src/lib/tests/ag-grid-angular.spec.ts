import { Component, ViewChild } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { AllCommunityModule } from 'ag-grid-community';
import type { GridApi, GridOptions, GridReadyEvent, Module } from 'ag-grid-community';

import { AgGridAngular } from '../ag-grid-angular.component';

@Component({
    selector: 'app-grid-wrapper',
    standalone: true,
    imports: [AgGridAngular],
    template: `<ag-grid-angular
        [gridOptions]="gridOptions"
        [columnDefs]="columnDefs"
        [rowData]="rowData"
        [modules]="modules"
        (gridReady)="onGridReady($event)"
        (firstDataRendered)="onFirstDataRendered()"
    />`,
})
export class GridWrapperComponent {
    modules: Module[] = [AllCommunityModule];
    rowData: any[] | null = null;
    columnDefs = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];

    gridOptions: GridOptions = {};
    gridApi: GridApi;

    @ViewChild(AgGridAngular) agGrid: AgGridAngular;

    onGridReady(params: GridReadyEvent) {
        this.gridApi = params.api;
        this.rowData = [{ make: 'Toyota', model: 'Celica', price: 35000 }];
    }
    onFirstDataRendered() {}
}

describe('Grid OnReady', () => {
    let component: GridWrapperComponent;
    let fixture: ComponentFixture<GridWrapperComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridWrapperComponent, AgGridAngular],
        }).compileComponents();

        fixture = TestBed.createComponent(GridWrapperComponent);
        component = fixture.componentInstance;
    });

    it('gridReady is completed by the time a timeout finishes', async () => {
        fixture.autoDetectChanges();
        const promise = new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 0);
        });
        await promise.then(() => {});

        expect(component.gridApi).toBeDefined();
    });

    it('Grid Ready run Auto', async () => {
        spyOn(component, 'onGridReady').and.callThrough();
        spyOn(component, 'onFirstDataRendered').and.callThrough();
        // Setup spies before the grid is created
        fixture.autoDetectChanges();
        await fixture.whenStable();

        expect(component.gridApi).toBeDefined();

        expect(component.onGridReady).toHaveBeenCalled();
        expect(component.onFirstDataRendered).toHaveBeenCalled();
    });

    it('Grid Ready run Auto set via api', async () => {
        spyOn(component, 'onFirstDataRendered').and.callThrough();
        spyOn(component, 'onGridReady').and.callFake((params: GridReadyEvent) => {
            params.api.setGridOption('rowData', [{ make: 'Toyota', model: 'Celica', price: 35000 }]);
        });
        // Setup spies before the grid is created
        fixture.autoDetectChanges();
        await fixture.whenStable();

        expect(component.onGridReady).toHaveBeenCalled();
        expect(component.onFirstDataRendered).toHaveBeenCalled();
    });
});
