import { Component, NgZone } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import type {
    CellClickedEvent,
    CellContextMenuEvent,
    CellDoubleClickedEvent,
    ColDef,
    GridOptions,
    Module,
    NewValueParams,
} from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import { MenuModule } from 'ag-grid-enterprise';

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
    ></ag-grid-angular>`,
})
export class GridWrapperComponent {
    modules: Module[] = [AllCommunityModule, MenuModule];
    rowData: any[] = [{ make: 'Toyota', model: 'Celica', price: 35000 }];
    columnDefs: ColDef[] = [
        {
            field: 'make',
            editable: true,
            onCellClicked: (_event: CellClickedEvent) => {
                this.zoneStatus['cellClicked'] = NgZone.isInAngularZone();
            },
            onCellDoubleClicked: (_event: CellDoubleClickedEvent) => {
                this.zoneStatus['cellDoubleClicked'] = NgZone.isInAngularZone();
            },
            onCellValueChanged: (_event: NewValueParams) => {
                this.zoneStatus['cellValueChanged'] = NgZone.isInAngularZone();
            },
            onCellContextMenu: (_event: CellContextMenuEvent) => {
                this.zoneStatus['cellContextMenu'] = NgZone.isInAngularZone();
            },
        },
        { field: 'model' },
        { field: 'price' },
    ];

    gridOptions: GridOptions = {
        getContextMenuItems: (_params) => {
            return [
                {
                    name: 'Custom Menu Item',
                    action: () => {
                        this.zoneStatus['customMenuItem'] = NgZone.isInAngularZone();
                    },
                },
            ];
        },
    };

    public zoneStatus: { [key: string]: boolean } = {};
}

describe('Test ColDef Event ZoneJs Status', () => {
    // suppress License logging
    let originalError: any;
    beforeAll(() => {
        // eslint-disable-next-line no-console
        originalError = console.error;
        spyOn(console, 'error');
    });
    afterAll(() => {
        // eslint-disable-next-line no-console
        console.error = originalError;
    });

    let fixture: ComponentFixture<GridWrapperComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridWrapperComponent, AgGridAngular],
        }).compileComponents();

        fixture = TestBed.createComponent(GridWrapperComponent);
        fixture.autoDetectChanges();
    });

    it('Test cell is rendered and price updated', async () => {
        const toyotaCell = await fixture.nativeElement.querySelectorAll('.ag-cell')[0];
        expect(toyotaCell).toBeDefined();
        expect(toyotaCell.textContent).toBe('Toyota');
    });

    it('Test cell clicked is run in Zone', async () => {
        const toyota: HTMLDivElement = await fixture.nativeElement.querySelectorAll('.ag-cell')[0];

        toyota.click();
        await fixture.whenStable();

        toyota.dispatchEvent(
            new MouseEvent('dblclick', {
                view: window,
                bubbles: true,
            })
        );
        await fixture.whenStable();

        // Validate cell value changed
        const toyotaEditor: HTMLDivElement = await fixture.nativeElement.querySelectorAll('.ag-cell')[0];
        const input: HTMLInputElement = toyotaEditor.querySelector<'input'>('input')!;

        input.value = 'New Toyota';
        // trigger the value changed
        input.dispatchEvent(new InputEvent('input', { bubbles: true }));
        // close the editor
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await fixture.whenStable();

        const updatedToyotaCell = await fixture.nativeElement.querySelectorAll('.ag-cell')[0];
        expect(updatedToyotaCell.textContent).toBe('New Toyota');

        updatedToyotaCell.dispatchEvent(
            new MouseEvent('contextmenu', {
                view: window,
                bubbles: true,
            })
        );
        await fixture.whenStable();

        const customMenuItem = await fixture.nativeElement.querySelector('.ag-menu-option');
        customMenuItem.click();
        await fixture.whenStable();

        expect(fixture.componentInstance.zoneStatus['cellClicked']).toBeTrue();
        expect(fixture.componentInstance.zoneStatus['cellDoubleClicked']).toBeTrue();
        expect(fixture.componentInstance.zoneStatus['cellValueChanged']).toBeTrue();
        expect(fixture.componentInstance.zoneStatus['cellContextMenu']).toBeTrue();
        expect(fixture.componentInstance.zoneStatus['customMenuItem']).toBeTrue();
    });
});
