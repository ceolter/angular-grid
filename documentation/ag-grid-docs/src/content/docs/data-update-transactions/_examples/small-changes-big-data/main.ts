import type {
    ColDef,
    GetRowIdParams,
    GridApi,
    GridOptions,
    IAggFuncParams,
    IDoesFilterPassParams,
    IFilterComp,
    IFilterParams,
    IFilterType,
    IsGroupOpenByDefaultParams,
} from 'ag-grid-community';
import {
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    CustomFilterModule,
    HighlightChangesModule,
    ModuleRegistry,
    RowSelectionModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

import { createDataItem, getData } from './data';

ModuleRegistry.registerModules([
    ClientSideRowModelApiModule,
    TextFilterModule,
    RowSelectionModule,
    HighlightChangesModule,
    ClientSideRowModelModule,
    RowGroupingModule,
    CustomFilterModule,
    ValidationModule /* Development Only */,
]);

let aggCallCount = 0;
let compareCallCount = 0;
let filterCallCount = 0;
let gridApi: GridApi;
function myAggFunc(params: IAggFuncParams) {
    aggCallCount++;

    let total = 0;
    for (let i = 0; i < params.values.length; i++) {
        total += params.values[i];
    }
    return total;
}
function myComparator(a: any, b: any) {
    compareCallCount++;
    return a < b ? -1 : 1;
}

function getMyFilter(): IFilterType {
    class MyFilter implements IFilterComp {
        filterParams!: IFilterParams;
        filterValue!: number | null;
        eGui: any;
        eInput: any;

        init(params: IFilterParams) {
            this.filterParams = params;
            this.filterValue = null;

            this.eGui = document.createElement('div');
            this.eGui.innerHTML = '<div>Greater Than: <input type="text"/></div>';
            this.eInput = this.eGui.querySelector('input');
            this.eInput.addEventListener('input', () => {
                this.getValueFromInput();
                params.filterChangedCallback();
            });
        }

        getGui() {
            return this.eGui;
        }

        getValueFromInput() {
            const value = parseInt(this.eInput.value);
            this.filterValue = isNaN(value) ? null : value;
        }

        setModel(model: any) {
            this.eInput.value = model == null ? null : model.value;
            this.getValueFromInput();
        }

        getModel() {
            if (!this.isFilterActive()) {
                return null;
            }

            return { value: this.eInput.value };
        }

        isFilterActive() {
            return this.filterValue !== null;
        }

        doesFilterPass(params: IDoesFilterPassParams) {
            filterCallCount++;

            const { node } = params;
            const value = this.filterParams.getValue(node);

            return value > (this.filterValue || 0);
        }
    }
    return MyFilter;
}

const myFilter = getMyFilter();

function getRowId(params: GetRowIdParams) {
    return String(params.data.id);
}

function onBtDuplicate() {
    // get the first child of the
    const selectedRows = gridApi.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
        console.log('No rows selected!');
        return;
    }

    const newItems: any = [];
    selectedRows.forEach((selectedRow) => {
        const newItem = createDataItem(
            selectedRow.name,
            selectedRow.distro,
            selectedRow.laptop,
            selectedRow.city,
            selectedRow.value
        );
        newItems.push(newItem);
    });

    timeOperation('Duplicate', () => {
        gridApi.applyTransaction({ add: newItems });
    });
}

function onBtUpdate() {
    // get the first child of the
    const selectedRows = gridApi.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
        console.log('No rows selected!');
        return;
    }

    const updatedItems: any[] = [];
    selectedRows.forEach((oldItem) => {
        const newValue = Math.floor(Math.random() * 100) + 10;
        const newItem = createDataItem(
            oldItem.name,
            oldItem.distro,
            oldItem.laptop,
            oldItem.city,
            newValue,
            oldItem.id
        );
        updatedItems.push(newItem);
    });

    timeOperation('Update', () => {
        gridApi.applyTransaction({ update: updatedItems });
    });
}

function onBtDelete() {
    // get the first child of the
    const selectedRows = gridApi.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
        console.log('No rows selected!');
        return;
    }

    timeOperation('Delete', () => {
        gridApi.applyTransaction({ remove: selectedRows });
    });
}

function onBtClearSelection() {
    gridApi!.deselectAll();
}

function timeOperation(name: string, operation: any) {
    aggCallCount = 0;
    compareCallCount = 0;
    filterCallCount = 0;
    const start = new Date().getTime();
    operation();
    const end = new Date().getTime();
    console.log(
        name +
            ' finished in ' +
            (end - start) +
            'ms, aggCallCount = ' +
            aggCallCount +
            ', compareCallCount = ' +
            compareCallCount +
            ', filterCallCount = ' +
            filterCallCount
    );
}

const columnDefs: ColDef[] = [
    { field: 'city', rowGroup: true, hide: true },
    { field: 'laptop', rowGroup: true, hide: true },
    { field: 'distro', sort: 'asc', comparator: myComparator },
    { field: 'value', enableCellChangeFlash: true, aggFunc: myAggFunc, filter: myFilter },
];

const gridOptions: GridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        filter: true,
    },
    getRowId: getRowId,
    rowSelection: {
        mode: 'multiRow',
        groupSelects: 'descendants',
        headerCheckbox: false,
    },
    autoGroupColumnDef: {
        field: 'name',
    },
    onGridReady: (params) => {
        params.api.setFilterModel({
            value: { value: '50' },
        });

        timeOperation('Initialisation', () => {
            params.api.setGridOption('rowData', getData());
        });
    },
    isGroupOpenByDefault: isGroupOpenByDefault,
};

function isGroupOpenByDefault(params: IsGroupOpenByDefaultParams<IOlympicData, any>) {
    return ['Delhi', 'Seoul'].includes(params.key);
}

// wait for the document to be loaded, otherwise
// AG Grid will not find the div in the document.
document.addEventListener('DOMContentLoaded', function () {
    const eGridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(eGridDiv, gridOptions);
});
