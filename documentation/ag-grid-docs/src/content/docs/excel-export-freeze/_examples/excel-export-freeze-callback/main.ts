import type { ColDef, ColGroupDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    CsvExportModule,
    ModuleRegistry,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, ExcelExportModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    CsvExportModule,
    ExcelExportModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: (ColDef | ColGroupDef)[] = [
    {
        headerName: 'Athlete Details',
        children: [
            {
                field: 'athlete',
                width: 180,
            },
            {
                field: 'age',
                width: 90,
            },
            { headerName: 'Country', field: 'country', width: 140 },
        ],
    },
    {
        headerName: 'Sports Results',
        children: [
            { field: 'sport', width: 140 },
            {
                columnGroupShow: 'closed',
                field: 'total',
                width: 100,
            },
            {
                columnGroupShow: 'open',
                field: 'gold',
                width: 100,
            },
            {
                columnGroupShow: 'open',
                field: 'silver',
                width: 100,
            },
            {
                columnGroupShow: 'open',
                field: 'bronze',
                width: 100,
            },
        ],
    },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    // debug: true,
    columnDefs: columnDefs,
    rowData: null,
    defaultExcelExportParams: {
        freezeRows: (params) => {
            const node = params.node;
            if (node == null) {
                return true;
            }
            return node.rowIndex! < 20;
        },
        freezeColumns: (params) => params.column.getColId() !== 'sport',
    },
};

function onBtExport() {
    gridApi!.exportDataAsExcel();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
