import type { GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    TextEditorModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { CellSelectionModule, ColumnMenuModule, ContextMenuModule, SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    TextEditorModule,
    ClientSideRowModelModule,
    ColumnMenuModule,
    ContextMenuModule,
    CellSelectionModule,
    SetFilterModule,
    ValidationModule /* Development Only */,
]);

interface IOlympicDataTypes extends IOlympicData {
    countryObject: {
        code: string;
    };
    sportObject: {
        name: string;
    };
}

let gridApi: GridApi<IOlympicDataTypes>;

const gridOptions: GridOptions<IOlympicDataTypes> = {
    columnDefs: [
        { field: 'athlete' },
        { field: 'countryObject', headerName: 'Country' },
        { field: 'sportObject', headerName: 'Sport' },
    ],
    defaultColDef: {
        filter: true,
        floatingFilter: true,
        editable: true,
    },
    dataTypeDefinitions: {
        country: {
            baseDataType: 'object',
            extendsDataType: 'object',
            valueParser: (params) =>
                params.newValue == null || params.newValue === '' ? null : { code: params.newValue },
            valueFormatter: (params) => (params.value == null ? '' : params.value.code),
            dataTypeMatcher: (value: any) => value && !!value.code,
        },
        sport: {
            baseDataType: 'object',
            extendsDataType: 'object',
            valueParser: (params) =>
                params.newValue == null || params.newValue === '' ? null : { name: params.newValue },
            valueFormatter: (params) => (params.value == null ? '' : params.value.name),
            dataTypeMatcher: (value: any) => value && !!value.name,
        },
    },
    cellSelection: { handle: { mode: 'fill' } },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicDataTypes[]) =>
            gridApi!.setGridOption(
                'rowData',
                data.map((rowData) => {
                    const dateParts = rowData.date.split('/');
                    return {
                        ...rowData,
                        countryObject: {
                            code: rowData.country,
                        },
                        sportObject: {
                            name: rowData.sport,
                        },
                    };
                })
            )
        );
});
