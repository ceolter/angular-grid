import type { ColDef, GridApi, GridOptions, IRowNode } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    RowApiModule,
    RowSelectionModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, ExcelExportModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    TextFilterModule,
    NumberFilterModule,
    RowSelectionModule,
    RowApiModule,
    ClientSideRowModelModule,
    ExcelExportModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    { field: 'athlete', minWidth: 200 },
    { field: 'age' },
    { field: 'country', minWidth: 200 },
    { field: 'year' },
    { field: 'date', minWidth: 150 },
    { field: 'sport', minWidth: 150 },
    { field: 'gold' },
    { field: 'silver' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        filter: true,
        minWidth: 100,
        flex: 1,
    },

    columnDefs,
    rowSelection: {
        mode: 'multiRow',
    },
};

function onBtExport() {
    const spreadsheets: string[] = [];

    let nodesToExport: IRowNode[] = [];
    gridApi!.forEachNode((node, index) => {
        nodesToExport.push(node);

        if (index % 100 === 99) {
            gridApi!.setNodesSelected({ nodes: nodesToExport, newValue: true });
            spreadsheets.push(
                gridApi!.getSheetDataForExcel({
                    onlySelected: true,
                })!
            );

            gridApi!.deselectAll();
            nodesToExport = [];
        }
    });

    // check if the last page was exported

    if (gridApi!.getSelectedNodes().length) {
        spreadsheets.push(
            gridApi!.getSheetDataForExcel({
                onlySelected: true,
            })!
        );
        gridApi!.deselectAll();
    }

    gridApi!.exportMultipleSheetsAsExcel({
        data: spreadsheets,
        fileName: 'ag-grid.xlsx',
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
