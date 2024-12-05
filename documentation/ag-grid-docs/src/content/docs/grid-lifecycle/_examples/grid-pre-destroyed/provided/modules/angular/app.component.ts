// NOTE: Angular CLI does not support component CSS imports: angular-cli/issues/23273
import { Component } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridApi, GridOptions, GridPreDestroyedEvent, GridReadyEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import type { TAthlete } from './data';
import { getData } from './data';
import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule]);

interface ColumnWidth {
    field: string;
    width: number;
}

@Component({
    standalone: true,
    imports: [AgGridAngular],
    selector: 'my-app',
    template: `
        <div class="test-container">
            <div class="test-header">
                @if (isVisible) {
                    <div id="exampleButtons" style="margin-bottom: 1rem;">
                        <button (click)="updateColumnWidth()">Change Columns Width</button>
                        <button (click)="destroyGrid()">Destroy Grid</button>
                    </div>
                }
                @if (showPreDestroyState) {
                    <div id="gridPreDestroyedState">
                        State captured on grid pre-destroyed event:<br />
                        <strong>Column fields and widths</strong>
                        <div className="values">
                            <ul>
                                @for (item of columnsWidthOnPreDestroyed; track item.field) {
                                    <li>Field: {{ item.field }} | Width: {{ item.width }}px</li>
                                }
                            </ul>
                        </div>
                        <button (click)="reloadGrid()">Reload Grid</button>
                    </div>
                }
            </div>
            @if (isVisible) {
                <ag-grid-angular
                    style="width: 100%; height: 100%;"
                    [columnDefs]="columnDefs"
                    [defaultColDef]="defaultColDef"
                    [rowData]="rowData"
                    [gridOptions]="gridOptions"
                    (gridReady)="onGridReady($event)"
                />
            }
        </div>
    `,
})
export class AppComponent {
    public isVisible = true;
    public showPreDestroyState = false;
    private gridApi: GridApi | undefined;

    public gridOptions: GridOptions = {
        onGridPreDestroyed: (params: GridPreDestroyedEvent<TAthlete>) => this.onGridPreDestroyed(params),
    };

    public columnDefs: ColDef[] = [
        { field: 'name', headerName: 'Athlete' },
        { field: 'medals.gold', headerName: 'Gold Medals' },
        { field: 'person.age', headerName: 'Age' },
    ];

    public columnsWidthOnPreDestroyed: ColumnWidth[] = [];

    public defaultColDef: ColDef = {
        editable: true,
    };

    public rowData: any[] | null = getData();

    onGridPreDestroyed(params: GridPreDestroyedEvent<TAthlete>) {
        const allColumns = params.api.getColumns();
        if (!allColumns) {
            return;
        }
        const currentColumnWidths = allColumns.map((column) => ({
            field: column.getColDef().field || '-',
            width: column.getActualWidth(),
        }));

        this.columnsWidthOnPreDestroyed = currentColumnWidths;
    }

    updateColumnWidth() {
        if (!this.gridApi) {
            return;
        }
        const newWidths = this.gridApi.getColumns()!.map((column) => {
            return { key: column.getColId(), newWidth: Math.round((150 + Math.random() * 100) * 100) / 100 };
        });
        this.gridApi.setColumnWidths(newWidths);
    }

    destroyGrid() {
        this.isVisible = false;
        this.showPreDestroyState = true;
        this.gridApi = undefined;
    }

    reloadGrid() {
        const updatedColDefs =
            this.columnDefs && this.columnsWidthOnPreDestroyed
                ? this.columnDefs.map((val) => {
                      const colDef = val as ColDef;
                      const result: ColDef = {
                          ...colDef,
                      };
                      if (colDef.field || colDef.width) {
                          const width = colDef.field
                              ? this.columnsWidthOnPreDestroyed.find((i) => i.field == colDef.field)?.width
                              : undefined;

                          result.width = typeof width === 'number' ? width : colDef.width;
                      }
                      return result;
                  })
                : this.columnDefs;

        this.columnDefs = updatedColDefs;
        this.columnsWidthOnPreDestroyed = [];
        this.isVisible = true;
        this.showPreDestroyState = false;
    }

    onGridReady(params: GridReadyEvent) {
        this.gridApi = params.api;
    }
}
