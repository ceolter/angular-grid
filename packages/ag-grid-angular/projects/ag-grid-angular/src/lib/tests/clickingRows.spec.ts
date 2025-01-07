import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import type { ColDef, GridOptions } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';

import { AgGridAngular } from '../ag-grid-angular.component';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

@Component({
    selector: 'app-grid-wrapper',
    standalone: true,
    imports: [AgGridAngular],
    template: `<div data-testid="rowClicked">Row Clicked: {{ rowClicked?.make }}</div>
        <ag-grid-angular [gridOptions]="gridOptions" [columnDefs]="columnDefs" [rowData]="rowData"> </ag-grid-angular>`,
})
export class GridWrapperComponent {
    rowData: any[] = [
        { make: 'Toyota', model: 'Celica', price: 35000 },
        { make: 'Ford', model: 'Mondeo', price: 32000 },
        { make: 'Porsche', model: 'Boxster', price: 72000 },
    ];
    columnDefs: ColDef[] = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];
    rowClicked: any;

    gridOptions: GridOptions = {
        onRowClicked: (params) => {
            this.rowClicked = params.data;
        },
    };
}

describe('Test Row Clicked', () => {
    let fixture: ComponentFixture<GridWrapperComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridWrapperComponent, AgGridAngular],
        }).compileComponents();

        fixture = TestBed.createComponent(GridWrapperComponent);
        fixture.autoDetectChanges();
    });

    it('Test cell clicked run row handler', async () => {
        const row = await fixture.nativeElement.querySelectorAll('.ag-row')[1];
        row.click();

        await fixture.whenStable(); // wait for the click handler to run

        expect(fixture.nativeElement.querySelector('[data-testid="rowClicked"]').textContent).toBe('Row Clicked: Ford');
    });
});
