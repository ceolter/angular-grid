import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions, IDateFilterParams, IRowNode } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    SetFilterModule,
]);

const dateFilterParams: IDateFilterParams = {
    comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
        const cellDate = asDate(cellValue);

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

const columnDefs: ColDef[] = [
    { field: 'athlete', minWidth: 180 },
    { field: 'age', filter: 'agNumberColumnFilter', maxWidth: 80 },
    { field: 'country' },
    { field: 'year', maxWidth: 90 },
    {
        field: 'date',
        filter: 'agDateColumnFilter',
        filterParams: dateFilterParams,
    },
    { field: 'gold', filter: 'agNumberColumnFilter' },
    { field: 'silver', filter: 'agNumberColumnFilter' },
    { field: 'bronze', filter: 'agNumberColumnFilter' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 120,
        filter: true,
    },
    isExternalFilterPresent: isExternalFilterPresent,
    doesExternalFilterPass: doesExternalFilterPass,
};

let ageType = 'everyone';

function isExternalFilterPresent(): boolean {
    // if ageType is not everyone, then we are filtering
    return ageType !== 'everyone';
}

function doesExternalFilterPass(node: IRowNode<IOlympicData>): boolean {
    if (node.data) {
        switch (ageType) {
            case 'below25':
                return node.data.age < 25;
            case 'between25and50':
                return node.data.age >= 25 && node.data.age <= 50;
            case 'above50':
                return node.data.age > 50;
            case 'dateAfter2008':
                return asDate(node.data.date) > new Date(2008, 1, 1);
            default:
                return true;
        }
    }
    return true;
}

function asDate(dateAsString: string) {
    const splitFields = dateAsString.split('/');
    return new Date(
        Number.parseInt(splitFields[2]),
        Number.parseInt(splitFields[1]) - 1,
        Number.parseInt(splitFields[0])
    );
}

function externalFilterChanged(newValue: string) {
    ageType = newValue;
    gridApi!.onFilterChanged();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            (document.querySelector('#everyone') as HTMLInputElement).checked = true;
            gridApi!.setGridOption('rowData', data);
        });
});
