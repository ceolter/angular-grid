import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, ColGroupDef, GridOptions } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
    selector: 'my-app',
    standalone: true,
    imports: [AgGridAngular, HttpClientModule],
    template: `
        <ag-grid-angular
            style="width: 100%; height: 45%"
            #topGrid
            [rowData]="rowData"
            [gridOptions]="topOptions"
            [columnDefs]="columnDefs"
            [alignedGrids]="[bottomGrid]"
        />

        <div style="height: 5%"></div>

        <ag-grid-angular
            style="width: 100%; height: 45%"
            #bottomGrid
            [rowData]="rowData"
            [gridOptions]="bottomOptions"
            [columnDefs]="columnDefs"
            [alignedGrids]="[topGrid]"
        />
    `,
})
export class AppComponent {
    columnDefs!: (ColDef | ColGroupDef)[];
    rowData!: any[];
    topOptions: GridOptions = {
        defaultColDef: {
            flex: 1,
            minWidth: 120,
        },
        autoSizeStrategy: {
            type: 'fitGridWidth',
        },
    };
    bottomOptions: GridOptions = {
        defaultColDef: {
            flex: 1,
            minWidth: 120,
        },
    };

    @ViewChild('topGrid') topGrid!: AgGridAngular;

    constructor(private http: HttpClient) {
        this.columnDefs = [
            {
                headerName: 'Group 1',
                groupId: 'Group1',
                children: [
                    { field: 'athlete', pinned: true, width: 100 },
                    { field: 'age', pinned: true, columnGroupShow: 'open', width: 100 },
                    { field: 'country', width: 100 },
                    { field: 'year', columnGroupShow: 'open', width: 100 },
                    { field: 'date', width: 100 },
                    { field: 'sport', columnGroupShow: 'open', width: 100 },
                    { field: 'date', width: 100 },
                    { field: 'sport', columnGroupShow: 'open', width: 100 },
                ],
            },
            {
                headerName: 'Group 2',
                groupId: 'Group2',
                children: [
                    { field: 'athlete', pinned: true, width: 100 },
                    { field: 'age', pinned: true, columnGroupShow: 'open', width: 100 },
                    { field: 'country', width: 100 },
                    { field: 'year', columnGroupShow: 'open', width: 100 },
                    { field: 'date', width: 100 },
                    { field: 'sport', columnGroupShow: 'open', width: 100 },
                    { field: 'date', width: 100 },
                    { field: 'sport', columnGroupShow: 'open', width: 100 },
                ],
            },
        ];
    }

    ngOnInit() {
        this.http.get('https://www.ag-grid.com/example-assets/olympic-winners.json').subscribe((data) => {
            this.rowData = data as any[];

            // mix up some columns
            this.topGrid.api.moveColumnByIndex(11, 4);
            this.topGrid.api.moveColumnByIndex(11, 4);
        });
    }
}
