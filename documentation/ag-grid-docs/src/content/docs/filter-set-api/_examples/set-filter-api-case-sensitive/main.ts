import type {
    FirstDataRenderedEvent,
    GridApi,
    GridOptions,
    ICellRendererParams,
    ISetFilter,
    ISetFilterParams,
} from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, FiltersToolPanelModule, SetFilterModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    FiltersToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    SetFilterModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        {
            headerName: 'Case Insensitive (default)',
            field: 'colour',
            filter: 'agSetColumnFilter',
            filterParams: {
                caseSensitive: false,
                cellRenderer: colourCellRenderer,
            } as ISetFilterParams,
        },
        {
            headerName: 'Case Sensitive',
            field: 'colour',
            filter: 'agSetColumnFilter',
            filterParams: {
                caseSensitive: true,
                cellRenderer: colourCellRenderer,
            } as ISetFilterParams,
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 225,
        cellRenderer: colourCellRenderer,
        floatingFilter: true,
    },
    sideBar: 'filters',
    onFirstDataRendered: onFirstDataRendered,
    rowData: getData(),
};

const FIXED_STYLES =
    'vertical-align: middle; border: 1px solid black; margin: 3px; display: inline-block; width: 10px; height: 10px';

const FILTER_TYPES: Record<string, string> = {
    insensitive: 'colour',
    sensitive: 'colour_1',
};

function colourCellRenderer(params: ICellRendererParams) {
    if (!params.value || params.value === '(Select All)') {
        return params.value;
    }

    return `<div style="background-color: ${params.value.toLowerCase()}; ${FIXED_STYLES}"></div>${params.value}`;
}

function setModel(type: string) {
    gridApi!.setColumnFilterModel(FILTER_TYPES[type], { values: MANGLED_COLOURS }).then(() => {
        gridApi!.onFilterChanged();
    });
}

function getModel(type: string) {
    alert(JSON.stringify(gridApi!.getColumnFilterModel(FILTER_TYPES[type]), null, 2));
}

function setFilterValues(type: string) {
    gridApi!.getColumnFilterInstance<ISetFilter>(FILTER_TYPES[type]).then((instance) => {
        instance!.setFilterValues(MANGLED_COLOURS);
        instance!.applyModel();
        gridApi!.onFilterChanged();
    });
}

function getValues(type: string) {
    gridApi!.getColumnFilterInstance<ISetFilter>(FILTER_TYPES[type]).then((instance) => {
        alert(JSON.stringify(instance!.getFilterValues(), null, 2));
    });
}

function reset(type: string) {
    gridApi!.getColumnFilterInstance<ISetFilter>(FILTER_TYPES[type]).then((instance) => {
        instance!.resetFilterValues();
        instance!.setModel(null).then(() => {
            gridApi!.onFilterChanged();
        });
    });
}

var MANGLED_COLOURS = ['ReD', 'OrAnGe', 'WhItE', 'YeLlOw'];

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.getToolPanelInstance('filters')!.expandFilters();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
