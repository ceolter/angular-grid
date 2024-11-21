import { Component } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { ColumnsToolPanelModule, FiltersToolPanelModule, PivotModule, SideBarModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,

    SideBarModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    PivotModule,
]);

@Component({
    standalone: true,
    imports: [AgGridAngular],
    selector: 'my-app',
    template: `
        <div style="height: 100%; display: flex; flex-direction: column">
            <p style="flex: 0 1 0%">
                <label>Dark mode: <input type="checkbox" (change)="setDarkMode($event.target.checked)" /></label>
            </p>
            <div style="flex: 1 1 0%">
                <ag-grid-angular
                    style="height: 100%;"
                    [columnDefs]="columnDefs"
                    [defaultColDef]="defaultColDef"
                    [rowData]="rowData"
                    [theme]="theme"
                    sideBar
                />
            </div>
        </div>
    `,
})
export class AppComponent {
    theme = themeQuartz
        .withParams(
            {
                backgroundColor: '#FFE8E0',
                foregroundColor: '#361008CC',
                browserColorScheme: 'light',
            },
            'light-red'
        )
        .withParams(
            {
                backgroundColor: '#201008',
                foregroundColor: '#FFFFFFCC',
                browserColorScheme: 'dark',
            },
            'dark-red'
        );

    columnDefs: ColDef[] = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];

    defaultColDef: ColDef = {
        flex: 1,
        minWidth: 100,
        filter: true,
        enableValue: true,
        enableRowGroup: true,
        enablePivot: true,
    };

    setDarkMode(enabled: boolean) {
        document.body.dataset.agThemeMode = enabled ? 'dark-red' : 'light-red';
    }

    ngOnInit() {
        this.setDarkMode(false);
    }

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
