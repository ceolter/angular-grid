import { Component } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

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
    imports: [AgGridAngular],
    selector: 'my-app',
    template: `
        <div class="content">
            <!-- The AG Grid component, with Dimensions, CSS Theme, Row Data, and Column Definition -->
            <ag-grid-angular style="width: 100%; height: 201px;" [rowData]="rowData" [columnDefs]="colDefs" />
        </div>
    `,
})
export class AppComponent {
    // Row Data: The data to be displayed.
    rowData: IRow[] = [
        {
            mission: 'CRS SpX-25',
            company: 'SpaceX',
            location: 'LC-39A, Kennedy Space Center, Florida, USA',
            date: '2022-07-15',
            time: '0:44:00',
            rocket: 'Falcon 9 Block 5',
            price: 12480000,
            successful: true,
        },
        {
            mission: 'LARES 2 & Cubesats',
            company: 'ESA',
            location: 'ELV-1, Guiana Space Centre, French Guiana, France',
            date: '2022-07-13',
            time: '13:13:00',
            rocket: 'Vega C',
            price: 4470000,
            successful: true,
        },
        {
            mission: 'Wise One Looks Ahead (NROL-162)',
            company: 'Rocket Lab',
            location: 'Rocket Lab LC-1A, Māhia Peninsula, New Zealand',
            date: '2022-07-13',
            time: '6:30:00',
            rocket: 'Electron/Curie',
            price: 9750000,
            successful: true,
        },
    ];

    // Column Definitions: Defines & controls grid columns.
    colDefs: ColDef[] = [
        { field: 'mission' },
        { field: 'company' },
        { field: 'location' },
        { field: 'date' },
        { field: 'price' },
        { field: 'successful' },
        { field: 'rocket' },
    ];
}
