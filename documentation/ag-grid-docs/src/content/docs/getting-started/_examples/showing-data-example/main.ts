import type { GridApi, GridOptions, ValueGetterParams } from 'ag-grid-community';
import { ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';

ModuleRegistry.registerModules([ValidationModule, ValidationModule /* Development Only */]);

let gridApi: GridApi;

class CustomButtonComponent {
    eGui!: HTMLDivElement;
    eButton: any;
    eventListener!: () => void;

    init() {
        this.eGui = document.createElement('div');
        const eButton = document.createElement('button');
        eButton.className = 'btn-simple';
        eButton.textContent = 'Push Me!';
        this.eventListener = () => alert('clicked');
        eButton.addEventListener('click', this.eventListener);
        this.eGui.appendChild(eButton);
    }

    getGui() {
        return this.eGui;
    }

    refresh() {
        return true;
    }

    destroy() {
        if (this.eButton) {
            this.eButton.removeEventListener('click', this.eventListener);
        }
    }
}

const gridOptions: GridOptions = {
    // Data to be displayed
    rowData: [
        { make: 'Tesla', model: 'Model Y', price: 64950, electric: true },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: false },
        { make: 'Toyota', model: 'Corolla', price: 29600, electric: false },
        { make: 'Mercedes', model: 'EQA', price: 48890, electric: true },
        { make: 'Fiat', model: '500', price: 15774, electric: false },
        { make: 'Nissan', model: 'Juke', price: 20675, electric: false },
    ],
    // Columns to be displayed (Should match rowData properties)
    columnDefs: [
        {
            headerName: 'Make & Model',
            valueGetter: (p: ValueGetterParams) => p.data.make + ' ' + p.data.model,
            flex: 2,
        },
        { field: 'price', valueFormatter: (p) => '£' + Math.floor(p.value).toLocaleString(), flex: 1 },
        { field: 'electric', flex: 1 },
        { field: 'button', cellRenderer: CustomButtonComponent, flex: 1 },
    ],
};

const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
gridApi = createGrid(gridDiv, gridOptions);
