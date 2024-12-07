import type { GridApi, GridOptions, ISetFilterParams, KeyCreatorParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    ValidationModule,
    ValueFormatterParams,
    createGrid,
} from 'ag-grid-community';
import {
    ColumnMenuModule,
    ColumnsToolPanelModule,
    ContextMenuModule,
    FiltersToolPanelModule,
    SetFilterModule,
    TreeDataModule,
} from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    SetFilterModule,
    TreeDataModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'employmentType' },
        {
            field: 'startDate',
            valueFormatter: (params) => (params.value ? params.value.toLocaleDateString() : params.value),
            filterParams: {
                treeList: true,
                comparator: reverseOrderComparator,
            } as ISetFilterParams<any, Date>,
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 200,
        filter: true,
        floatingFilter: true,
        cellDataType: false,
    },
    autoGroupColumnDef: {
        headerName: 'Employee',
        field: 'employeeName',
        cellRendererParams: {
            suppressCount: true,
        },
        filter: 'agSetColumnFilter',
        filterParams: {
            treeList: true,
            keyCreator: (params: KeyCreatorParams) => (params.value ? params.value.join('#') : null),
            comparator: arrayComparator,
        } as ISetFilterParams<any, string[]>,
        minWidth: 280,
    },
    treeData: true,
    groupDefaultExpanded: -1,
    getDataPath: (data) => {
        return data.dataPath;
    },
    getRowId: (params) => String(params.data.employeeId),
};

function arrayComparator(a: string[] | null, b: string[] | null): number {
    if (a == null) {
        return b == null ? 0 : -1;
    } else if (b == null) {
        return 1;
    }
    for (let i = 0; i < a.length; i++) {
        if (i >= b.length) {
            return 1;
        }
        const comparisonValue = reverseOrderComparator(a[i], b[i]);
        if (comparisonValue !== 0) {
            return comparisonValue;
        }
    }
    return 0;
}

function reverseOrderComparator(a: any, b: any): number {
    return a < b ? 1 : a > b ? -1 : 0;
}

function processData(data: any[]) {
    const flattenedData: any[] = [];
    const flattenRowRecursive = (row: any, parentPath: string[]) => {
        const dateParts = row.startDate.split('/');
        const startDate = new Date(parseInt(dateParts[2]), dateParts[1] - 1, dateParts[0]);
        const dataPath = [...parentPath, row.employeeName];
        flattenedData.push({ ...row, dataPath, startDate });
        if (row.underlings) {
            row.underlings.forEach((underling: any) => flattenRowRecursive(underling, dataPath));
        }
    };
    data.forEach((row) => flattenRowRecursive(row, []));
    return flattenedData;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/tree-data.json')
        .then((response) => response.json())
        .then((data) => gridApi!.setGridOption('rowData', processData(data)));
});
