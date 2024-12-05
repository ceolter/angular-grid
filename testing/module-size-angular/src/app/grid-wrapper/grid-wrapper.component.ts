import { Component } from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, RowSelectionOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, NumberFilterModule } from 'ag-grid-community';
import { SelectEditorModule } from 'ag-grid-enterprise';

// Test a selection on community and enterprise modules to guard against accidental tree shaking breaks
ModuleRegistry.registerModules([ClientSideRowModelModule, NumberFilterModule, SelectEditorModule]);
@Component({
    selector: 'grid-wrapper',
    standalone: true,
    imports: [AgGridAngular],
    template: /*html*/ `HELLO<ag-grid-angular
            style="width: 100%; height: 100%;"
            [rowData]="rowData"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            [rowSelection]="rowSelection"
            [pagination]="true"
            [paginationPageSize]="paginationPageSize"
            [paginationPageSizeSelector]="paginationPageSizeSelector"
            loadThemeGoogleFonts
        /> `,
})
export class GridWrapperComponent {
    public rowData: any[] | null = [
        { make: 'Tesla', model: 'Model Y', price: 64950, electric: true, month: 'June' },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: false, month: 'October' },
        { make: 'Toyota', model: 'Corolla', price: 29600, electric: false, month: 'August' },
        { make: 'Mercedes', model: 'EQA', price: 48890, electric: true, month: 'February' },
        { make: 'Fiat', model: '500', price: 15774, electric: false, month: 'January' },
        { make: 'Nissan', model: 'Juke', price: 20675, electric: false, month: 'March' },
        { make: 'Vauxhall', model: 'Corsa', price: 18460, electric: false, month: 'July' },
        { make: 'Volvo', model: 'EX30', price: 33795, electric: true, month: 'September' },
        { make: 'Mercedes', model: 'Maybach', price: 175720, electric: false, month: 'December' },
        { make: 'Vauxhall', model: 'Astra', price: 25795, electric: false, month: 'April' },
        { make: 'Fiat', model: 'Panda', price: 13724, electric: false, month: 'November' },
        { make: 'Jaguar', model: 'I-PACE', price: 69425, electric: true, month: 'May' },
        { make: 'Tesla', model: 'Model Y', price: 64950, electric: true, month: 'June' },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: false, month: 'October' },
        { make: 'Toyota', model: 'Corolla', price: 29600, electric: false, month: 'August' },
        { make: 'Mercedes', model: 'EQA', price: 48890, electric: true, month: 'February' },
        { make: 'Fiat', model: '500', price: 15774, electric: false, month: 'January' },
        { make: 'Nissan', model: 'Juke', price: 20675, electric: false, month: 'March' },
        { make: 'Vauxhall', model: 'Corsa', price: 18460, electric: false, month: 'July' },
        { make: 'Volvo', model: 'EX30', price: 33795, electric: true, month: 'September' },
        { make: 'Mercedes', model: 'Maybach', price: 175720, electric: false, month: 'December' },
        { make: 'Vauxhall', model: 'Astra', price: 25795, electric: false, month: 'April' },
        { make: 'Fiat', model: 'Panda', price: 13724, electric: false, month: 'November' },
        { make: 'Jaguar', model: 'I-PACE', price: 69425, electric: true, month: 'May' },
        { make: 'Tesla', model: 'Model Y', price: 64950, electric: true, month: 'June' },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: false, month: 'October' },
        { make: 'Toyota', model: 'Corolla', price: 29600, electric: false, month: 'August' },
        { make: 'Mercedes', model: 'EQA', price: 48890, electric: true, month: 'February' },
        { make: 'Fiat', model: '500', price: 15774, electric: false, month: 'January' },
        { make: 'Nissan', model: 'Juke', price: 20675, electric: false, month: 'March' },
        { make: 'Vauxhall', model: 'Corsa', price: 18460, electric: false, month: 'July' },
        { make: 'Volvo', model: 'EX30', price: 33795, electric: true, month: 'September' },
        { make: 'Mercedes', model: 'Maybach', price: 175720, electric: false, month: 'December' },
        { make: 'Vauxhall', model: 'Astra', price: 25795, electric: false, month: 'April' },
        { make: 'Fiat', model: 'Panda', price: 13724, electric: false, month: 'November' },
        { make: 'Jaguar', model: 'I-PACE', price: 69425, electric: true, month: 'May' },
    ];
    public columnDefs: ColDef[] = [
        {
            field: 'make',
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['Tesla', 'Ford', 'Toyota', 'Mercedes', 'Fiat', 'Nissan', 'Vauxhall', 'Volvo', 'Jaguar'],
            },
        },
        { field: 'model' },
        { field: 'price', filter: 'agNumberColumnFilter' },
        { field: 'electric' },
        {
            field: 'month',
            comparator: (valueA, valueB) => {
                const months = [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                ];
                const idxA = months.indexOf(valueA);
                const idxB = months.indexOf(valueB);
                return idxA - idxB;
            },
        },
    ];
    public defaultColDef: ColDef = {
        filter: 'agTextColumnFilter',
        floatingFilter: true,
    };
    public rowSelection: RowSelectionOptions | 'single' | 'multiple' = {
        mode: 'multiRow',
        headerCheckbox: false,
    };
    public paginationPageSize = 10;
    public paginationPageSizeSelector: number[] | boolean = [10, 25, 50];
}
