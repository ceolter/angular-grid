import { Component, NgZone, ViewChild } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import type {
    GetRowIdParams,
    GridApi,
    GridOptions,
    GridReadyEvent,
    ICellRendererParams,
    Module,
    RowClassParams,
} from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

import { AgGridAngular } from '../ag-grid-angular.component';
import type { ICellRendererAngularComp } from '../interfaces';

// These tests are run to validate that the grid is running in / out of the Angular Zone as expected
// We need to ensure that custom components are running in the Angular Zone so that change detection
// is triggered correctly.
// We also test that callbacks / events are running correctly out / in of the Angular Zone.

function updateCount(counts: Record<string, boolean>, key: string, isInAngularZone: boolean) {
    counts[key] = isInAngularZone;
}

@Component({
    selector: 'test-comp',
    standalone: true,
    imports: [],
    template: ` {{ getName() }} `,
})
export class TestComponent implements ICellRendererAngularComp {
    // Validate that component variables are running in Zone
    private testInZone = NgZone.isInAngularZone();
    private params!: ICellRendererParams & { getZoneStatus: () => any };

    agInit(params: ICellRendererParams & { getZoneStatus: () => any }): void {
        // Validate that agInit is running inside Zone
        updateCount(params.getZoneStatus(), 'TestComp -> agInit', NgZone.isInAngularZone());
        updateCount(params.getZoneStatus(), 'TestComp -> class variable', this.testInZone);
        this.params = params;
    }

    refresh(params: ICellRendererParams & { getZoneStatus: () => any }) {
        updateCount(params.getZoneStatus(), 'TestComp -> refresh', NgZone.isInAngularZone());
        return false;
    }

    getName() {
        // This validates that the template is running in the correct zone which is important for
        // any other components that are rendered in the template
        updateCount(this.params.getZoneStatus(), 'TestComp -> template1', NgZone.isInAngularZone());
        return 'Test';
    }
}

@Component({
    selector: 'app-grid-wrapper',
    standalone: true,
    imports: [AgGridAngular],
    template: /* HTML */ `<ag-grid-angular
        [gridOptions]="gridOptions"
        [getRowId]="getRowId"
        [rowData]="rowData"
        [columnDefs]="columnDefs"
        [modules]="modules"
        (gridReady)="onGridReady($event)"
    ></ag-grid-angular>`,
})
export class GridWrapperComponent {
    modules: Module[] = [AllCommunityModule];
    rowData: any[] = [{ make: 'Toyota', model: 'Celica', price: 35000 }];
    columnDefs = [
        { field: 'make' },
        { field: 'model' },
        { field: 'price', cellRenderer: TestComponent, cellRendererParams: { getZoneStatus: () => this.zoneStatus } },
    ];

    gridOptions: GridOptions = {
        getRowClass: (_params: RowClassParams) => {
            // Callbacks should run outside of Angular Zone as they are just for configuring the grid
            // and they get called a lot in some cases.
            updateCount(this.zoneStatus, 'gridOptions -> callback', NgZone.isInAngularZone());
            return 'my-class';
        },
        onStateUpdated: () => {
            // Events should run inside Angular Zone as they are triggered by the grid for updating
            // user applications.
            updateCount(this.zoneStatus, 'gridOptions -> event', NgZone.isInAngularZone());
        },
    };

    zoneStatus: any = {};

    // Method will be provided by test case
    setupListeners: (zone: NgZone, api: GridApi, zoneStatus: any) => void = () => {};

    @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

    constructor(private zone: NgZone) {}

    onGridReady(params: GridReadyEvent) {
        // Validate event passed to component is running in Angular Zone
        updateCount(this.zoneStatus, 'component -> event', NgZone.isInAngularZone());

        this.setupListeners(this.zone, params.api, this.zoneStatus);
    }

    getRowId = (params: GetRowIdParams) => {
        // Validate callback passed to component is run outside of Angular Zone
        updateCount(this.zoneStatus, 'component -> callback', NgZone.isInAngularZone());
        return params.data.make;
    };
}

