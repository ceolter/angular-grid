import type { GridApi, GridOptions, ValueFormatterLiteParams, ValueParserLiteParams } from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [{ field: 'athlete' }, { field: 'age' }, { field: 'date' }],
    defaultColDef: {
        filter: true,
        floatingFilter: true,
        editable: true,
    },
    dataTypeDefinitions: {
        dateString: {
            baseDataType: 'dateString',
            extendsDataType: 'dateString',
            valueParser: (params: ValueParserLiteParams<IOlympicData, string>) =>
                params.newValue != null && params.newValue.match('\\d{2}/\\d{2}/\\d{4}') ? params.newValue : null,
            valueFormatter: (params: ValueFormatterLiteParams<IOlympicData, string>) =>
                params.value == null ? '' : params.value,
            dataTypeMatcher: (value: any) => typeof value === 'string' && !!value.match('\\d{2}/\\d{2}/\\d{4}'),
            dateParser: (value: string | undefined) => {
                if (value == null || value === '') {
                    return undefined;
                }
                const dateParts = value.split('/');
                return dateParts.length === 3
                    ? new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]))
                    : undefined;
            },
            dateFormatter: (value: Date | undefined) => {
                if (value == null) {
                    return undefined;
                }
                const date = String(value.getDate());
                const month = String(value.getMonth() + 1);
                return `${date.length === 1 ? '0' + date : date}/${month.length === 1 ? '0' + month : month}/${value.getFullYear()}`;
            },
        },
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
