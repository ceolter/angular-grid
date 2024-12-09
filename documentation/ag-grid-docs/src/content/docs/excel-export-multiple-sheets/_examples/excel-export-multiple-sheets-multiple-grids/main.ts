import type {
    ColDef,
    GetRowIdParams,
    GridApi,
    GridOptions,
    GridReadyEvent,
    ICellRendererComp,
    ICellRendererParams,
} from 'ag-grid-community';
import {
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    RowDragModule,
    RowSelectionModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, ExcelExportModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ClientSideRowModelApiModule,
    TextFilterModule,
    RowDragModule,
    RowSelectionModule,
    ClientSideRowModelModule,
    ColumnMenuModule,
    ContextMenuModule,
    ExcelExportModule,
    ValidationModule /* Development Only */,
]);

class SportRenderer implements ICellRendererComp {
    eGui!: HTMLElement;

    init(params: ICellRendererParams) {
        this.eGui = document.createElement('i');

        this.eGui.addEventListener('click', () => {
            params.api.applyTransaction({ remove: [params.node.data] });
        });

        this.eGui.classList.add('far', 'fa-trash-alt');
        this.eGui.style.cursor = 'pointer';
    }

    getGui() {
        return this.eGui;
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }
}

const leftColumnDefs: ColDef[] = [
    {
        rowDrag: true,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        rowDragText: (params, dragItemCount) => {
            if (dragItemCount > 1) {
                return dragItemCount + ' athletes';
            }
            return params.rowNode!.data.athlete;
        },
    },
    { field: 'athlete' },
    { field: 'sport' },
];

const rightColumnDefs: ColDef[] = [
    {
        rowDrag: true,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        rowDragText: (params, dragItemCount) => {
            if (dragItemCount > 1) {
                return dragItemCount + ' athletes';
            }
            return params.rowNode!.data.athlete;
        },
    },
    { field: 'athlete' },
    { field: 'sport' },
    {
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        maxWidth: 50,
        cellRenderer: SportRenderer,
    },
];

let leftApi: GridApi;
const leftGridOptions: GridOptions = {
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    rowSelection: { mode: 'multiRow' },
    rowDragMultiRow: true,
    getRowId: (params: GetRowIdParams) => {
        return params.data.athlete;
    },
    rowDragManaged: true,
    suppressMoveWhenRowDragging: true,
    columnDefs: leftColumnDefs,
    onGridReady: (params) => {
        addGridDropZone(params);
    },
};
let rightApi: GridApi;
const rightGridOptions: GridOptions = {
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    getRowId: (params: GetRowIdParams) => {
        return params.data.athlete;
    },
    rowDragManaged: true,
    columnDefs: rightColumnDefs,
};

function addGridDropZone(params: GridReadyEvent) {
    const dropZoneParams = rightApi!.getRowDropZoneParams({
        onDragStop: (params) => {
            const nodes = params.nodes;

            leftApi!.applyTransaction({
                remove: nodes.map(function (node) {
                    return node.data;
                }),
            });
        },
    });

    params.api.addRowDropZone(dropZoneParams);
}

function loadGrid(options: GridOptions, oldApi: GridApi, side: string, data: any[]) {
    const grid = document.querySelector<HTMLElement>('#e' + side + 'Grid')!;

    oldApi?.destroy();
    options.rowData = data;
    return createGrid(grid, options);
}

function loadGrids() {
    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            const athletes: any[] = [];
            let i = 0;

            while (athletes.length < 20 && i < data.length) {
                const pos = i++;
                if (
                    athletes.some(function (rec) {
                        return rec.athlete === data[pos].athlete;
                    })
                ) {
                    continue;
                }
                athletes.push(data[pos]);
            }

            leftApi = loadGrid(leftGridOptions, leftApi, 'Left', athletes.slice(0, athletes.length / 2));
            rightApi = loadGrid(rightGridOptions, rightApi, 'Right', athletes.slice(athletes.length / 2));
        });
}

function onExcelExport() {
    const spreadsheets = [];

    spreadsheets.push(
        leftApi!.getSheetDataForExcel({ sheetName: 'Athletes' })!,
        rightApi!.getSheetDataForExcel({ sheetName: 'Selected Athletes' })!
    );

    // could be leftGridOptions or rightGridOptions
    leftApi!.exportMultipleSheetsAsExcel({
        data: spreadsheets,
        fileName: 'ag-grid.xlsx',
    });
}

const resetBtn = document.querySelector('button.reset')!;
const exportBtn = document.querySelector('button.excel')!;

resetBtn.addEventListener('click', () => {
    loadGrids();
});

exportBtn.addEventListener('click', () => {
    onExcelExport();
});

loadGrids();
