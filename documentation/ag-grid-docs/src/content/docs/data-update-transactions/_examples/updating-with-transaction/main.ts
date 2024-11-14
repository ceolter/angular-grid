import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions, RowNodeTransaction } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { getData } from './data';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'make' },
        { field: 'model' },
        { field: 'price' },
        { field: 'zombies' },
        { field: 'style' },
        { field: 'clothes' },
    ],
    defaultColDef: {
        flex: 1,
    },
    rowData: getData(),
    rowSelection: { mode: 'multiRow' },
};

let newCount = 1;

function createNewRowData() {
    const newData = {
        make: 'Toyota ' + newCount,
        model: 'Celica ' + newCount,
        price: 35000 + newCount * 17,
        zombies: 'Headless',
        style: 'Little',
        clothes: 'Airbag',
    };
    newCount++;
    return newData;
}

function getRowData() {
    const rowData: any[] = [];
    gridApi!.forEachNode(function (node) {
        rowData.push(node.data);
    });
    console.log('Row Data:');
    console.table(rowData);
}

function clearData() {
    const rowData: any[] = [];
    gridApi!.forEachNode(function (node) {
        rowData.push(node.data);
    });
    const res = gridApi!.applyTransaction({
        remove: rowData,
    })!;
    printResult(res);
}

function addItems(addIndex: number | undefined) {
    const newItems = [createNewRowData(), createNewRowData(), createNewRowData()];
    const res = gridApi!.applyTransaction({
        add: newItems,
        addIndex: addIndex,
    })!;
    printResult(res);
}

function updateItems() {
    // update the first 2 items
    const itemsToUpdate: any[] = [];
    gridApi!.forEachNodeAfterFilterAndSort(function (rowNode, index) {
        // only do first 2
        if (index >= 2) {
            return;
        }

        const data = rowNode.data;
        data.price = Math.floor(Math.random() * 20000 + 20000);
        itemsToUpdate.push(data);
    });
    const res = gridApi!.applyTransaction({ update: itemsToUpdate })!;
    printResult(res);
}

function onRemoveSelected() {
    const selectedData = gridApi!.getSelectedRows();
    const res = gridApi!.applyTransaction({ remove: selectedData })!;
    printResult(res);
}

function printResult(res: RowNodeTransaction) {
    console.log('---------------------------------------');
    if (res.add) {
        res.add.forEach((rowNode) => {
            console.log('Added Row Node', rowNode);
        });
    }
    if (res.remove) {
        res.remove.forEach((rowNode) => {
            console.log('Removed Row Node', rowNode);
        });
    }
    if (res.update) {
        res.update.forEach((rowNode) => {
            console.log('Updated Row Node', rowNode);
        });
    }
}

// wait for the document to be loaded, otherwise
// AG Grid will not find the div in the document.
document.addEventListener('DOMContentLoaded', function () {
    const eGridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(eGridDiv, gridOptions);
});
