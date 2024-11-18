import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    ColDef,
    GetLocaleTextParams,
    GridApi,
    GridOptions,
    IDateFilterParams,
    IFilterOptionDef,
    INumberFilterParams,
    ITextFilterParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

declare let window: any;

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const filterParams: INumberFilterParams = {
    filterOptions: [
        'empty',
        {
            displayKey: 'evenNumbers',
            displayName: 'Even Numbers',
            predicate: (_, cellValue) => cellValue != null && cellValue % 2 === 0,
            numberOfInputs: 0,
        },
        {
            displayKey: 'oddNumbers',
            displayName: 'Odd Numbers',
            predicate: (_, cellValue) => cellValue != null && cellValue % 2 !== 0,
            numberOfInputs: 0,
        },
        {
            displayKey: 'blanks',
            displayName: 'Blanks',
            predicate: (_, cellValue) => cellValue == null,
            numberOfInputs: 0,
        },
        {
            displayKey: 'age5YearsAgo',
            displayName: 'Age 5 Years Ago',
            predicate: ([fv1]: any[], cellValue) => cellValue == null || cellValue - 5 === fv1,
            numberOfInputs: 1,
        },
        {
            displayKey: 'betweenExclusive',
            displayName: 'Between (Exclusive)',
            predicate: ([fv1, fv2], cellValue) => cellValue == null || (fv1 < cellValue && fv2 > cellValue),
            numberOfInputs: 2,
        },
    ] as IFilterOptionDef[],
    maxNumConditions: 1,
};

const containsFilterParams: ITextFilterParams = {
    filterOptions: [
        'contains',
        {
            displayKey: 'startsA',
            displayName: 'Starts With "A"',
            predicate: (_, cellValue) => cellValue != null && cellValue.indexOf('A') === 0,
            numberOfInputs: 0,
        },
        {
            displayKey: 'startsN',
            displayName: 'Starts With "N"',
            predicate: (_, cellValue) => cellValue != null && cellValue.indexOf('N') === 0,
            numberOfInputs: 0,
        },
        {
            displayKey: 'regexp',
            displayName: 'Regular Expression',
            predicate: ([fv1]: any[], cellValue) => cellValue == null || new RegExp(fv1, 'gi').test(cellValue),
            numberOfInputs: 1,
        },
        {
            displayKey: 'betweenExclusive',
            displayName: 'Between (Exclusive)',
            predicate: ([fv1, fv2]: any[], cellValue) => cellValue == null || (fv1 < cellValue && fv2 > cellValue),
            numberOfInputs: 2,
        },
    ] as IFilterOptionDef[],
};

const equalsFilterParams: IDateFilterParams = {
    filterOptions: [
        'equals',
        {
            displayKey: 'equalsWithNulls',
            displayName: 'Equals (with Nulls)',
            predicate: ([filterValue]: any[], cellValue) => {
                if (cellValue == null) return true;

                const parts = cellValue.split('/');
                const cellDate = new Date(Number(parts[2]), Number(parts[1] - 1), Number(parts[0]));

                return cellDate.getTime() === filterValue.getTime();
            },
        },
        {
            displayKey: 'leapYear',
            displayName: 'Leap Year',
            predicate: (_, cellValue) => {
                if (cellValue == null) return true;

                const year = Number(cellValue.split('/')[2]);

                return year % 4 === 0 && year % 200 !== 0;
            },
            numberOfInputs: 0,
        },
        {
            displayKey: 'betweenExclusive',
            displayName: 'Between (Exclusive)',
            predicate: ([fv1, fv2]: any[], cellValue) => {
                if (cellValue == null) return true;

                const parts = cellValue.split('/');
                const cellDate = new Date(Number(parts[2]), Number(parts[1] - 1), Number(parts[0]));

                return cellDate.getTime() > fv1.getTime() && cellDate.getTime() < fv2.getTime();
            },
            numberOfInputs: 2,
        },
    ] as IFilterOptionDef[],
    comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
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
        return 0;
    },
};

const notEqualsFilterParams: ITextFilterParams = {
    filterOptions: [
        'notEqual',
        {
            displayKey: 'notEqualNoNulls',
            displayName: 'Not Equals without Nulls',
            predicate: ([filterValue], cellValue) => {
                if (cellValue == null) return false;

                return cellValue.toLowerCase() !== filterValue.toLowerCase();
            },
        },
    ] as IFilterOptionDef[],
};

const columnDefs: ColDef[] = [
    {
        field: 'athlete',
        filterParams: containsFilterParams,
    },
    {
        field: 'age',
        minWidth: 120,
        filter: 'agNumberColumnFilter',
        filterParams: filterParams,
    },
    {
        field: 'date',
        filter: 'agDateColumnFilter',
        filterParams: equalsFilterParams,
    },
    {
        field: 'country',
        filterParams: notEqualsFilterParams,
    },
    { field: 'gold', filter: 'agNumberColumnFilter' },
    { field: 'silver', filter: 'agNumberColumnFilter' },
    { field: 'bronze', filter: 'agNumberColumnFilter' },
    { field: 'total', filter: false },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 150,
        filter: true,
    },
    getLocaleText: (params: GetLocaleTextParams) => {
        if (params.key === 'notEqualNoNulls') {
            return '* Not Equals (No Nulls) *';
        }
        return params.defaultValue;
    },
};

function printState() {
    const filterState = gridApi!.getFilterModel();
    console.log('filterState: ', filterState);
}

function saveState() {
    window.filterState = gridApi!.getFilterModel();
    console.log('filter state saved');
}

function restoreState() {
    gridApi!.setFilterModel(window.filterState);
    console.log('filter state restored');
}

function resetState() {
    gridApi!.setFilterModel(null);
    console.log('column state reset');
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            gridApi!.setGridOption('rowData', data);
        });
});
