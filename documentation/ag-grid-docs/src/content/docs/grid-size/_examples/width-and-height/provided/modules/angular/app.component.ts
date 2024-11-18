import { NgStyle } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import type { OnInit } from '@angular/core';
import { Component, ViewChild } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';

import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

@Component({
    standalone: true,
    imports: [AgGridAngular, HttpClientModule, NgStyle],
    selector: 'my-app',
    template: `
        <div style="height: 100%; display: flex; flex-direction: column;">
            <div style="margin-bottom: 5px;">
                <button (click)="fillLarge()">Fill 100%</button>
                <button (click)="fillMedium()">Fill 60%</button>
                <button (click)="fillExact()">Exactly 400 x 400 pixels</button>
            </div>
            <div [ngStyle]="style">
                <ag-grid-angular
                    style="width: 100%; height:100%;"
                    #agGrid
                    [rowData]="rowData"
                    [columnDefs]="columnDefs"
                />
            </div>
        </div>
    `,
})
export class AppComponent implements OnInit {
    @ViewChild('agGrid') agGrid!: AgGridAngular<IOlympicData>;

    public style: any = {
        width: '100%',
        height: '100%',
        flex: '1 1 auto',
    };

    public columnDefs: ColDef[] = [
        { field: 'athlete', width: 150 },
        { field: 'age', width: 90 },
        { field: 'country', width: 150 },
        { field: 'year', width: 90 },
        { field: 'date', width: 150 },
        { field: 'sport', width: 150 },
        { field: 'gold', width: 100 },
        { field: 'silver', width: 100 },
        { field: 'bronze', width: 100 },
        { field: 'total', width: 100 },
    ];
    public rowData!: IOlympicData[];

    constructor(private http: HttpClient) {}

    ngOnInit() {
        this.http
            .get<IOlympicData[]>('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .subscribe((data) => {
                this.rowData = data;
            });
    }

    fillLarge() {
        this.setWidthAndHeight('100%', '100%');
    }

    fillMedium() {
        this.setWidthAndHeight('60%', '60%');
    }

    fillExact() {
        this.setWidthAndHeight('400px', '400px');
    }

    setWidthAndHeight(width: string, height: string) {
        this.style = {
            width: width,
            height: height,
        };
    }
}
