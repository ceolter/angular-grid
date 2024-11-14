import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions, IRowNode } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { MenuModule } from 'ag-grid-enterprise';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    MenuModule,
    RowGroupingModule,
    SetFilterModule,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'country', rowGroup: true, hide: true },
        { field: 'athlete', minWidth: 180 },
        { field: 'age' },
        { field: 'year' },
        { field: 'date', minWidth: 150 },
        { field: 'sport', minWidth: 150 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    autoGroupColumnDef: {
        minWidth: 200,
    },
    groupDefaultExpanded: 1,
};

function onBtForEachNode() {
    console.log('### api.forEachNode() ###');
    gridApi!.forEachNode(printNode);
}

function onBtForEachNodeAfterFilter() {
    console.log('### api.forEachNodeAfterFilter() ###');
    gridApi!.forEachNodeAfterFilter(printNode);
}

function onBtForEachNodeAfterFilterAndSort() {
    console.log('### api.forEachNodeAfterFilterAndSort() ###');
    gridApi!.forEachNodeAfterFilterAndSort(printNode);
}

function onBtForEachLeafNode() {
    console.log('### api.forEachLeafNode() ###');
    gridApi!.forEachLeafNode(printNode);
}

const printNode = (node: IRowNode<IOlympicData>, index?: number) => {
    if (node.group) {
        console.log(index + ' -> group: ' + node.key);
    } else {
        console.log(index + ' -> data: ' + node.data!.country + ', ' + node.data!.athlete);
    }
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data.slice(0, 50)));
});
