import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
    themeAlpine,
    themeBalham,
    themeQuartz,
} from 'ag-grid-community';
import { ColumnsToolPanelModule, FiltersToolPanelModule, PivotModule, SideBarModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    TextEditorModule,
    TextFilterModule,
    NumberEditorModule,
    ClientSideRowModelModule,
    SideBarModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    PivotModule,
    ValidationModule /* Development Only */,
]);

@Component({
    standalone: true,
    imports: [AgGridAngular, FormsModule, CommonModule],
    selector: 'my-app',
    template: `
        <div style="height: 100%; display: flex; flex-direction: column">
            <p style="flex: 0 1 0%">
                Theme:
                <select style="margin-right: 16px" [(ngModel)]="theme">
                    <option *ngFor="let theme of themes" [ngValue]="theme.theme">
                        {{ theme.label }}
                    </option>
                </select>
            </p>
            <div style="flex: 1 1 0%">
                <ag-grid-angular
                    style="height: 100%;"
                    [columnDefs]="columnDefs"
                    [defaultColDef]="defaultColDef"
                    [rowData]="rowData"
                    [theme]="theme"
                    [sideBar]="true"
                />
            </div>
        </div>
    `,
})
export class AppComponent {
    themes = [
        { label: 'themeQuartz', theme: themeQuartz },
        { label: 'themeBalham', theme: themeBalham },
        { label: 'themeAlpine', theme: themeAlpine },
    ];
    theme = themeQuartz;

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
