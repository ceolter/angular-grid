// NOTE: Angular CLI does not support component CSS imports: angular-cli/issues/23273
import { Component } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { getData } from './data';
import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

@Component({
    standalone: true,
    imports: [AgGridAngular],
    selector: 'my-app',
    template: `
        <div class="test-container">
            <div class="test-header">
                <div style="margin-bottom: 1rem;">
                    <input type="checkbox" id="pinFirstColumnOnLoad" />
                    <label for="pinFirstColumnOnLoad">Pin first column on load</label>
                </div>
                <div style="margin-bottom: 1rem;">
                    <button id="reloadGridButton" (click)="reloadGrid()">Reload Grid</button>
                </div>
            </div>
            @if (isVisible) {
                <ag-grid-angular
                    style="width: 100%; height: 100%;"
                    [columnDefs]="columnDefs"
                    [rowData]="rowData"
                    (gridReady)="onGridReady($event)"
                />
            }
        </div>
    `,
})
export class AppComponent {
    public isVisible = true;
    private gridApi!: GridApi;
    public columnDefs: ColDef[] = [
        { field: 'name', headerName: 'Athlete', width: 250 },
        { field: 'person.country', headerName: 'Country' },
        { field: 'person.age', headerName: 'Age' },
        { field: 'medals.gold', headerName: 'Gold Medals' },
        { field: 'medals.silver', headerName: 'Silver Medals' },
        { field: 'medals.bronze', headerName: 'Bronze Medals' },
    ];

    public rowData: any[] | null = getData();

    reloadGrid() {
        this.isVisible = false;
        setTimeout(() => (this.isVisible = true), 1);
    }

    onGridReady(params: GridReadyEvent) {
        this.gridApi = params.api;
        const checkbox = document.querySelector<HTMLInputElement>('#pinFirstColumnOnLoad')!;
        const shouldPinFirstColumn = checkbox && checkbox.checked;
        if (shouldPinFirstColumn) {
            params.api.applyColumnState({
                state: [{ colId: 'name', pinned: 'left' }],
            });
        }
    }
}
