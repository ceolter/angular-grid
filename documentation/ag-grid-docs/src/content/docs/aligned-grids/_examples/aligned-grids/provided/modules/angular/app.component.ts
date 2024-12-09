import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, ColGroupDef, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ColumnApiModule,
    ColumnAutoSizeModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';

import './styles.css';

ModuleRegistry.registerModules([
    ColumnApiModule,
    TextFilterModule,
    NumberFilterModule,
    ColumnAutoSizeModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

@Component({
    selector: 'my-app',
    standalone: true,
    imports: [AgGridAngular, HttpClientModule],
    template: `
        <div class="test-header" style="height: 5%">
            <label><input type="checkbox" checked (change)="onCbAthlete($event.target.checked)" />Athlete</label>
            <label><input type="checkbox" checked (change)="onCbAge($event.target.checked)" />Age</label>
            <label><input type="checkbox" checked (change)="onCbCountry($event.target.checked)" />Country</label>
        </div>

        <ag-grid-angular
            style="width: 100%; height: 45%"
            #topGrid
            [rowData]="rowData"
            [gridOptions]="topOptions"
            [alignedGrids]="[bottomGrid]"
            [columnDefs]="columnDefs"
        />

        <div style="height: 5%"></div>

        <ag-grid-angular
            style="width: 100%; height: 45%"
            #bottomGrid
            [rowData]="rowData"
            [gridOptions]="bottomOptions"
            [alignedGrids]="[topGrid]"
            [columnDefs]="columnDefs"
        />
    `,
})
export class AppComponent {
    columnDefs!: (ColDef | ColGroupDef)[];
    defaultColDef: ColDef = {
        filter: true,
        minWidth: 100,
    };
    rowData!: any[];
    topOptions: GridOptions = {
        defaultColDef: this.defaultColDef,
        autoSizeStrategy: {
            type: 'fitGridWidth',
        },
    };
    bottomOptions: GridOptions = {
        defaultColDef: this.defaultColDef,
    };

    @ViewChild('topGrid') topGrid!: AgGridAngular;

    constructor(private http: HttpClient) {
        this.columnDefs = [
            { field: 'athlete' },
            { field: 'age' },
            { field: 'country' },
            { field: 'year' },
            { field: 'sport' },
            {
                headerName: 'Medals',
                children: [
                    {
                        columnGroupShow: 'closed',
                        colId: 'total',
                        valueGetter: 'data.gold + data.silver + data.bronze',
                        width: 200,
                    },
                    { columnGroupShow: 'open', field: 'gold', width: 100 },
                    { columnGroupShow: 'open', field: 'silver', width: 100 },
                    { columnGroupShow: 'open', field: 'bronze', width: 100 },
                ],
            },
        ];
    }

    ngOnInit() {
        this.http.get('https://www.ag-grid.com/example-assets/olympic-winners.json').subscribe((data) => {
            this.rowData = data as any[];
        });
    }

    onCbAthlete(value: boolean) {
        // we only need to update one grid, as the other is a slave
        this.topGrid.api.setColumnsVisible(['athlete'], value);
    }

    onCbAge(value: boolean) {
        // we only need to update one grid, as the other is a slave
        this.topGrid.api.setColumnsVisible(['age'], value);
    }

    onCbCountry(value: boolean) {
        // we only need to update one grid, as the other is a slave
        this.topGrid.api.setColumnsVisible(['country'], value);
    }
}
