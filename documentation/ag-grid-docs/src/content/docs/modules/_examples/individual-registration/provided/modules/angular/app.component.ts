import { Component } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ClipboardModule } from 'ag-grid-enterprise';
import { ExcelExportModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

import './styles.css';

// Register shared Modules globally
ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, ColumnMenuModule, ContextMenuModule]);

@Component({
    selector: 'my-app',
    standalone: true,
    imports: [AgGridAngular],
    template: `
        <div class="example-wrapper">
            <div class="inner-col">
                <ag-grid-angular
                    [defaultColDef]="defaultColDef"
                    [rowData]="leftRowData"
                    [modules]="leftModules"
                    [columnDefs]="columns"
                />
            </div>

            <div class="inner-col">
                <ag-grid-angular
                    [defaultColDef]="defaultColDef"
                    [rowData]="leftRowData"
                    [modules]="rightModules"
                    [columnDefs]="columns"
                />
            </div>
        </div>
    `,
})
export class AppComponent {
    leftModules = [SetFilterModule, ClipboardModule];
    rightModules = [ExcelExportModule];
    leftRowData: any[] = [];
    rightRowData: any[] = [];

    defaultColDef: ColDef = {
        flex: 1,
        minWidth: 100,
        filter: true,
        floatingFilter: true,
    };

    columns: ColDef[] = [{ field: 'id' }, { field: 'color' }, { field: 'value1' }];

    constructor() {
        this.leftRowData = createRowBlock();
        this.rightRowData = createRowBlock();
    }
}

let rowIdSequence = 100;
const createRowBlock = () =>
    ['Red', 'Green', 'Blue'].map((color) => ({
        id: rowIdSequence++,
        color: color,
        value1: Math.floor(Math.random() * 100),
    }));
