import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import type { ColDef, ICellEditorParams, ICellRendererParams, Module } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

import { AgGridAngular } from '../ag-grid-angular.component';
import type { ICellEditorAngularComp, ICellRendererAngularComp } from '../interfaces';

@Component({
    standalone: true,
    template: `£{{ params?.value }}`,
})
export class PoundRenderer implements ICellRendererAngularComp {
    params: ICellRendererParams | undefined;

    agInit(params: ICellRendererParams): void {
        this.params = params;
    }

    refresh(params: ICellRendererParams) {
        this.params = params;
        return true;
    }
}

@Component({
    selector: 'editor-cell',
    standalone: true,
    imports: [FormsModule],
    template: `<input #input [(ngModel)]="value" style="width: 100%" />`,
})
export class EditorComponent implements ICellEditorAngularComp {
    private params!: ICellEditorParams;
    public value!: number;

    @ViewChild('input', { read: ViewContainerRef }) public input!: ViewContainerRef;

    agInit(params: ICellEditorParams): void {
        this.params = params;
        this.value = this.params.value;
    }

    getValue(): any {
        return this.value;
    }

    // for testing
    setValue(newValue: any) {
        this.value = newValue;
    }

    isCancelBeforeStart(): boolean {
        return false;
    }

    isCancelAfterEnd(): boolean {
        return false;
    }
}

@Component({
    selector: 'app-grid-wrapper',
    standalone: true,
    imports: [AgGridAngular],
    template: `<ag-grid-angular [rowData]="rowData" [columnDefs]="columnDefs" [modules]="modules"></ag-grid-angular>`,
})
export class TestHostComponent {
    modules: Module[] = [AllCommunityModule];

    rowData: any[] = [{ name: 'Test Name', number: 42 }];
    columnDefs: ColDef[] = [
        { field: 'name' },
        { field: 'number', colId: 'raw', headerName: 'Raw Number', editable: true, cellEditor: EditorComponent },
        { field: 'number', colId: 'renderer', headerName: 'Renderer Value', cellRenderer: PoundRenderer },
    ];

    @ViewChild(AgGridAngular) public agGrid!: AgGridAngular;
}

describe('Editor Component', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
    });

    it('ViewChild not available until `detectChanges`', () => {
        expect(component.agGrid).not.toBeTruthy();
    });

    it('ViewChild is available after `detectChanges`', async () => {
        // Detect changes triggers the AgGridAngular lifecycle hooks
        fixture.detectChanges();
        // Wait for the fixture to stabilise
        await fixture.whenStable();

        expect(component.agGrid.api).toBeTruthy();
    });

    it('cell should be editable and editor component usable', async () => {
        fixture.autoDetectChanges();
        await fixture.whenStable();

        // we use the API to start and stop editing - in a real e2e test we could actually double click on the cell etc
        component.agGrid.api.startEditingCell({
            rowIndex: 0,
            colKey: 'raw',
        });

        const instances = component.agGrid.api.getCellEditorInstances();
        expect(instances.length).toEqual(1);

        const editorComponent = instances[0] as EditorComponent;
        editorComponent.setValue(100);

        component.agGrid.api.stopEditing();
        await fixture.whenStable();

        const cellElements = fixture.nativeElement.querySelectorAll('.ag-cell-value');
        expect(cellElements.length).toEqual(3);

        expect(cellElements[0].textContent).toEqual('Test Name');
        expect(cellElements[1].textContent).toEqual('100');
        expect(cellElements[2].textContent).toEqual('£100');
    });
});
