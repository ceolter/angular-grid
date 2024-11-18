import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    CellValueChangedEvent,
    GridApi,
    GridOptions,
    ValueFormatterParams,
    ValueSetterParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { RichSelectModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

import { ColourCellRenderer } from './colourCellRenderer_typescript';
import { getData } from './data';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    MenuModule,
    RichSelectModule,
    SetFilterModule,
]);

const carMappings = {
    tyt: 'Toyota',
    frd: 'Ford',
    prs: 'Porsche',
    nss: 'Nissan',
};

const colourMappings = {
    cb: 'Cadet Blue',
    bw: 'Burlywood',
    fg: 'Forest Green',
};

function extractKeys(mappings: Record<string, string>) {
    return Object.keys(mappings);
}

const carCodes = extractKeys(carMappings);
const colourCodes = extractKeys(colourMappings);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        {
            field: 'make',
            minWidth: 100,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: carCodes,
            },
            filter: 'agSetColumnFilter',
            refData: carMappings,
        },
        {
            field: 'exteriorColour',
            minWidth: 150,
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
                values: colourCodes,
                cellRenderer: ColourCellRenderer,
            },
            filter: 'agSetColumnFilter',
            filterParams: {
                cellRenderer: ColourCellRenderer,
            },
            refData: colourMappings,
            cellRenderer: ColourCellRenderer,
        },
        {
            field: 'interiorColour',
            minWidth: 150,
            filter: 'agSetColumnFilter',
            filterParams: {
                cellRenderer: ColourCellRenderer,
            },
            refData: colourMappings,
            cellRenderer: ColourCellRenderer,
        },
        {
            headerName: 'Retail Price',
            field: 'price',
            minWidth: 120,
            colId: 'retailPrice',
            valueGetter: (params) => {
                return params.data.price;
            },
            valueFormatter: currencyFormatter,
            valueSetter: numberValueSetter,
        },
        {
            headerName: 'Retail Price (incl Taxes)',
            minWidth: 120,
            editable: false,
            valueGetter: (params) => {
                // example of chaining value getters
                return params.getValue('retailPrice') * 1.2;
            },
            valueFormatter: currencyFormatter,
        },
    ],
    defaultColDef: {
        flex: 1,
        filter: true,
        editable: true,
    },
    rowData: getData(),
    onCellValueChanged: onCellValueChanged,
};

function onCellValueChanged(params: CellValueChangedEvent) {
    // notice that the data always contains the keys rather than values after editing
    console.log('onCellValueChanged Data: ', params.data);
}

function currencyFormatter(params: ValueFormatterParams) {
    const value = Math.floor(params.value);

    if (isNaN(value)) {
        return '';
    }

    return '£' + value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

function numberValueSetter(params: ValueSetterParams) {
    const valueAsNumber = parseFloat(params.newValue);
    if (isNaN(valueAsNumber) || !isFinite(params.newValue)) {
        return false; // don't set invalid numbers!
    }

    params.data.price = valueAsNumber;

    return true;
}

// wait for the document to be loaded, otherwise
// AG Grid will not find the div in the document.
document.addEventListener('DOMContentLoaded', function () {
    // lookup the container we want the Grid to use
    const eGridDiv = document.querySelector<HTMLElement>('#myGrid')!;

    // create the grid passing in the div to use together with the columns & data we want to use
    gridApi = createGrid(eGridDiv, gridOptions);
});
