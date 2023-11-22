import { GridApi, createGrid, GridOptions, SendToClipboardParams } from '@ag-grid-community/core';

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  columnDefs: [
    { field: 'athlete', minWidth: 200 },
    { field: 'age' },
    { field: 'country', minWidth: 150 },
    { field: 'year' },
    { field: 'date', minWidth: 150 },
    { field: 'sport', minWidth: 150 },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
  ],

  defaultColDef: {
    editable: true,
    flex: 1,
    minWidth: 100,
  },

  enableRangeSelection: true,
  rowSelection: 'multiple',

  sendToClipboard: sendToClipboard,
}

function sendToClipboard(params: SendToClipboardParams) {
  console.log('send to clipboard called with data:')
  console.log(params.data)
}

function onBtCopyRows() {
  gridApi!.copySelectedRowsToClipboard()
}

function onBtCopyRange() {
  gridApi!.copySelectedRangeToClipboard()
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data))
})
