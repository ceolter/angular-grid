import type { GetRowIdParams, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ColumnApiModule,
    ModuleRegistry,
    RowSelectionModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { CellSelectionModule, RowGroupingModule, StatusBarModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ColumnApiModule,
    TextFilterModule,
    RowSelectionModule,
    ClientSideRowModelModule,
    CellSelectionModule,
    RowGroupingModule,
    StatusBarModule,
    ValidationModule /* Development Only */,
]);

function getInitialData() {
    const data = [];
    for (let i = 0; i < 5; i++) {
        data.push(createItem());
    }

    return data;
}

let immutableStore: any[] = [];

function addFiveItems(append: boolean) {
    const newStore = immutableStore.slice();
    for (let i = 0; i < 5; i++) {
        const newItem = createItem();
        if (append) {
            newStore.push(newItem);
        } else {
            newStore.splice(0, 0, newItem);
        }
    }
    immutableStore = newStore;
    gridApi!.setGridOption('rowData', immutableStore);
}

function removeSelected() {
    const selectedRowNodes = gridApi!.getSelectedNodes();
    const selectedIds = selectedRowNodes.map(function (rowNode) {
        return rowNode.id;
    });
    immutableStore = immutableStore.filter(function (dataItem) {
        return selectedIds.indexOf(dataItem.symbol) < 0;
    });
    gridApi!.setGridOption('rowData', immutableStore);
}

function setSelectedToGroup(newGroup: string) {
    const selectedRowNodes = gridApi!.getSelectedNodes();
    const selectedIds = selectedRowNodes.map(function (rowNode) {
        return rowNode.id;
    });
    immutableStore = immutableStore.map(function (dataItem) {
        const itemSelected = selectedIds.indexOf(dataItem.symbol) >= 0;
        if (itemSelected) {
            return {
                // symbol and price stay the same
                symbol: dataItem.symbol,
                price: dataItem.price,
                // group gets the group
                group: newGroup,
            };
        } else {
            return dataItem;
        }
    });
    gridApi!.setGridOption('rowData', immutableStore);
}

function updatePrices() {
    const newStore: any[] = [];
    immutableStore.forEach((item) => {
        newStore.push({
            // use same symbol as last time, this is the unique id
            symbol: item.symbol,
            // group also stays the same
            group: item.group,
            // add random price
            price: Math.floor(Math.random() * 100),
        });
    });
    immutableStore = newStore;
    gridApi!.setGridOption('rowData', immutableStore);
}

function filter(list: any[], callback: any) {
    const filteredList: any[] = [];
    list.forEach((item) => {
        if (callback(item)) {
            filteredList.push(item);
        }
    });
    return filteredList;
}

function createItem() {
    const item = {
        group: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        symbol: createUniqueRandomSymbol(),
        price: Math.floor(Math.random() * 100),
    };
    return item;
}

function onGroupingEnabled(enabled: boolean) {
    setGroupingEnabled(enabled, gridApi!);
}

function setGroupingEnabled(enabled: boolean, api: GridApi) {
    if (enabled) {
        api.applyColumnState({
            state: [
                { colId: 'group', rowGroup: true, hide: true },
                { colId: 'symbol', hide: true },
            ],
        });
    } else {
        api.applyColumnState({
            state: [
                { colId: 'group', rowGroup: false, hide: false },
                { colId: 'symbol', hide: false },
            ],
        });
    }

    setItemVisible('groupingOn', !enabled);
    setItemVisible('groupingOff', enabled);
}

function setItemVisible(id: string, visible: boolean) {
    const element = document.querySelector('#' + id)! as any;
    element.style.display = visible ? 'inline' : 'none';
}

// creates a unique symbol, eg 'ADG' or 'ZJD'
function createUniqueRandomSymbol() {
    let symbol: any;
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let isUnique = false;
    while (!isUnique) {
        symbol = '';
        // create symbol
        for (let i = 0; i < 3; i++) {
            symbol += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        // check uniqueness
        isUnique = true;
        immutableStore.forEach((oldItem) => {
            if (oldItem.symbol === symbol) {
                isUnique = false;
            }
        });
    }

    return symbol;
}

function reverseItems() {
    immutableStore.reverse();
    gridApi!.setGridOption('rowData', immutableStore);
}

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { headerName: 'Symbol', field: 'symbol' },
        { headerName: 'Price', field: 'price' },
        { headerName: 'Group', field: 'group' },
    ],
    defaultColDef: {
        width: 250,
    },
    rowSelection: {
        mode: 'multiRow',
    },
    cellSelection: true,
    autoGroupColumnDef: {
        headerName: 'Symbol',
        cellRenderer: 'agGroupCellRenderer',
        field: 'symbol',
    },
    statusBar: {
        statusPanels: [{ statusPanel: 'agAggregationComponent', align: 'right' }],
    },
    groupDefaultExpanded: 1,
    rowData: immutableStore,
    getRowId: (params: GetRowIdParams) => {
        return params.data.symbol;
    },
    onGridReady: (params) => {
        immutableStore = [];
        immutableStore = getInitialData();
        params.api.setGridOption('rowData', immutableStore);
        setGroupingEnabled(false, params.api);
    },
};

// after page is loaded, create the grid.
document.addEventListener('DOMContentLoaded', function () {
    const eGridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(eGridDiv, gridOptions);
});
