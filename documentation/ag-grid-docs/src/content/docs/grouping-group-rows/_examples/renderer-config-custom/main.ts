import { ClientSideRowModelModule } from 'ag-grid-community';
import { CellDoubleClickedEvent, CellKeyDownEvent, ColDef, GridApi, GridOptions, createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

import { CustomGroupCellRenderer } from './customGroupCellRenderer_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RowGroupingModule]);

const columnDefs: ColDef[] = [
    {
        field: 'country',
        hide: true,
        rowGroup: true,
    },
    {
        field: 'year',
        hide: true,
        rowGroup: true,
    },
    {
        field: 'athlete',
    },
    {
        field: 'sport',
    },
    {
        field: 'total',
        aggFunc: 'sum',
    },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    groupRowRenderer: CustomGroupCellRenderer,
    defaultColDef: {
        flex: 1,
        minWidth: 120,
    },
    onCellDoubleClicked: (params: CellDoubleClickedEvent<IOlympicData, any>) => {
        if (params.colDef.showRowGroup) {
            params.node.setExpanded(!params.node.expanded);
        }
    },
    onCellKeyDown: (params: CellKeyDownEvent<IOlympicData, any>) => {
        if (!('colDef' in params)) {
            return;
        }
        if (!(params.event instanceof KeyboardEvent)) {
            return;
        }
        if (params.event.code !== 'Enter') {
            return;
        }
        if (params.colDef.showRowGroup) {
            params.node.setExpanded(!params.node.expanded);
        }
    },
    groupDisplayType: 'groupRows',
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
