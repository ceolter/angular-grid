import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    FirstDataRenderedEvent,
    GridApi,
    GridOptions,
    ISetFilterParams,
    ValueFormatterParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    SetFilterModule,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        {
            headerName: 'No Value Formatter',
            field: 'country',
            valueFormatter: countryValueFormatter,
            filter: 'agSetColumnFilter',
            filterParams: {
                // no value formatter!
            },
        },
        {
            headerName: 'With Value Formatter',
            field: 'country',
            valueFormatter: countryValueFormatter,
            filter: 'agSetColumnFilter',
            filterParams: {
                valueFormatter: countryValueFormatter,
            } as ISetFilterParams,
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 225,
        floatingFilter: true,
    },
    sideBar: 'filters',
    onFirstDataRendered: onFirstDataRendered,
};

function countryValueFormatter(params: ValueFormatterParams) {
    const value = params.value;
    return value + ' (' + COUNTRY_CODES[value].toUpperCase() + ')';
}

function printFilterModel() {
    const filterModel = gridApi!.getFilterModel();
    console.log(filterModel);
}

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.getToolPanelInstance('filters')!.expandFilters();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            // only return data that has corresponding country codes
            const dataWithFlags = data.filter(function (d: any) {
                return COUNTRY_CODES[d.country];
            });

            gridApi!.setGridOption('rowData', dataWithFlags);
        });
});

var COUNTRY_CODES: Record<string, string> = {
    Ireland: 'ie',
    Luxembourg: 'lu',
    Belgium: 'be',
    Spain: 'es',
    France: 'fr',
    Germany: 'de',
    Sweden: 'se',
    Italy: 'it',
    Greece: 'gr',
    Iceland: 'is',
    Portugal: 'pt',
    Malta: 'mt',
    Norway: 'no',
    Brazil: 'br',
    Argentina: 'ar',
    Colombia: 'co',
    Peru: 'pe',
    Venezuela: 've',
    Uruguay: 'uy',
};
