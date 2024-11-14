import { Component } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import {
    AllCommunityModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    themeAlpine,
    themeBalham,
    themeQuartz,
} from 'ag-grid-community';

import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

@Component({
    standalone: true,
    imports: [AgGridAngular],
    selector: 'my-app',
    template: `
        <div style="height: 100%; display: flex; flex-direction: column">
            <div style="display: flex; gap: 16px">
                <p style="flex: 1 1 0%">Quartz theme:</p>
                <p style="flex: 1 1 0%">Alpine theme:</p>
            </div>
            <div style="flex: 1 1 0%; display: flex; gap: 16px">
                <div style="flex: 1 1 0%">
                    <ag-grid-angular
                        style="height: 100%;"
                        [columnDefs]="columnDefs"
                        [defaultColDef]="defaultColDef"
                        [rowData]="rowData"
                        [theme]="theme1"
                    />
                </div>
                <div style="flex: 1 1 0%">
                    <ag-grid-angular
                        style="height: 100%;"
                        [columnDefs]="columnDefs"
                        [defaultColDef]="defaultColDef"
                        [rowData]="rowData"
                        [theme]="theme2"
                    />
                </div>
            </div>
            <div style="display: flex; gap: 16px">
                <p style="flex: 1 1 0%">Balham theme (green header):</p>
                <p style="flex: 1 1 0%">Balham theme (red header):</p>
            </div>
            <div style="flex: 1 1 0%; display: flex; gap: 16px">
                <div style="flex: 1 1 0%" class="green-header">
                    <ag-grid-angular
                        style="height: 100%;"
                        [columnDefs]="columnDefs"
                        [defaultColDef]="defaultColDef"
                        [rowData]="rowData"
                        [theme]="theme3"
                    />
                </div>
                <div style="flex: 1 1 0%" class="red-header">
                    <ag-grid-angular
                        style="height: 100%;"
                        [columnDefs]="columnDefs"
                        [defaultColDef]="defaultColDef"
                        [rowData]="rowData"
                        [theme]="theme3"
                    />
                </div>
            </div>
        </div>
    `,
})
export class AppComponent {
    theme1 = themeQuartz;
    theme2 = themeAlpine;
    theme3 = themeBalham;

    columnDefs: ColDef[] = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];

    defaultColDef: ColDef = {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
    };

    rowData: any[] = (() => {
        const rowData: any[] = [];
        for (let i = 0; i < 10; i++) {
            rowData.push({ make: 'Toyota', model: 'Celica', price: 35000 + i * 1000 });
            rowData.push({ make: 'Ford', model: 'Mondeo', price: 32000 + i * 1000 });
            rowData.push({ make: 'Porsche', model: 'Boxster', price: 72000 + i * 1000 });
        }
        return rowData;
    })();
}
