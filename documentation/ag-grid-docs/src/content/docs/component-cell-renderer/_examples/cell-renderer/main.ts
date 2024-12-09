import type { GridApi, GridOptions, ICellRendererParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ColumnApiModule,
    ModuleRegistry,
    NumberEditorModule,
    RowApiModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    ColumnApiModule,
    TextFilterModule,
    RowApiModule,
    ClientSideRowModelModule,
    TextEditorModule,
    NumberEditorModule,
    ValidationModule /* Development Only */,
]);

export interface ImageCellRendererParams extends ICellRendererParams {
    rendererImage: string;
    divisor?: number;
}

/**
 * Demonstrating function cell renderer
 * Visually indicates if this months value is higher or lower than last months value
 * by adding an +/- symbols according to the difference
 */
const deltaIndicator = (params: ICellRendererParams) => {
    const element = document.createElement('span');
    const imageElement = document.createElement('img');

    // visually indicate if this months value is higher or lower than last months value
    if (params.value > 15) {
        imageElement.src = 'https://www.ag-grid.com/example-assets/weather/fire-plus.png';
    } else {
        imageElement.src = 'https://www.ag-grid.com/example-assets/weather/fire-minus.png';
    }
    element.appendChild(imageElement);
    element.appendChild(document.createTextNode(params.value));
    return element;
};

function iconCellRenderer(params: ImageCellRendererParams) {
    const value = params.value / (params.divisor ? params.divisor : 1);
    return createImageSpan(value, params.rendererImage);
}

let gridApi: GridApi;

function getColumnDefs() {
    return [
        {
            headerName: 'Month',
            field: 'Month',
            width: 75,
        },
        {
            headerName: 'Max Temp',
            field: 'Max temp (C)',
            width: 120,
            cellRenderer: deltaIndicator, // Function cell renderer
        },
        {
            headerName: 'Min Temp',
            field: 'Min temp (C)',
            width: 120,
            cellRenderer: deltaIndicator, // Function cell renderer
        },
        {
            headerName: 'Frost',
            field: 'Days of air frost (days)',
            width: 233,
            cellRenderer: iconCellRenderer, // Component Cell Renderer
            cellRendererParams: {
                rendererImage: 'frost.png', // Complementing the Cell Renderer parameters
            },
        },
        {
            headerName: 'Sunshine',
            field: 'Sunshine (hours)',
            width: 190,
            cellRenderer: iconCellRenderer,
            cellRendererParams: {
                rendererImage: 'sun.png', // Complementing the Cell Renderer parameters
                divisor: 24,
            },
        },
        {
            headerName: 'Rainfall',
            field: 'Rainfall (mm)',
            width: 180,
            cellRenderer: iconCellRenderer,
            cellRendererParams: {
                rendererImage: 'rain.png', // Complementing the Cell Renderer parameters
                divisor: 10,
            },
        },
    ];
}

const gridOptions: GridOptions = {
    columnDefs: getColumnDefs(),
    rowData: null,
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
    },
};

const createImageSpan = (imageMultiplier: number, image: string) => {
    const resultElement = document.createElement('span');
    for (let i = 0; i < imageMultiplier; i++) {
        const imageElement = document.createElement('img');
        imageElement.src = 'https://www.ag-grid.com/example-assets/weather/' + image;
        resultElement.appendChild(imageElement);
    }
    return resultElement;
};

/**
 * Updates the Days of Air Frost column - adjusts the value which in turn will demonstrate the Component refresh functionality
 * After a data update, cellRenderer Components.refresh method will be called to re-render the altered Cells
 */
function randomiseFrost() {
    // iterate over the "days of air frost" and make each a random number.
    gridApi!.forEachNode((rowNode) => {
        rowNode.setDataValue('Days of air frost (days)', Math.floor(Math.random() * 4) + 1);
    });
}

// setup the grid after the page has finished loading
const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
gridApi = createGrid(gridDiv, gridOptions);

fetch('https://www.ag-grid.com/example-assets/weather-se-england.json')
    .then((response) => response.json())
    .then((data) => {
        gridApi!.setGridOption('rowData', data);
    });
