import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    ColDef,
    GridApi,
    GridOptions,
    IDateFilterParams,
    IMultiFilterParams,
    IProvidedFilterParams,
    ISetFilter,
    ISetFilterParams,
    ITextFilterParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { MultiFilterModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    MenuModule,
    MultiFilterModule,
    SetFilterModule,
]);

const defaultFilterParams: IProvidedFilterParams = { readOnly: true };

const columnDefs: ColDef[] = [
    {
        field: 'athlete',
        filter: 'agTextColumnFilter',
        filterParams: defaultFilterParams,
    },
    {
        field: 'age',
        filter: 'agNumberColumnFilter',
        filterParams: defaultFilterParams,
    },
    {
        field: 'country',
        filter: 'agSetColumnFilter',
        filterParams: defaultFilterParams,
    },
    {
        field: 'year',
        maxWidth: 120,
        filter: 'agNumberColumnFilter',
        filterParams: defaultFilterParams,
    },
    {
        field: 'date',
        minWidth: 215,
        filter: 'agDateColumnFilter',
        filterParams: {
            readOnly: true,
            comparator: dateComparator,
        } as IDateFilterParams,
        suppressHeaderMenuButton: true,
    },
    {
        field: 'sport',
        suppressHeaderMenuButton: true,
        filter: 'agMultiColumnFilter',
        filterParams: {
            filters: [
                { filter: 'agTextColumnFilter', filterParams: { readOnly: true } as ITextFilterParams },
                { filter: 'agSetColumnFilter', filterParams: { readOnly: true } as ISetFilterParams },
            ],
            readOnly: true,
        } as IMultiFilterParams,
    },
    { field: 'gold', filterParams: defaultFilterParams },
    { field: 'silver', filterParams: defaultFilterParams },
    { field: 'bronze', filterParams: defaultFilterParams },
    { field: 'total', filter: false },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 150,
        filter: true,
        floatingFilter: true,
    },
};

function irelandAndUk() {
    gridApi!.setColumnFilterModel('country', { values: ['Ireland', 'Great Britain'] }).then(() => {
        gridApi!.onFilterChanged();
    });
}

function clearCountryFilter() {
    gridApi!.setColumnFilterModel('country', null).then(() => {
        gridApi!.onFilterChanged();
    });
}

function destroyCountryFilter() {
    gridApi!.destroyFilter('country');
}

function endingStan() {
    gridApi!.getColumnFilterInstance<ISetFilter>('country').then((countryFilterComponent) => {
        const countriesEndingWithStan = countryFilterComponent!.getFilterKeys().filter(function (value: any) {
            return value.indexOf('stan') === value.length - 4;
        });

        gridApi!.setColumnFilterModel('country', { values: countriesEndingWithStan }).then(() => {
            gridApi!.onFilterChanged();
        });
    });
}

function printCountryModel() {
    const model = gridApi!.getColumnFilterModel('country');

    if (model) {
        console.log('Country model is: ' + JSON.stringify(model));
    } else {
        console.log('Country model filter is not active');
    }
}

function sportStartsWithS() {
    gridApi!
        .setColumnFilterModel('sport', {
            filterModels: [
                {
                    type: 'startsWith',
                    filter: 's',
                },
            ],
        })
        .then(() => {
            gridApi!.onFilterChanged();
        });
}

function sportEndsWithG() {
    gridApi!
        .setColumnFilterModel('sport', {
            filterModels: [
                {
                    type: 'endsWith',
                    filter: 'g',
                },
            ],
        })
        .then(() => {
            gridApi!.onFilterChanged();
        });
}

function sportsCombined() {
    gridApi!
        .setColumnFilterModel('sport', {
            filterModels: [
                {
                    conditions: [
                        {
                            type: 'endsWith',
                            filter: 'g',
                        },
                        {
                            type: 'startsWith',
                            filter: 's',
                        },
                    ],
                    operator: 'AND',
                },
            ],
        })
        .then(() => {
            gridApi!.onFilterChanged();
        });
}

function ageBelow25() {
    gridApi!
        .setColumnFilterModel('age', {
            type: 'lessThan',
            filter: 25,
            filterTo: null,
        })
        .then(() => {
            gridApi!.onFilterChanged();
        });
}

function ageAbove30() {
    gridApi!
        .setColumnFilterModel('age', {
            type: 'greaterThan',
            filter: 30,
            filterTo: null,
        })
        .then(() => {
            gridApi!.onFilterChanged();
        });
}

function ageBelow25OrAbove30() {
    gridApi!
        .setColumnFilterModel('age', {
            conditions: [
                {
                    type: 'greaterThan',
                    filter: 30,
                    filterTo: null,
                },
                {
                    type: 'lessThan',
                    filter: 25,
                    filterTo: null,
                },
            ],
            operator: 'OR',
        })
        .then(() => {
            gridApi!.onFilterChanged();
        });
}

function ageBetween25And30() {
    gridApi!
        .setColumnFilterModel('age', {
            type: 'inRange',
            filter: 25,
            filterTo: 30,
        })
        .then(() => {
            gridApi!.onFilterChanged();
        });
}

function clearAgeFilter() {
    gridApi!.setColumnFilterModel('age', null).then(() => {
        gridApi!.onFilterChanged();
    });
}

function after2010() {
    gridApi!
        .setColumnFilterModel('date', {
            type: 'greaterThan',
            dateFrom: '2010-01-01',
            dateTo: null,
        })
        .then(() => {
            gridApi!.onFilterChanged();
        });
}

function before2012() {
    gridApi!
        .setColumnFilterModel('date', {
            type: 'lessThan',
            dateFrom: '2012-01-01',
            dateTo: null,
        })
        .then(() => {
            gridApi!.onFilterChanged();
        });
}

function dateCombined() {
    gridApi!
        .setColumnFilterModel('date', {
            conditions: [
                {
                    type: 'lessThan',
                    dateFrom: '2012-01-01',
                    dateTo: null,
                },
                {
                    type: 'greaterThan',
                    dateFrom: '2010-01-01',
                    dateTo: null,
                },
            ],
            operator: 'OR',
        })
        .then(() => {
            gridApi!.onFilterChanged();
        });
}

function clearDateFilter() {
    gridApi!.setColumnFilterModel('date', null).then(() => {
        gridApi!.onFilterChanged();
    });
}

function clearSportFilter() {
    gridApi!.setColumnFilterModel('sport', null).then(() => {
        gridApi!.onFilterChanged();
    });
}

function dateComparator(filterLocalDateAtMidnight: Date, cellValue: Date) {
    const dateAsString = cellValue;
    if (dateAsString == null) return -1;
    const dateParts = dateAsString.split('/');
    const cellDate = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]));

    if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
        return 0;
    }

    if (cellDate < filterLocalDateAtMidnight) {
        return -1;
    }

    if (cellDate > filterLocalDateAtMidnight) {
        return 1;
    }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
