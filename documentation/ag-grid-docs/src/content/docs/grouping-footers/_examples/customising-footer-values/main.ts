import { GridApi, createGrid, GridOptions } from '@ag-grid-community/core';
import { getData } from "./data";
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from "@ag-grid-community/core";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule]);


let gridApi: GridApi;

const gridOptions: GridOptions = {
  columnDefs: [
    { field: 'country', rowGroup: true, hide: true },
    { field: 'year', rowGroup: true, hide: true },
    { field: 'gold', aggFunc: 'sum' },
    { field: 'silver', aggFunc: 'sum' },
    { field: 'bronze', aggFunc: 'sum' },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 150,
  },
  autoGroupColumnDef: {
    minWidth: 300,
    cellRendererParams: {
      totalValueGetter: (params: any) => {
        const isRootLevel = params.node.level === -1
        if (isRootLevel) {
          return 'Grand Total'
        }
        return `Sub Total (${params.value})`
      },
    },
  },
  groupIncludeFooter: true,
  groupIncludeTotalFooter: true,
  rowData: getData(),
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);
})