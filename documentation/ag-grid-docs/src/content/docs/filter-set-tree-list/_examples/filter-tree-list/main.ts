import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions, ISetFilterParams, KeyCreatorParams } from 'ag-grid-community';
import { ValueFormatterParams, createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    MenuModule,
    SetFilterModule,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'country', rowGroup: true, hide: true },
        { field: 'sport', rowGroup: true, hide: true },
        { field: 'athlete', hide: true },
        {
            field: 'date',
            filter: 'agSetColumnFilter',
            filterParams: {
                treeList: true,
            } as ISetFilterParams<any, Date>,
        },
        {
            field: 'gold',
            filter: 'agSetColumnFilter',
            filterParams: {
                treeList: true,
                treeListPathGetter: (gold: number) => (gold != null ? [gold > 2 ? '>2' : '<=2', String(gold)] : [null]),
            } as ISetFilterParams<any, number>,
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 200,
        floatingFilter: true,
        cellDataType: false,
    },
    autoGroupColumnDef: {
        field: 'athlete',
        filter: 'agSetColumnFilter',
        filterParams: {
            treeList: true,
            keyCreator: (params: KeyCreatorParams) => (params.value ? params.value.join('#') : null),
        } as ISetFilterParams,
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: any[]) =>
            gridApi!.setGridOption(
                'rowData',
                data.map((row) => {
                    const dateParts = row.date.split('/');
                    const newDate = new Date(parseInt(dateParts[2]), dateParts[1] - 1, dateParts[0]);
                    return { ...row, date: newDate };
                })
            )
        );
});