describe('GridWrapperComponent', () => {
    let component: GridWrapperComponent;
    let fixture: ComponentFixture<GridWrapperComponent>;

    beforeAll(() => {
        (window as any).AG_GRID_UNDER_TEST = false;
    });
    afterAll(() => {
        (window as any).AG_GRID_UNDER_TEST = undefined;
    });

    beforeEach(async () => {
        // await TestBed.configureTestingModule({
        //     imports: [GridWrapperComponent, AgGridAngular],
        // }).compileComponents();
    });

    beforeEach(async () => {
        fixture = TestBed.createComponent(GridWrapperComponent);
        component = fixture.componentInstance;
        component.zoneStatus = {};
        fixture.detectChanges();
    });

    it('should run in / out Angular Zone', (done) => {
        // Access AG Grid API and check if the row data is updated
        const api = fixture.componentInstance.agGrid.api;
        expect(api).toBeDefined();
        expect(api.getDisplayedRowCount()).toEqual(1);

        fixture.componentInstance.setupListeners = (zone: NgZone, api: GridApi, zoneStatus: any) => {
            setupTestListeners(zoneStatus, api);
        };

        fixture.detectChanges();

        // We have to use setTimeouts as we have disabled the AG_GRID_UNDER_TEST flag
        setTimeout(() => {
            api.updateGridOptions({ columnDefs: [{ field: 'make' }, { field: 'model' }] });
            fixture.detectChanges();

            setTimeout(() => {
                assertZoneStatuses(component.zoneStatus, {
                    'Column -> eventListener': true,
                    'RowNode -> eventListener': true,
                    'api -> eventListener': true,
                    'api -> globalListener': true,
                    'component -> callback': false,
                    'component -> event': true,
                    'gridOptions -> callback': false,
                    'gridOptions -> event': true,
                    'TestComp -> agInit': true,
                    'TestComp -> class variable': true,
                    'TestComp -> template1': true,
                    'TestComp -> refresh': true,
                });

                done();
            }, 1500);
        }, 1500);
    });

    it('should remove event listeners', (done) => {
        // Access AG Grid API and check if the row data is updated
        const api = fixture.componentInstance.agGrid.api;
        expect(api).toBeDefined();

        const listeners = {
            eventListener: (_event: any) => {},
            globalEventListener: (_event: any) => {},
            rowEventListener: (_event: any) => {},
            columnEventListener: (_event: any) => {},
        };

        const eventListenerSpy = spyOn(listeners, 'eventListener');
        const globalEventListenerSpy = spyOn(listeners, 'globalEventListener');
        const rowEventListenerSpy = spyOn(listeners, 'rowEventListener');
        const columnEventListenerSpy = spyOn(listeners, 'columnEventListener');

        // Test add and remove works
        api.addEventListener('newColumnsLoaded', listeners.eventListener);
        api.removeEventListener('newColumnsLoaded', listeners.eventListener);

        api.addGlobalListener(listeners.globalEventListener);
        api.removeGlobalListener(listeners.globalEventListener);

        api.getRowNode('Toyota')?.addEventListener('dataChanged', listeners.rowEventListener);
        api.getRowNode('Toyota')?.removeEventListener('dataChanged', listeners.rowEventListener);

        api.getColumn('make')?.addEventListener('visibleChanged', listeners.columnEventListener);
        api.getColumn('make')?.removeEventListener('visibleChanged', listeners.columnEventListener);

        api.getRowNode('Toyota')?.setData({ make: 'Toyota', model: 'Celica', price: 40000 });

        api.applyColumnState({
            state: [
                {
                    colId: 'make',
                    hide: true,
                },
            ],
        });

        setTimeout(() => {
            api.updateGridOptions({ columnDefs: [{ field: 'make' }, { field: 'model' }] });
            fixture.detectChanges();

            expect(eventListenerSpy).toHaveBeenCalledTimes(0);
            expect(globalEventListenerSpy).toHaveBeenCalledTimes(0);
            expect(rowEventListenerSpy).toHaveBeenCalledTimes(0);
            expect(columnEventListenerSpy).toHaveBeenCalledTimes(0);

            done();
        }, 100);
    });

    it('should run in / out Angular Zone Setup Outside', (done) => {
        // Access AG Grid API and check if the row data is updated
        const api = fixture.componentInstance.agGrid.api;
        expect(api).toBeDefined();
        expect(api.getDisplayedRowCount()).toEqual(1);

        fixture.componentInstance.setupListeners = (zone: NgZone, api: GridApi, zoneStatus: any) => {
            // For testing purposes, we are going to add listeners to the grid outside of angular
            // This is to enable users to add listeners outside of angular and still have them run outside
            zone.runOutsideAngular(() => {
                setupTestListeners(zoneStatus, api);
            });
        };

        setTimeout(() => {
            api.updateGridOptions({ columnDefs: [{ field: 'make' }, { field: 'model' }] });
            fixture.detectChanges();

            setTimeout(() => {
                assertZoneStatuses(component.zoneStatus, {
                    'Column -> eventListener': false, // Will stay outside
                    'RowNode -> eventListener': false, // Will stay outside
                    'api -> eventListener': false, // Will stay outside
                    'api -> globalListener': false, // Will stay outside
                    'component -> callback': false,
                    'component -> event': true,
                    'gridOptions -> callback': false,
                    'gridOptions -> event': true,
                    'TestComp -> agInit': true,
                    'TestComp -> class variable': true,
                    'TestComp -> template1': true,
                    'TestComp -> refresh': true,
                });

                done();
            }, 1500);
        }, 1500);
    });
});

function assertZoneStatuses(zoneStatus: Record<string, boolean>, expected: Record<string, boolean>) {
    const results = Object.fromEntries(
        Object.entries(zoneStatus).map(([key, value]) => {
            const valueString = JSON.stringify(value);
            return [key, valueString];
        })
    );

    Object.keys(expected).forEach((key) => {
        expect(`${key}: ${results[key]}`).toBe(`${key}: ${expected[key]}`);
    });
    expect(Object.keys(results).sort().join()).toBe(Object.keys(expected).sort().join());
}

function setupTestListeners(zoneStatus: any, api: GridApi<any>) {
    const globalListener = (_event: any) => {
        updateCount(zoneStatus, 'api -> globalListener', NgZone.isInAngularZone());
    };

    const eventListener = (_event: any) => {
        updateCount(zoneStatus, 'api -> eventListener', NgZone.isInAngularZone());
    };

    // Test that api added event listeners are running in the Angular Zone
    // Both global and individual events
    api.addGlobalListener(globalListener);
    api.addEventListener('newColumnsLoaded', eventListener);

    api.getRowNode('Toyota')?.addEventListener('dataChanged', (_event: any) => {
        updateCount(zoneStatus, 'RowNode -> eventListener', NgZone.isInAngularZone());
    });

    api.getColumn('make')?.addEventListener('visibleChanged', (_event: any) => {
        updateCount(zoneStatus, 'Column -> eventListener', NgZone.isInAngularZone());
    });

    api.getRowNode('Toyota')?.setData({ make: 'Toyota', model: 'Celica', price: 40000 });
    api.getRowNode('Toyota')?.setDataValue('price', 40);

    api.applyColumnState({
        state: [
            {
                colId: 'make',
                hide: true,
            },
        ],
    });
}
