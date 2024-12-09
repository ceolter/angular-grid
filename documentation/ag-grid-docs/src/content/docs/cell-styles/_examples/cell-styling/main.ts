import type {
    CellClassParams,
    CellClassRules,
    ColDef,
    GridApi,
    GridOptions,
    ICellRendererParams,
    ValueParserParams,
} from 'ag-grid-community';
import {
    CellStyleModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    TextEditorModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    NumberEditorModule,
    TextEditorModule,
    CellStyleModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const ragCellClassRules: CellClassRules = {
    'rag-green-outer': (params) => params.value === 2008,
    'rag-blue-outer': (params) => params.value === 2004,
    'rag-red-outer': (params) => params.value === 2000,
};

const columnDefs: ColDef[] = [
    { field: 'athlete' },
    {
        field: 'age',
        maxWidth: 90,
        valueParser: numberParser,
        cellClassRules: {
            'rag-green': 'x < 20',
            'rag-blue': 'x >= 20 && x < 25',
            'rag-red': 'x >= 25',
        },
    },
    { field: 'country' },
    {
        field: 'year',
        maxWidth: 90,
        valueParser: numberParser,
        cellClassRules: ragCellClassRules,
        cellRenderer: ragRenderer,
    },
    { field: 'date', cellClass: 'rag-blue' },
    {
        field: 'sport',
        cellClass: cellClass,
    },
    {
        field: 'gold',
        valueParser: numberParser,
        cellStyle: {
            // you can use either came case or dashes, the grid converts to whats needed
            backgroundColor: '#aaffaa', // light green
        },
    },
    {
        field: 'silver',
        valueParser: numberParser,
        // when cellStyle is a func, we can have the style change
        // dependent on the data, eg different colors for different values
        cellStyle: cellStyle,
    },
    {
        field: 'bronze',
        valueParser: numberParser,
        // same as above, but demonstrating dashes in the style, grid takes care of converting to/from camel case
        cellStyle: cellStyle,
    },
];

function cellStyle(params: CellClassParams) {
    const color = numberToColor(params.value);
    return {
        backgroundColor: color,
    };
}

function cellClass(params: CellClassParams) {
    return params.value === 'Swimming' ? 'rag-green' : 'rag-blue';
}

function numberToColor(val: number) {
    if (val === 0) {
        return '#ffaaaa';
    } else if (val == 1) {
        return '#aaaaff';
    } else {
        return '#aaffaa';
    }
}

function ragRenderer(params: ICellRendererParams) {
    return '<span class="rag-element">' + params.value + '</span>';
}

function numberParser(params: ValueParserParams) {
    const newValue = params.newValue;
    let valueAsNumber;
    if (newValue === null || newValue === undefined || newValue === '') {
        valueAsNumber = null;
    } else {
        valueAsNumber = parseFloat(params.newValue);
    }
    return valueAsNumber;
}

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 150,
        editable: true,
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
