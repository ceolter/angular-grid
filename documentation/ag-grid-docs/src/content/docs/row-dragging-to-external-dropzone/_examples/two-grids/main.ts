import type {
    ColDef,
    GetRowIdParams,
    GridApi,
    GridOptions,
    GridReadyEvent,
    RowDropZoneParams,
} from 'ag-grid-community';
import {
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    RowApiModule,
    RowDragModule,
    RowStyleModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    ClientSideRowModelApiModule,
    RowApiModule,
    TextFilterModule,
    RowDragModule,
    RowStyleModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

let rowIdSequence = 100;

const leftColumnDefs: ColDef[] = [
    { field: 'id', rowDrag: true },
    { field: 'color' },
    { field: 'value1' },
    { field: 'value2' },
];

const rightColumnDefs: ColDef[] = [
    { field: 'id', rowDrag: true },
    { field: 'color' },
    { field: 'value1' },
    { field: 'value2' },
];
let leftApi: GridApi;
const leftGridOptions: GridOptions = {
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    rowClassRules: {
        'red-row': 'data.color == "Red"',
        'green-row': 'data.color == "Green"',
        'blue-row': 'data.color == "Blue"',
    },
    getRowId: (params: GetRowIdParams) => {
        return String(params.data.id);
    },
    rowData: createLeftRowData(),
    rowDragManaged: true,
    suppressMoveWhenRowDragging: true,
    columnDefs: leftColumnDefs,
    onGridReady: (params) => {
        addBinZone(params);
        addGridDropZone(params, 'Right');
    },
};
let rightApi: GridApi;
const rightGridOptions: GridOptions = {
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    rowClassRules: {
        'red-row': 'data.color == "Red"',
        'green-row': 'data.color == "Green"',
        'blue-row': 'data.color == "Blue"',
    },
    getRowId: (params: GetRowIdParams) => {
        return String(params.data.id);
    },
    rowData: [],
    rowDragManaged: true,
    suppressMoveWhenRowDragging: true,
    columnDefs: rightColumnDefs,
    onGridReady: (params) => {
        addBinZone(params);
        addGridDropZone(params, 'Left');
    },
};

function createLeftRowData() {
    return ['Red', 'Green', 'Blue'].map(function (color) {
        return createDataItem(color);
    });
}

function createDataItem(color: string) {
    return {
        id: rowIdSequence++,
        color: color,
        value1: Math.floor(Math.random() * 100),
        value2: Math.floor(Math.random() * 100),
    };
}

function addRecordToGrid(side: string, data: any) {
    // if data missing or data has no it, do nothing
    if (!data || data.id == null) {
        return;
    }

    let gridApi = side === 'left' ? leftApi : rightApi,
        // do nothing if row is already in the grid, otherwise we would have duplicates
        rowAlreadyInGrid = !!gridApi!.getRowNode(data.id),
        transaction;

    if (rowAlreadyInGrid) {
        console.log('not adding row to avoid duplicates in the grid');
        return;
    }

    transaction = {
        add: [data],
    };

    gridApi!.applyTransaction(transaction);
}

function onFactoryButtonClick(e: any) {
    const button = e.currentTarget,
        buttonColor = button.getAttribute('data-color'),
        side = button.getAttribute('data-side'),
        data = createDataItem(buttonColor);

    addRecordToGrid(side, data);
}

function binDrop(data: any) {
    // if data missing or data has no id, do nothing
    if (!data || data.id == null) {
        return;
    }

    const transaction = {
        remove: [data],
    };

    [leftApi, rightApi].forEach((api) => {
        const rowsInGrid = !!api!.getRowNode(data.id);

        if (rowsInGrid) {
            api!.applyTransaction(transaction);
        }
    });
}

function addBinZone(params: GridReadyEvent) {
    const eBin = document.querySelector('.bin') as any,
        icon = eBin.querySelector('i'),
        dropZone: RowDropZoneParams = {
            getContainer: () => {
                return eBin;
            },
            onDragEnter: () => {
                eBin.style.color = 'blue';
                icon.style.transform = 'scale(1.5)';
            },
            onDragLeave: () => {
                eBin.style.removeProperty('color');
                icon.style.transform = 'scale(1)';
            },
            onDragStop: (dragStopParams) => {
                binDrop(dragStopParams.node.data);
                eBin.style.removeProperty('color');
                icon.style.transform = 'scale(1)';
            },
        };

    params.api.addRowDropZone(dropZone);
}

function addGridDropZone(params: GridReadyEvent, side: string) {
    const grid = document.querySelector<HTMLElement>('#e' + side + 'Grid')!,
        dropZone: RowDropZoneParams = {
            getContainer: () => {
                return grid;
            },
            onDragStop: (params) => {
                addRecordToGrid(side.toLowerCase(), params.node.data);
            },
        };

    params.api.addRowDropZone(dropZone);
}

function loadGrid(side: string) {
    const grid = document.querySelector<HTMLElement>('#e' + side + 'Grid')!;
    if (side === 'Left') {
        leftApi = createGrid(grid, leftGridOptions);
    } else {
        rightApi = createGrid(grid, rightGridOptions);
    }
}

const buttons = document.querySelectorAll('button.factory');

for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', onFactoryButtonClick);
}

loadGrid('Left');
loadGrid('Right');
