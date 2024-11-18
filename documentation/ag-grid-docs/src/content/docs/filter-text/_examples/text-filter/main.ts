import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions, ITextFilterParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

function contains(target: string, lookingFor: string) {
    return target && target.indexOf(lookingFor) >= 0;
}

const athleteFilterParams: ITextFilterParams = {
    filterOptions: ['contains', 'notContains'],
    textFormatter: (r) => {
        if (r == null) return null;

        return r
            .toLowerCase()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/æ/g, 'ae')
            .replace(/ç/g, 'c')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/ñ/g, 'n')
            .replace(/[òóôõö]/g, 'o')
            .replace(/œ/g, 'oe')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[ýÿ]/g, 'y');
    },
    debounceMs: 200,
    maxNumConditions: 1,
};

const countryFilterParams: ITextFilterParams = {
    filterOptions: ['contains'],
    textMatcher: ({ value, filterText }) => {
        const aliases: Record<string, string> = {
            usa: 'united states',
            holland: 'netherlands',
            niall: 'ireland',
            sean: 'south africa',
            alberto: 'mexico',
            john: 'australia',
            xi: 'china',
        };

        const literalMatch = contains(value, filterText || '');

        return !!literalMatch || !!contains(value, aliases[filterText || '']);
    },
    trimInput: true,
    debounceMs: 1000,
};

const columnDefs: ColDef[] = [
    {
        field: 'athlete',
        filterParams: athleteFilterParams,
    },
    {
        field: 'country',
        filter: 'agTextColumnFilter',
        filterParams: countryFilterParams,
    },
    {
        field: 'sport',
        filter: 'agTextColumnFilter',
        filterParams: {
            caseSensitive: true,
            defaultOption: 'startsWith',
        } as ITextFilterParams,
    },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        flex: 1,
        filter: true,
    },
    columnDefs: columnDefs,
    rowData: null,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
