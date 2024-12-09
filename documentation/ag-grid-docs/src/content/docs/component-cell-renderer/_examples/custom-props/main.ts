import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    RowApiModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

import { CustomButtonComponent } from './customButtonComponent_typescript';
import { MissionResultRenderer } from './missionResultRenderer_typescript';

ModuleRegistry.registerModules([RowApiModule, ClientSideRowModelModule, ValidationModule /* Development Only */]);

// Grid API: Access to Grid API methods
let gridApi: GridApi;

// Row Data Interface
interface IRow {
    company: string;
    location: string;
    price: number;
    successful: boolean;
}

function successIconSrc(params: boolean) {
    if (params === true) {
        return 'https://www.ag-grid.com/example-assets/icons/tick-in-circle.png';
    } else {
        return 'https://www.ag-grid.com/example-assets/icons/cross-in-circle.png';
    }
}

function refreshData() {
    gridApi!.forEachNode((rowNode) => {
        rowNode.setDataValue('successful', Math.random() > 0.5);
    });
}

const onClick = () => alert('Mission Launched');
const gridOptions: GridOptions = {
    // Data to be displayed
    rowData: [] as IRow[],
    // Columns to be displayed (Should match rowData properties)
    columnDefs: [
        {
            field: 'company',
        },
        {
            field: 'successful',
            headerName: 'Success',
            cellRenderer: MissionResultRenderer,
        },
        {
            field: 'successful',
            headerName: 'Success',
            cellRenderer: MissionResultRenderer,
            cellRendererParams: {
                src: successIconSrc,
            },
        },
        {
            field: 'actions',
            headerName: 'Actions',
            cellRenderer: CustomButtonComponent,
            cellRendererParams: {
                onClick: onClick,
            },
        },
    ] as ColDef[],
    defaultColDef: {
        flex: 1,
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/small-space-mission-data.json')
        .then((response) => response.json())
        .then((data) => {
            gridApi!.setGridOption('rowData', data);
        });
});

if (typeof window !== 'undefined') {
    // Attach external event handlers to window so they can be called from index.html
    (<any>window).refreshData = refreshData;
}
