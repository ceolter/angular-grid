import type { ColDef, GridApi, GridOptions, IViewportDatasource, IViewportDatasourceParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ViewportRowModelModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, ViewportRowModelModule]);

const columnDefs: ColDef[] = [
    {
        headerName: 'ID',
        field: 'id',
    },
    {
        headerName: 'Expected Position',
        valueGetter: '"translateY(" + node.rowIndex * 100 + "px)"',
    },

    {
        field: 'a',
    },
    {
        field: 'b',
    },
    {
        field: 'c',
    },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    // debug: true,
    rowHeight: 100,
    columnDefs: columnDefs,
    rowModelType: 'viewport',
    viewportDatasource: createViewportDatasource(),
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});

function createViewportDatasource(): IViewportDatasource {
    let initParams: IViewportDatasourceParams;
    return {
        init: (params: IViewportDatasourceParams) => {
            initParams = params;
            const oneMillion = 1000 * 1000;
            params.setRowCount(oneMillion);
        },
        setViewportRange(firstRow: number, lastRow: number) {
            const rowData: any = {};

            for (let rowIndex = firstRow; rowIndex <= lastRow; rowIndex++) {
                const item: any = {};
                item.id = rowIndex;
                item.a = 'A-' + rowIndex;
                item.b = 'B-' + rowIndex;
                item.c = 'C-' + rowIndex;
                rowData[rowIndex] = item;
            }

            initParams.setRowData(rowData);
        },
        destroy: () => {},
    };
}
