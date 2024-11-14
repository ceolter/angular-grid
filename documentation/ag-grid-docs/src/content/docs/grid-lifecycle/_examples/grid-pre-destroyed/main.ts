import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions, GridPreDestroyedEvent } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import type { TAthlete } from './data';
import { getDataSet } from './data';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

interface ColumnWidth {
    field: string;
    width: number;
}

let columnWidths: Map<string, number> | undefined = undefined;

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'name', headerName: 'Athlete' },
        { field: 'medals.gold', headerName: 'Gold Medals' },
        { field: 'person.age', headerName: 'Age' },
    ],
    defaultColDef: {
        editable: true,
    },
    rowData: getDataSet(),
    onGridPreDestroyed: (params: GridPreDestroyedEvent<TAthlete>) => {
        const allColumns = params.api.getColumns();
        if (!allColumns) {
            return;
        }

        const currentColumnWidths = allColumns.map((column) => ({
            field: column.getColDef().field || '-',
            width: column.getActualWidth(),
        }));

        displayColumnsWidth(currentColumnWidths);
        columnWidths = new Map(currentColumnWidths.map((columnWidth) => [columnWidth.field, columnWidth.width]));
    },
};

const displayColumnsWidth = (values: ColumnWidth[]) => {
    const parentContainer = document.querySelector<HTMLElement>('#gridPreDestroyedState')!;
    const valuesContainer = parentContainer.querySelector<HTMLElement>('.values');
    if (!parentContainer || !valuesContainer) {
        return;
    }

    const html =
        '<ul>' +
        (values || []).map((value) => `<li>Field: ${value.field} | Width: ${value.width}px</li>`).join('') +
        '</ul>';

    parentContainer.style.display = 'block';
    valuesContainer.innerHTML = html;

    const exampleButtons = document.querySelector<HTMLElement>('#exampleButtons');
    exampleButtons!.style.display = 'none';
};

function updateColumnWidth() {
    if (!gridApi) {
        return;
    }

    const newWidths = gridApi.getColumns()!.map((column) => {
        return { key: column.getColId(), newWidth: Math.round((150 + Math.random() * 100) * 100) / 100 };
    });
    gridApi.setColumnWidths(newWidths);
}

function destroyGrid() {
    if (!gridApi) {
        return;
    }

    gridApi.destroy();
    gridApi = undefined;
}

function reloadGrid() {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;

    const updatedColDefs =
        gridOptions.columnDefs && columnWidths
            ? gridOptions.columnDefs.map((val) => {
                  const colDef = val as ColDef;
                  const result: ColDef = {
                      ...colDef,
                  };

                  if (colDef.field && columnWidths) {
                      const restoredWidth = columnWidths.get(colDef.field);
                      if (restoredWidth) {
                          result.width = restoredWidth;
                      }
                  }

                  return result;
              })
            : gridOptions.columnDefs;

    gridOptions.columnDefs = updatedColDefs;

    gridApi = createGrid(gridDiv, gridOptions);

    const parentContainer = document.querySelector<HTMLElement>('#gridPreDestroyedState');
    parentContainer!.style.display = 'none';

    const exampleButtons = document.querySelector<HTMLElement>('#exampleButtons');
    exampleButtons!.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
