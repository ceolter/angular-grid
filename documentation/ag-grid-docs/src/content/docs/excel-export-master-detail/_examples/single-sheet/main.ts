import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    CsvCell,
    CsvExportParams,
    ExcelCell,
    ExcelExportParams,
    ExcelRow,
    GridApi,
    GridOptions,
    IDetailCellRendererParams,
    ProcessRowGroupForExportParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ClipboardModule } from 'ag-grid-enterprise';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { ExcelExportModule } from 'ag-grid-enterprise';
import { MasterDetailModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ClipboardModule,
    ColumnsToolPanelModule,
    ExcelExportModule,
    MasterDetailModule,
    ColumnMenuModule,
    ContextMenuModule,
]);

const getRows = (params: ProcessRowGroupForExportParams) => {
    const rows = [
        {
            outlineLevel: 1,
            cells: [
                cell(''),
                cell('Call Id', 'header'),
                cell('Direction', 'header'),
                cell('Number', 'header'),
                cell('Duration', 'header'),
                cell('Switch Code', 'header'),
            ],
        },
    ].concat(
        ...params.node.data.callRecords.map((record: any) => [
            {
                outlineLevel: 1,
                cells: [
                    cell(''),
                    cell(record.callId, 'body'),
                    cell(record.direction, 'body'),
                    cell(record.number, 'body'),
                    cell(record.duration, 'body'),
                    cell(record.switchCode, 'body'),
                ],
            },
        ])
    );
    return rows;
};

const defaultCsvExportParams: CsvExportParams = {
    getCustomContentBelowRow: (params) => {
        const rows = getRows(params);

        return rows.map((row) => row.cells) as CsvCell[][];
    },
};
const defaultExcelExportParams: ExcelExportParams = {
    getCustomContentBelowRow: (params) => getRows(params) as ExcelRow[],
    columnWidth: 120,
    fileName: 'ag-grid.xlsx',
};

let gridApi: GridApi<IAccount>;

const gridOptions: GridOptions<IAccount> = {
    columnDefs: [
        // group cell renderer needed for expand / collapse icons
        { field: 'name', cellRenderer: 'agGroupCellRenderer' },
        { field: 'account' },
        { field: 'calls' },
        { field: 'minutes', valueFormatter: "x.toLocaleString() + 'm'" },
    ],
    defaultColDef: {
        flex: 1,
    },
    masterDetail: true,
    detailCellRendererParams: {
        detailGridOptions: {
            columnDefs: [
                { field: 'callId' },
                { field: 'direction' },
                { field: 'number', minWidth: 150 },
                { field: 'duration', valueFormatter: "x.toLocaleString() + 's'" },
                { field: 'switchCode', minWidth: 150 },
            ],
            defaultColDef: {
                flex: 1,
            },
        },
        getDetailRowData: (params) => {
            params.successCallback(params.data.callRecords);
        },
    } as IDetailCellRendererParams<IAccount, ICallRecord>,
    defaultCsvExportParams: defaultCsvExportParams,
    defaultExcelExportParams: defaultExcelExportParams,
    excelStyles: [
        {
            id: 'header',
            interior: {
                color: '#aaaaaa',
                pattern: 'Solid',
            },
        },
        {
            id: 'body',
            interior: {
                color: '#dddddd',
                pattern: 'Solid',
            },
        },
    ],
};

function cell(text: string, styleId?: string): ExcelCell {
    return {
        styleId: styleId,
        data: {
            type: /^\d+$/.test(text) ? 'Number' : 'String',
            value: String(text),
        },
    };
}

function onBtExport() {
    gridApi!.exportDataAsExcel();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/master-detail-data.json')
        .then((response) => response.json())
        .then((data: IAccount[]) => {
            gridApi!.setGridOption('rowData', data);
        });
});
