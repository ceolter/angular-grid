import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions, ICellEditorComp, ICellEditorParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

class YearCellEditor implements ICellEditorComp {
    eGui: any;
    value: any;

    getGui() {
        return this.eGui;
    }

    getValue() {
        return this.value;
    }

    isPopup() {
        return true;
    }

    init(params: ICellEditorParams) {
        this.value = params.value;
        const tempElement = document.createElement('div');
        tempElement.innerHTML =
            '<div class="yearSelect">' +
            '<div>Clicking here does not close the popup!</div>' +
            '<button id="bt2006" class="yearButton">2006</button>' +
            '<button id="bt2008" class="yearButton">2008</button>' +
            '<button id="bt2010" class="yearButton">2010</button>' +
            '<button id="bt2012" class="yearButton">2012</button>' +
            '<div>' +
            '<input type="text" style="width: 100%;" placeholder="clicking on this text field does not close"/>' +
            '</div>' +
            '</div>';

        [2006, 2008, 2010, 2012].forEach((year) => {
            tempElement.querySelector('#bt' + year)!.addEventListener('click', () => {
                this.value = year;
                params.stopEditing();
            });
        });

        this.eGui = tempElement.firstChild;
    }
}

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete', minWidth: 160 },
        { field: 'age' },
        { field: 'country', minWidth: 140 },
        { field: 'year', cellEditor: YearCellEditor, cellEditorPopup: true },
        { field: 'date', minWidth: 140 },
        { field: 'sport', minWidth: 160 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
        editable: true,
    },
    // this property tells grid to stop editing if the
    // grid loses focus
    stopEditingWhenCellsLoseFocus: true,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
