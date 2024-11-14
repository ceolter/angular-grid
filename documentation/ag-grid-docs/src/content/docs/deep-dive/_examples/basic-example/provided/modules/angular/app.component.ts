import { Component } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

// Row Data Interface
interface IRow {
    make: string;
    model: string;
    price: number;
    electric: boolean;
}

@Component({
    standalone: true,
    imports: [AgGridAngular],
    selector: 'my-app',
    template: `
        <div class="content">
            <!-- The AG Grid component, with Dimensions, CSS Theme, Row Data, and Column Definition -->
            <ag-grid-angular style="width: 100%; height: 350px;" [rowData]="rowData" [columnDefs]="colDefs" />
        </div>
    `,
})
export class AppComponent {
    // Row Data: The data to be displayed.
    rowData: IRow[] = [
        { make: 'Tesla', model: 'Model Y', price: 64950, electric: true },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: false },
        { make: 'Toyota', model: 'Corolla', price: 29600, electric: false },
    ];

    // Column Definitions: Defines & controls grid columns.
    colDefs: ColDef<IRow>[] = [{ field: 'make' }, { field: 'model' }, { field: 'price' }, { field: 'electric' }];
}
