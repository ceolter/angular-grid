import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ExcelExportModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, ExcelExportModule, MenuModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete', minWidth: 200 },
        { field: 'country', minWidth: 200 },
        { field: 'sport', minWidth: 150 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ],

    defaultColDef: {
        filter: true,
        minWidth: 100,
        flex: 1,
    },

    popupParent: document.body,
};

function getNumber(id: string) {
    const el = document.querySelector(id) as any;

    if (!el || isNaN(el.value)) {
        return 0;
    }

    return parseFloat(el.value);
}

function getValue(id: string) {
    return (document.querySelector(id) as any).value;
}

function getSheetConfig() {
    return {
        pageSetup: {
            orientation: getValue('#pageOrientation'),
            pageSize: getValue('#pageSize'),
        },
        margins: {
            top: getNumber('#top'),
            right: getNumber('#right'),
            bottom: getNumber('#bottom'),
            left: getNumber('#left'),
            header: getNumber('#header'),
            footer: getNumber('#footer'),
        },
    };
}

function onFormSubmit(e: any) {
    e.preventDefault();
    const { pageSetup, margins } = getSheetConfig();
    gridApi!.exportDataAsExcel({ pageSetup, margins });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid');
    const form = document.querySelector<HTMLFormElement>('form');

    form?.addEventListener('submit', (e) => onFormSubmit(e));

    if (gridDiv) {
        gridApi = createGrid(gridDiv, gridOptions);
        fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
            .then((response) => response.json())
            .then((data) =>
                gridApi!.setGridOption(
                    'rowData',
                    data.filter((rec: any) => rec.country != null)
                )
            );
    }
});
