import type { DebugElement, OnInit } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed, fakeAsync, flush } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import type { ColDef, ModelUpdatedEvent, Module } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

import { AgGridAngular } from '../ag-grid-angular.component';

@Component({
    selector: 'app-grid-wrapper',
    standalone: true,
    imports: [AgGridAngular, FormsModule],
    template: ` <input type="text" id="quickFilter" [(ngModel)]="quickFilterText" />
        <div id="numberOfRows">Number of rows: {{ displayedRows }}</div>
        <ag-grid-angular
            style="width: 100%; height: 100%;"
            class="ag-theme-quartz"
            [columnDefs]="columnDefs"
            [rowData]="rowData"
            [quickFilterText]="quickFilterText"
            (modelUpdated)="onModelUpdated($event)"
            [modules]="modules"
        ></ag-grid-angular>`,
})
export class TestHostComponent implements OnInit {
    modules: Module[] = [AllCommunityModule];

    public quickFilterText: string = '';
    public displayedRows: number = 0;

    onModelUpdated(params: ModelUpdatedEvent) {
        this.displayedRows = params.api.getDisplayedRowCount();
    }

    public columnDefs: ColDef[] = [
        { field: 'name' },
        { headerName: 'Age', field: 'person.age' },
        { headerName: 'Country', field: 'person.country' },
    ];
    public rowData: any[] | null = null;

    ngOnInit(): void {
        this.rowData = getData();
    }

    @ViewChild(AgGridAngular) grid!: AgGridAngular;
}

