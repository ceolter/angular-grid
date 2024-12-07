import type {
    ColDef,
    FilterChangedEvent,
    FilterModifiedEvent,
    FilterOpenedEvent,
    GridApi,
    GridOptions,
    INumberFilterParams,
    IProvidedFilter,
    ITextFilterParams,
} from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    TextFilterModule,
    NumberFilterModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    {
        field: 'athlete',
        filter: 'agTextColumnFilter',
        filterParams: {
            buttons: ['reset', 'apply'],
        } as ITextFilterParams,
    },
    {
        field: 'age',
        maxWidth: 100,
        filter: 'agNumberColumnFilter',
        filterParams: {
            buttons: ['apply', 'reset'],
            closeOnApply: true,
        } as INumberFilterParams,
    },
    {
        field: 'country',
        filter: 'agTextColumnFilter',
        filterParams: {
            buttons: ['clear', 'apply'],
        } as ITextFilterParams,
    },
    {
        field: 'year',
        filter: 'agNumberColumnFilter',
        filterParams: {
            buttons: ['apply', 'cancel'],
            closeOnApply: true,
        } as INumberFilterParams,
        maxWidth: 100,
    },
    { field: 'sport' },
    { field: 'gold', filter: 'agNumberColumnFilter' },
    { field: 'silver', filter: 'agNumberColumnFilter' },
    { field: 'bronze', filter: 'agNumberColumnFilter' },
    { field: 'total', filter: 'agNumberColumnFilter' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 150,
        filter: true,
    },
    onFilterOpened: onFilterOpened,
    onFilterChanged: onFilterChanged,
    onFilterModified: onFilterModified,
};

function onFilterOpened(e: FilterOpenedEvent) {
    console.log('onFilterOpened', e);
}

function onFilterChanged(e: FilterChangedEvent) {
    console.log('onFilterChanged', e);
    console.log('gridApi.getFilterModel() =>', e.api.getFilterModel());
}

function onFilterModified(e: FilterModifiedEvent) {
    console.log('onFilterModified', e);
    console.log('filterInstance.getModel() =>', e.filterInstance.getModel());
    console.log(
        'filterInstance.getModelFromUi() =>',
        (e.filterInstance as unknown as IProvidedFilter).getModelFromUi()
    );
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
