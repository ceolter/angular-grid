import type { GridApi, GridOptions, ISetFilterParams, KeyCreatorParams, ValueFormatterParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import {
    ColumnMenuModule,
    ColumnsToolPanelModule,
    ContextMenuModule,
    FiltersToolPanelModule,
    RowGroupingModule,
    SetFilterModule,
} from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    NumberFilterModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    SetFilterModule,
    RowGroupingModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'country', rowGroup: true, hide: true },
        { field: 'sport' },
        {
            field: 'date',
            valueFormatter: dateCellValueFormatter,
            filter: 'agSetColumnFilter',
            filterParams: {
                treeList: true,
                treeListFormatter: treeListFormatter,
                valueFormatter: dateFloatingFilterValueFormatter,
            } as ISetFilterParams<any, Date>,
        },
        {
            field: 'gold',
        },
    ],
    defaultColDef: {
        flex: 1,
        floatingFilter: true,
        cellDataType: false,
    },
    autoGroupColumnDef: {
        field: 'athlete',
        filter: 'agSetColumnFilter',
        filterParams: {
            treeList: true,
            keyCreator: (params: KeyCreatorParams) => (params.value ? params.value.join('#') : null),
            treeListFormatter: groupTreeListFormatter,
        } as ISetFilterParams,
        minWidth: 200,
    },
};

function dateCellValueFormatter(params: ValueFormatterParams) {
    return params.value ? params.value.toLocaleDateString() : '';
}

function dateFloatingFilterValueFormatter(params: ValueFormatterParams) {
    return params.value ? params.value.toLocaleDateString() : '(Blanks)';
}

function treeListFormatter(pathKey: string | null, level: number, _parentPathKeys: (string | null)[]): string {
    if (level === 1) {
        const date = new Date();
        date.setMonth(Number(pathKey) - 1);
        return date.toLocaleDateString(undefined, { month: 'long' });
    }
    return pathKey || '(Blanks)';
}

function groupTreeListFormatter(pathKey: string | null, level: number, _parentPathKeys: (string | null)[]): string {
    if (level === 0 && pathKey) {
        return pathKey + ' (' + pathKey.substring(0, 2).toUpperCase() + ')';
    }
    return pathKey || '(Blanks)';
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: any[]) => {
            const randomDays = [1, 4, 10, 15, 18];
            gridApi!.setGridOption('rowData', [
                {},
                ...data.map((row) => {
                    // generate pseudo-random dates
                    const dateParts = row.date.split('/');
                    const randomMonth = parseInt(dateParts[1]) - Math.floor(Math.random() * 3);
                    const newDate = new Date(
                        parseInt(dateParts[2]),
                        randomMonth,
                        randomMonth + randomDays[Math.floor(Math.random() * 5)]
                    );
                    return { ...row, date: newDate };
                }),
            ]);
        });
});
