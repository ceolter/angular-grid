import type {
    ColDef,
    GridApi,
    GridOptions,
    ICellRendererComp,
    ICellRendererParams,
    ValueFormatterParams,
} from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry, createGrid } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// Grid API: Access to Grid API methods
let gridApi: GridApi;

class CompanyLogoRenderer implements ICellRendererComp {
    eGui!: HTMLSpanElement;

    // Optional: Params for rendering. The same params that are passed to the cellRenderer function.
    init(params: ICellRendererParams) {
        const companyLogo: HTMLImageElement = document.createElement('img');
        companyLogo.src = `https://www.ag-grid.com/example-assets/space-company-logos/${params.value.toLowerCase()}.png`;
        companyLogo.setAttribute(
            'style',
            'display: block; width: 25px; height: auto; max-height: 50%; margin-right: 12px; filter: brightness(1.1)'
        );

        const companyName: HTMLParagraphElement = document.createElement('p');
        companyName.textContent = params.value;
        companyName.setAttribute('style', 'text-overflow: ellipsis; overflow: hidden; white-space: nowrap;');

        this.eGui = document.createElement('span');
        this.eGui.setAttribute('style', 'display: flex; height: 100%; width: 100%; align-items: center');
        this.eGui.appendChild(companyLogo);
        this.eGui.appendChild(companyName);
    }

    // Required: Return the DOM element of the component, this is what the grid puts into the cell
    getGui() {
        return this.eGui;
    }

    // Required: Get the cell to refresh.
    refresh(params: ICellRendererParams): boolean {
        return false;
    }
}

// Row Data Interface
interface IRow {
    mission: string;
    company: string;
    location: string;
    date: string;
    time: string;
    rocket: string;
    price: number;
    successful: boolean;
}

const gridOptions: GridOptions = {
    // Data to be displayed
    rowData: [] as IRow[],
    // Columns to be displayed (Should match rowData properties)
    columnDefs: [
        {
            field: 'mission',
            filter: true,
        },
        {
            field: 'company',
            cellRenderer: CompanyLogoRenderer,
        },
        {
            field: 'location',
        },
        { field: 'date' },
        {
            field: 'price',
            valueFormatter: (params: ValueFormatterParams) => {
                return '£' + params.value.toLocaleString();
            },
        },
        { field: 'successful' },
        { field: 'rocket' },
    ] as ColDef[],
    // Configurations applied to all columns
    defaultColDef: {
        filter: true,
    } as ColDef,
    // Grid Options & Callbacks
    pagination: true,
};

// Create Grid: Create new grid within the #myGrid div, using the Grid Options object
gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);

// Fetch Remote Data
fetch('https://www.ag-grid.com/example-assets/space-mission-data.json')
    .then((response) => response.json())
    .then((data: any) => gridApi.setGridOption('rowData', data));
