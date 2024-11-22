import { AG_GRID_LOCALE_DE } from '@ag-grid-community/locale';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type { ColDef, GridApi, GridOptions, ICellRendererComp, ICellRendererParams } from 'ag-grid-community';
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
    ColumnMenuModule,
    ColumnsToolPanelModule,
    ContextMenuModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    IntegratedChartsModule,
    MultiFilterModule,
    PivotModule,
    RowGroupingPanelModule,
    SetFilterModule,
    SideBarModule,
    StatusBarModule,
} from 'ag-grid-enterprise';

import { zzzLocale } from './locale';

// Create a dummy locale based on english but prefix everything with zzz
const AG_GRID_LOCALE_ZZZ: Record<string, string> = zzzLocale(AG_GRID_LOCALE_DE);

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ClipboardModule,
    ColumnsToolPanelModule,
    CsvExportModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    ColumnMenuModule,
    ContextMenuModule,
    MultiFilterModule,
    CellSelectionModule,
    PivotModule,
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

    refresh(params: ICellRendererParams): boolean {
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
    enableCharts: true,
    localeText: AG_GRID_LOCALE_ZZZ,
    rowSelection: { mode: 'multiRow' },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
