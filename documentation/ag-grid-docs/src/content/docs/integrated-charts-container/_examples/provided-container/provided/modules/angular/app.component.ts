// NOTE: Angular CLI does not support component CSS imports: angular-cli/issues/23273
import { HttpClient, HttpClientModule } from '@angular/common/http';
import type { ElementRef } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import { AgGridAngular } from 'ag-grid-angular';
import type { ChartRef, ColDef, GridReadyEvent } from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';
import { IntegratedChartsModule, MenuModule, RowGroupingModule } from 'ag-grid-enterprise';

import './styles.css';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    MenuModule,
    RowGroupingModule,
]);

@Component({
    selector: 'my-app',
    standalone: true,
    imports: [AgGridAngular, HttpClientModule],
    template: `<div id="container">
        <ag-grid-angular
            style="width: 100%; height: 300px;"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            [cellSelection]="true"
            [enableCharts]="true"
            [popupParent]="popupParent"
            [createChartContainer]="createChartContainer"
            [rowData]="rowData"
            (gridReady)="onGridReady($event)"
        />
        <div #chartParent class="chart-wrapper">
            @if (chartRef) {
                <div class="chart-wrapper-top">
                    <h2 class="chart-wrapper-title">Chart created at {{ createdTime }}</h2>
                    <button (click)="updateChart()">Destroy Chart</button>
                </div>
            } @else {
                <div class="chart-placeholder">Chart will be displayed here.</div>
            }
        </div>
    </div> `,
})
export class AppComponent {
    columnDefs: ColDef[] = [
        { field: 'athlete', width: 150, chartDataType: 'category' },
        { field: 'gold', chartDataType: 'series' },
        { field: 'silver', chartDataType: 'series' },
        { field: 'bronze', chartDataType: 'series' },
        { field: 'total', chartDataType: 'series' },
    ];
    defaultColDef: ColDef = { flex: 1 };
    popupParent: HTMLElement | null = document.body;
    rowData!: any[];
    chartRef?: ChartRef;
    createdTime?: string;

    @ViewChild('chartParent') chartParent?: ElementRef;

    constructor(private http: HttpClient) {}

    onGridReady(params: GridReadyEvent) {
        this.http
            .get<any[]>('https://www.ag-grid.com/example-assets/wide-spread-of-sports.json')
            .subscribe((data: any[]) => {
                this.rowData = data;
            });
        /** PROVIDED EXAMPLE DARK INTEGRATED **/
    }

    updateChart(chartRef: ChartRef | undefined) {
        if (this.chartRef !== chartRef) {
            // Destroy previous chart if it exists
            this.chartRef?.destroyChart();
        }
        this.chartRef = chartRef;
        this.createdTime = new Date().toLocaleString();
    }

    // Arrow function used to correctly bind this to the component
    createChartContainer = (chartRef: ChartRef) => {
        this.updateChart(chartRef);
        this.chartParent?.nativeElement.appendChild(chartRef.chartElement);
    };
}