describe('Quick Filter', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;
    // Get a reference to our quickFilter input
    let quickFilterDE: DebugElement;
    let rowNumberDE: DebugElement;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [TestHostComponent],
        });

        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        const compDebugElement = fixture.debugElement;

        // Get a reference to our quickFilter input and rendered template
        quickFilterDE = compDebugElement.query(By.css('#quickFilter'));
        rowNumberDE = compDebugElement.query(By.css('#numberOfRows'));
    });

    it('should filter rows by quickFilterText using fakeAsync', fakeAsync(() => {
        // When the test starts our test component has been created but not initialised yet.
        // This means our <ag-grid-angular> component has not been created or had data passed to it yet.

        // WARNING: When working with fakeAsync we must ensure our first call to `fixture.detectChanges()` is within our test body and NOT in a beforeEach section!
        // This is vital as it means that during the construction of <ag-grid-component> all async behaviour is correctly patched by fakeAsync
        // If you had a fixture.detectChanges() in your beforeEach then you will find that flush has not impact on your grid async callbacks

        expect(component.grid).toBeUndefined();
        // Our first call to detectChanges, causes the grid to be create and passes the component values to the grid via its Inputs meaning the grid's internal model is setup
        fixture.detectChanges();
        // Grid has now been created
        expect(component.grid.api).toBeDefined();
        // We can test that the internal model of the grid is correct as it has 17 rows
        // However, at this point Grid callbacks have not been run as they are async. i.e our (modelUpdated) Output has not fired
        validateState({ gridRows: 17, displayedRows: 0, templateRows: 0 });

        // To have all the async functions run we flush our fakeAsync test environment. This empties the call stack
        flush();
        // So now our component has its displayedRows property updated as the grid callback has been run
        // However, this has not been reflected in our template yet as change detection has not run.
        validateState({ gridRows: 17, displayedRows: 17, templateRows: 0 });

        // We now run detectChanges which causes our template to update using the latest values in our component
        fixture.detectChanges();
        // We have now reached our first stable state with consistency between the internal grid model, component data and renderer template output
        validateState({ gridRows: 17, displayedRows: 17, templateRows: 17 });

        // Now let's test that updating the filter text input does filter the grid data.
        // Set the filter to United States
        quickFilterDE.nativeElement.value = 'United States';
        quickFilterDE.nativeElement.dispatchEvent(new Event('input'));

        // At this point our text input has been updated but the two way binding [(ngModel)]="quickFilterText" has not been applied
        validateState({ gridRows: 17, displayedRows: 17, templateRows: 17 });

        // We force change detection to run which applies the update to our <ag-grid-angular [quickFilterText] Input.
        fixture.detectChanges();
        // This makes the grid filter its rows, which we can see as now the internal number of rows has been filtered.
        // However, once again, the displayedRows has not been updated yet as the grid schedules callback asynchronously and these are not
        // run until we tell fakeAsync to move forward in time
        validateState({ gridRows: 10, displayedRows: 17, templateRows: 17 });

        // We now flush out all the async callbacks
        flush();
        // Our component event handler has now been run and updated its displayedRows value
        validateState({ gridRows: 10, displayedRows: 10, templateRows: 17 });

        // We now run change detection again so that our template is updated with the latest value from our component
        fixture.detectChanges();
        // We have now reached a stable state and tested that passing a [quickFilterText] to our grid component does correctly filter the rows
        // and update our display correctly with the number of filtered row.
        validateState({ gridRows: 10, displayedRows: 10, templateRows: 10 });
    }));

    it('should filter rows by quickFilterText', fakeAsync(() => {
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        validateState({ gridRows: 17, displayedRows: 17, templateRows: 17 });

        quickFilterDE.nativeElement.value = 'United States';
        quickFilterDE.nativeElement.dispatchEvent(new Event('input'));

        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        validateState({ gridRows: 10, displayedRows: 10, templateRows: 10 });
    }));

    it('should filter rows by quickFilterText (async await)', async () => {
        // When the test starts the component has been created but is not initialised.
        // This means the <ag-grid-angular> component has not been created or had data passed to it.
        // To validate this, test that the grid is undefined at the start of the test.
        expect(component.grid).toBeUndefined();

        // When working with fakeAsync ensure the first call to `fixture.detectChanges()`
        // is within the test body and NOT in a beforeEach section.
        // This is vital as it means that during the construction of <ag-grid-component>
        // all async behaviour is correctly patched.

        // The first call to detectChanges, creates the grid and binds the component values to the grid via its @Inputs.
        fixture.detectChanges();
        // Next validate that the grid has now been created.
        expect(component.grid.api).toBeDefined();

        // Now validate that the internal grid model is correct. It should have 17 rows.
        // However, at this point the asynchronous grid callbacks have not run.
        // i.e the (modelUpdated) @Output has not fired.
        // This is why the internal grid state has 17 rows, but the component and template still have 0 values.
        validateState({ gridRows: 17, displayedRows: 0, templateRows: 0 });

        // Wait for the fixture to be stable which allows all the asynchronous code to run.
        await fixture.whenStable();

        // Now that the fixture is stable validate that the async callback (modelUpdated) has run.
        validateState({ gridRows: 17, displayedRows: 17, templateRows: 0 });

        // Run change detection to update the template based off the new component state
        fixture.detectChanges();

        // The grid is now stable and the template value matches
        validateState({ gridRows: 17, displayedRows: 17, templateRows: 17 });

        // Now update the filter text input.
        // Set the filter value to 'United States' and fire the input event
        // which is required for ngModel to see the change.
        quickFilterDE.nativeElement.value = 'United States';
        quickFilterDE.nativeElement.dispatchEvent(new Event('input'));

        // Force change detection to run to apply the update to the <ag-grid-angular [quickFilterText] Input.
        fixture.detectChanges();

        // The grid filtering is done synchronously so the internal model is already updated.
        validateState({ gridRows: 10, displayedRows: 17, templateRows: 17 });

        // Wait for the asynchronous code to complete
        await fixture.whenStable();

        // The grid callback has now completed updating the component state
        validateState({ gridRows: 10, displayedRows: 10, templateRows: 17 });

        // Run change detection again to update the template.
        fixture.detectChanges();

        // State is now stable and the quick filter has been validated
        validateState({ gridRows: 10, displayedRows: 10, templateRows: 10 });
    });

    it('should filter rows by quickFilterText (async await) shorter', async () => {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        validateState({ gridRows: 17, displayedRows: 17, templateRows: 17 });

        quickFilterDE.nativeElement.value = 'United States';
        quickFilterDE.nativeElement.dispatchEvent(new Event('input'));

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        validateState({ gridRows: 10, displayedRows: 10, templateRows: 10 });
    });

    it('should filter rows by quickFilterText (async await) auto detect', async () => {
        fixture.autoDetectChanges();
        await fixture.whenStable();

        validateState({ gridRows: 17, displayedRows: 17, templateRows: 17 });

        quickFilterDE.nativeElement.value = 'United States';
        quickFilterDE.nativeElement.dispatchEvent(new Event('input'));

        await fixture.whenStable();

        validateState({ gridRows: 10, displayedRows: 10, templateRows: 10 });
    });

    // Helper function to validate our internal grid model, component state and the rendered output in our template
    function validateState({
        gridRows,
        displayedRows,
        templateRows,
    }: {
        gridRows: number;
        displayedRows: number;
        templateRows: number;
    }) {
        expect(component.grid.api).toBeDefined();
        expect(component.grid.api.getDisplayedRowCount()).withContext('api.getDisplayedRowCount').toEqual(gridRows);
        expect(component.displayedRows).withContext('component.displayedRows').toEqual(displayedRows);
        expect(rowNumberDE.nativeElement.innerHTML.trim())
            .withContext('<div> {{displayedRows}} </div>')
            .toContain(templateRows);
    }
});

