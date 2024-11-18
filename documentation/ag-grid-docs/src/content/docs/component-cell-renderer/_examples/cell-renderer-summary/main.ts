import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { CompanyLogoRenderer } from './companyLogoRenderer_typescript';
import { CompanyRenderer } from './companyRenderer_typescript';
import { CustomButtonComponent } from './customButtonComponent_typescript';
import { MissionResultRenderer } from './missionResultRenderer_typescript';
import { PriceRenderer } from './priceRenderer_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

// Grid API: Access to Grid API methods
let gridApi: GridApi;

// Row Data Interface
interface IRow {
    company: string;
    location: string;
    price: number;
    successful: boolean;
}

const gridOptions: GridOptions = {
    defaultColDef: {
        flex: 10,
    },
    // Data to be displayed
    rowData: [] as IRow[],
    // Columns to be displayed (Should match rowData properties)
    columnDefs: [
        {
            field: 'company',
            flex: 6,
        },
        {
            field: 'website',
            cellRenderer: CompanyRenderer,
        },
        {
            headerName: 'Logo',
            field: 'company',
            cellRenderer: CompanyLogoRenderer,
            cellClass: 'logoCell',
            minWidth: 100,
        },
        {
            field: 'revenue',
            cellRenderer: PriceRenderer,
        },
        {
            field: 'hardware',
            headerName: 'Hardware',
            cellRenderer: MissionResultRenderer,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            cellRenderer: CustomButtonComponent,
        },
    ] as ColDef[],
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/small-company-data.json')
        .then((response) => response.json())
        .then((data) => {
            gridApi!.setGridOption('rowData', data);
        });
});
