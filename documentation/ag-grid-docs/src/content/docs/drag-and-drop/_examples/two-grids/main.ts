import type { ColDef, GetRowIdParams, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    DragAndDropModule,
    ModuleRegistry,
    RowApiModule,
    RowDragModule,
    RowStyleModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    DragAndDropModule,
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
    { field: 'id', dndSource: true },
    { field: 'color' },
    { field: 'value1' },
    { field: 'value2' },
];

const rightColumnDefs: ColDef[] = [
    { field: 'id', dndSource: true },
    { field: 'color' },
    { field: 'value1' },
    { field: 'value2' },
];

let leftApi: GridApi;
const leftGridOptions: GridOptions = {
    defaultColDef: {
        flex: 1,
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
    columnDefs: leftColumnDefs,
};

let rightApi: GridApi;
const rightGridOptions: GridOptions = {
    defaultColDef: {
        flex: 1,
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
    columnDefs: rightColumnDefs,
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

function binDragOver(event: any) {
    const dragSupported = event.dataTransfer.types.length;

    if (dragSupported) {
        event.dataTransfer.dropEffect = 'move';
        event.preventDefault();
    }
}

function binDrop(event: any) {
    event.preventDefault();

    const jsonData = event.dataTransfer.getData('application/json');
    const data = JSON.parse(jsonData);

    // if data missing or data has no id, do nothing
    if (!data || data.id == null) {
        return;
    }

    const transaction = {
        remove: [data],
    };

    const rowIsInLeftGrid = !!leftApi!.getRowNode(data.id);
    if (rowIsInLeftGrid) {
        leftApi!.applyTransaction(transaction);
    }

    const rowIsInRightGrid = !!rightApi!.getRowNode(data.id);
    if (rowIsInRightGrid) {
        rightApi!.applyTransaction(transaction);
    }
}

function dragStart(event: any, color: string) {
    const newItem = createDataItem(color);
    const jsonData = JSON.stringify(newItem);

    event.dataTransfer.setData('application/json', jsonData);
}

function gridDragOver(event: any) {
    const dragSupported = event.dataTransfer.types.length;

    if (dragSupported) {
        event.dataTransfer.dropEffect = 'copy';
        event.preventDefault();
    }
}

function gridDrop(event: any, grid: string) {
    event.preventDefault();

    const jsonData = event.dataTransfer.getData('application/json');
    const data = JSON.parse(jsonData);

    // if data missing or data has no it, do nothing
    if (!data || data.id == null) {
        return;
    }

    const gridApi = grid == 'left' ? leftApi! : rightApi!;

    // do nothing if row is already in the grid, otherwise we would have duplicates
    const rowAlreadyInGrid = !!gridApi!.getRowNode(data.id);
    if (rowAlreadyInGrid) {
        console.log('not adding row to avoid duplicates in the grid');
        return;
    }

    const transaction = {
        add: [data],
    };
    gridApi.applyTransaction(transaction);
}

const leftGridDiv = document.querySelector<HTMLElement>('#eLeftGrid')!;
leftApi = createGrid(leftGridDiv, leftGridOptions);

const rightGridDiv = document.querySelector<HTMLElement>('#eRightGrid')!;
rightApi = createGrid(rightGridDiv, rightGridOptions);

if (typeof window !== 'undefined') {
    // Attach external event handlers to window so they can be called from index.html
    (<any>window).binDragOver = binDragOver;
    (<any>window).binDrop = binDrop;
    (<any>window).dragStart = dragStart;
    (<any>window).gridDragOver = gridDragOver;
    (<any>window).gridDrop = gridDrop;
}
