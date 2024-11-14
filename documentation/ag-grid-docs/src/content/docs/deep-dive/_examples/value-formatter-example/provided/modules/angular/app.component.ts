import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridReadyEvent, ValueFormatterParams } from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

// Row Data Interface
interface IRow {
    mission: string;
    company: string;
    location: string;
    date: string;
    time: string;
    rocket: string;
    price: number;
    successful: boolean;
}

@Component({
    standalone: true,
    imports: [AgGridAngular, HttpClientModule],
    selector: 'my-app',
    template: `
        <div class="content">
            <!-- The AG Grid component, with Dimensions, CSS Theme, Row Data, and Column Definition -->
            <ag-grid-angular
                style="width: 100%; height: 550px;"
                [rowData]="rowData"
                [columnDefs]="colDefs"
                [defaultColDef]="defaultColDef"
                (gridReady)="onGridReady($event)"
                [pagination]="true"
            />
        </div>
    `,
})
export class AppComponent {
    // Row Data: The data to be displayed.
    rowData: IRow[] = [];

    // Column Definitions: Defines & controls grid columns.
    colDefs: ColDef[] = [
        {
            field: 'mission',
            filter: true,
        },
        { field: 'company' },
        { field: 'location' },
        { field: 'date' },
        {
            field: 'price',
            valueFormatter: (params: ValueFormatterParams) => {
                return '£' + params.value.toLocaleString();
            },
        },
        { field: 'successful' },
        { field: 'rocket' },
    ];

    // Default Column Definitions: Apply configuration across all columns
    defaultColDef: ColDef = {
        filter: true,
    };

    // Load data into grid when ready
    constructor(private http: HttpClient) {}
    onGridReady(params: GridReadyEvent) {
        this.http
            .get<any[]>('https://www.ag-grid.com/example-assets/space-mission-data.json')
            .subscribe((data) => (this.rowData = data));
    }
}
