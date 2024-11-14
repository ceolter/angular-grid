import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type {
    ColDef,
    GetLocaleTextParams,
    GridApi,
    GridOptions,
    ICellRendererComp,
    ICellRendererParams,
} from 'ag-grid-community';
import {
    AllCommunityModule,
    ClientSideRowModelModule,
    CsvExportModule,
    ModuleRegistry,
    createGrid,
} from 'ag-grid-community';
import {
    CellSelectionModule,
    ClipboardModule,
    ColumnsToolPanelModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    IntegratedChartsModule,
    MenuModule,
    MultiFilterModule,
    RowGroupingModule,
    RowGroupingPanelModule,
    SetFilterModule,
    SideBarModule,
    StatusBarModule,
} from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ClipboardModule,
    ColumnsToolPanelModule,
    CsvExportModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    MenuModule,
    MultiFilterModule,
    CellSelectionModule,
    RowGroupingModule,
    SetFilterModule,
    SideBarModule,
    StatusBarModule,
    RowGroupingPanelModule,
]);

class NodeIdRenderer implements ICellRendererComp {
    eGui!: HTMLElement;

    init(params: ICellRendererParams) {
        this.eGui = document.createElement('div');
        this.eGui.textContent = params.node!.id! + 1;
    }

    getGui() {
        return this.eGui;
    }
    refresh() {
        return false;
    }
}

const columnDefs: ColDef[] = [
    // this row just shows the row index, doesn't use any data from the row
    {
        headerName: '#',
        cellRenderer: NodeIdRenderer,
    },
    { field: 'athlete', filterParams: { buttons: ['clear', 'reset', 'apply'] } },
    {
        field: 'age',
        filterParams: { buttons: ['apply', 'cancel'] },
        enablePivot: true,
    },
    { field: 'country', enableRowGroup: true },
    { field: 'year', filter: 'agNumberColumnFilter' },
    { field: 'date' },
    {
        field: 'sport',
        filter: 'agMultiColumnFilter',
        filterParams: {
            filters: [
                {
                    filter: 'agTextColumnFilter',
                    display: 'accordion',
                },
                {
                    filter: 'agSetColumnFilter',
                    display: 'accordion',
                },
            ],
        },
    },
    { field: 'gold', enableValue: true },
    { field: 'silver', enableValue: true },
    { field: 'bronze', enableValue: true },
    { field: 'total', enableValue: true },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    sideBar: true,
    statusBar: {
        statusPanels: [
            { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
            { statusPanel: 'agAggregationComponent' },
        ],
    },
    rowGroupPanelShow: 'always',
    pagination: true,
    paginationPageSize: 500,
    paginationPageSizeSelector: [100, 500, 1000],
    cellSelection: true,
    enableCharts: true,
    getLocaleText: (params: GetLocaleTextParams) => {
        switch (params.key) {
            case 'thousandSeparator':
                return '.';
            case 'decimalSeparator':
                return ',';
            default:
                if (params.defaultValue) {
                    // the &lrm; marker should not be made uppercase
                    const val = params.defaultValue.split('&lrm;');
                    const newVal = val[0].toUpperCase();

                    if (val.length > 1) {
                        return `${newVal}&lrm;`;
                    }

                    return newVal;
                }

                return '';
        }
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