export function getData(): any[] {
    const rowData = [
        {
            name: 'Michael Phelps',
            person: {
                age: 23,
                country: 'United States',
            },
            medals: {
                gold: 8,
                silver: 0,
                bronze: 0,
            },
        },
        {
            name: 'Michael Phelps',
            person: {
                age: 19,
                country: 'United States',
            },
            medals: {
                gold: 6,
                silver: 0,
                bronze: 2,
            },
        },
        {
            name: 'Michael Phelps',
            person: {
                age: 27,
                country: 'United States',
            },
            medals: {
                gold: 4,
                silver: 2,
                bronze: 0,
            },
        },
        {
            name: 'Natalie Coughlin',
            person: {
                age: 25,
                country: 'United States',
            },
            medals: {
                gold: 1,
                silver: 2,
                bronze: 3,
            },
        },
        {
            name: 'Aleksey Nemov',
            person: {
                age: 24,
                country: 'Russia',
            },
            medals: {
                gold: 2,
                silver: 1,
                bronze: 3,
            },
        },
        {
            name: 'Alicia Coutts',
            person: {
                age: 24,
                country: 'Australia',
            },
            medals: {
                gold: 1,
                silver: 3,
                bronze: 1,
            },
        },
        {
            name: 'Missy Franklin',
            person: {
                age: 17,
                country: 'United States',
            },
            medals: {
                gold: 4,
                silver: 0,
                bronze: 1,
            },
        },
        {
            name: 'Ryan Lochte',
            person: {
                age: 27,
                country: 'United States',
            },
            medals: {
                gold: 2,
                silver: 2,
                bronze: 1,
            },
        },
        {
            name: 'Allison Schmitt',
            person: {
                age: 22,
                country: 'United States',
            },
            medals: {
                gold: 3,
                silver: 1,
                bronze: 1,
            },
        },
        {
            name: 'Natalie Coughlin',
            person: {
                age: 21,
                country: 'United States',
            },
            medals: {
                gold: 2,
                silver: 2,
                bronze: 1,
            },
        },
        {
            name: 'Ian Thorpe',
            person: {
                age: 17,
                country: 'Australia',
            },
            medals: {
                gold: 3,
                silver: 2,
                bronze: 0,
            },
        },
        {
            name: 'Dara Torres',
            person: {
                age: 33,
                country: 'United States',
            },
            medals: {
                gold: 2,
                silver: 0,
                bronze: 3,
            },
        },
        {
            name: 'Cindy Klassen',
            person: {
                age: 26,
                country: 'Canada',
            },
            medals: {
                gold: 1,
                silver: 2,
                bronze: 2,
            },
        },
        {
            name: 'Nastia Liukin',
            person: {
                age: 18,
                country: 'United States',
            },
            medals: {
                gold: 1,
                silver: 3,
                bronze: 1,
            },
        },
        {
            name: 'Marit Bjørgen',
            person: {
                age: 29,
                country: 'Norway',
            },
            medals: {
                gold: 3,
                silver: 1,
                bronze: 1,
            },
        },
        {
            name: 'Sun Yang',
            person: {
                age: 20,
                country: 'China',
            },
            medals: {
                gold: 2,
                silver: 1,
                bronze: 1,
            },
        },
        {
            name: 'Kirsty Coventry',
            person: {
                age: 24,
                country: 'Zimbabwe',
            },
            medals: {
                gold: 1,
                silver: 3,
                bronze: 0,
            },
        },
    ];
    return rowData;
}
