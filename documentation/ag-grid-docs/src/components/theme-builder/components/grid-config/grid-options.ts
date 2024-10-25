import type { ColDef, ColGroupDef, GridOptions } from 'ag-grid-community';

import { defaultRowData } from './grid-data';

export const productionConfigFields = [
    'advancedFilter',
    'columnsToolPanel',
    'columnGroups',
    'columnHover',
    'rowGrouping',
    'columnResizing',
    'rowDrag',
    'rowSelection',
    'rightToLeft',
    'floatingFilters',
    'showIntegratedChartPopup',
    'statusBar',
    'pagination',
] as const;

const debugConfigFields = [
    'filtersToolPanel',
    'legacyColumnMenu',
    'loadingOverlay',
    'printLayout',
    'columnGroupsDeep',
    'grandTotalRow',
    'popupParentIsBody',
] as const;

export const allConfigFields = [...productionConfigFields, ...debugConfigFields] as const;

export const defaultConfigFields = ['columnResizing', 'pagination', 'rowSelection'];

export type ProductionGridConfigField = (typeof productionConfigFields)[number];
export type GridConfigField = (typeof allConfigFields)[number];

export type GridConfig = {
    [K in GridConfigField]?: boolean;
};

export const incompatibleGridConfigProperties: Partial<Record<GridConfigField, GridConfigField>> = {
    filtersToolPanel: 'advancedFilter',
    floatingFilters: 'advancedFilter',
    rowDrag: 'rowGrouping',
    pagination: 'rowDrag',
};

export const buildGridOptions = (config: GridConfig): GridOptions => {
    config = { ...config };
    for (const [property, incompatibleProperty] of Object.entries(incompatibleGridConfigProperties)) {
        if (config[property as GridConfigField] && config[incompatibleProperty]) {
            config[property as GridConfigField] = false;
        }
    }

    const defaultColDef: ColDef = {
        sortable: true,
        resizable: config.columnResizing,
        enableRowGroup: true,
        floatingFilter: config.floatingFilters,
        editable: true,
        flex: 1,
        filter: true,
        aggFunc: 'sum',
    };
    const columnDefs = buildSimpleColumnDefs();
    const sideBar: string[] = [];
    const options: GridOptions = {
        defaultColDef,
        sideBar,
        enableCharts: true,
        columnHoverHighlight: config.columnHover,
        cellSelection: true,
        rowData: defaultRowData(),
        columnDefs: config.columnGroupsDeep
            ? buildDeepGroupColumnDefs(columnDefs)
            : config.columnGroups
              ? buildGroupColumnDefs(columnDefs)
              : columnDefs,
        enableRtl: config.rightToLeft,
        domLayout: config.printLayout ? 'print' : undefined,
        columnMenu: config.legacyColumnMenu ? 'legacy' : 'new',
        animateRows: false,
        rowDragManaged: true,
        autoGroupColumnDef: {
            headerName: 'Group',
            field: 'name',
            minWidth: 250,
        },
        popupParent: config.popupParentIsBody ? document.body : undefined,
        grandTotalRow: config.grandTotalRow ? 'bottom' : undefined,
    };

    if (config.advancedFilter) {
        options.enableAdvancedFilter = true;
        options.advancedFilterBuilderParams = {
            showMoveButtons: true,
        };
    }

    if (config.columnsToolPanel) {
        sideBar.push('columns');
    }

    if (config.filtersToolPanel) {
        sideBar.push('filters');
    }

    if (config.rowDrag) {
        columnDefs[0].rowDrag = !config.rowGrouping;
    }

    if (config.rowGrouping) {
        columnDefs[0].rowGroup = true;
        columnDefs[1].rowGroup = true;
        options.rowGroupPanelShow = 'always';
    }

    if (config.rowSelection) {
        options.rowSelection = {
            mode: 'multiRow',
        };
    }

    if (config.statusBar) {
        options.statusBar = {
            statusPanels: [
                {
                    statusPanel: 'agTotalRowCountComponent',
                    align: 'left',
                },
                {
                    statusPanel: 'agFilteredRowCountComponent',
                    align: 'left',
                },
                { statusPanel: 'agSelectedRowCountComponent', align: 'left' },
                { statusPanel: 'agAggregationComponent', align: 'right' },
            ],
        };
    }

    if (config.pagination) {
        options.pagination = true;
        options.paginationPageSize = 25;
        options.paginationPageSizeSelector = [5, 10, 25, 50, 100];
    }

    return options;
};

// Currently breaks rowGrouping
const cashFormatter = (params: any) => {
    if (!params.value) return '';
    return '$' + params.value.toLocaleString();
};

const buildSimpleColumnDefs = (): ColDef[] => [
    { field: 'country' },
    { field: 'sport', cellEditor: 'agRichSelectCellEditor' },
    { field: 'name' },
    {
        field: 'winningsTotal',
        headerName: 'Total winnings',
        type: 'rightAligned',
        valueFormatter: cashFormatter,
        filter: 'agNumberColumnFilter',
    },
    {
        field: 'winnings2023',
        headerName: '2023 winnings',
        type: 'rightAligned',
        valueFormatter: cashFormatter,
        filter: 'agNumberColumnFilter',
    },
    {
        field: 'winnings2022',
        headerName: '2022 winnings',
        type: 'rightAligned',
        valueFormatter: cashFormatter,
        filter: 'agNumberColumnFilter',
    },
];

const buildGroupColumnDefs = (columns: ColDef[]): ColGroupDef[] => [
    {
        headerName: 'Athlete',
        children: columns.filter((c) => ['country', 'sport', 'name'].includes(c.field!)),
    },
    {
        headerName: 'Winnings',
        children: columns.filter((c) => !['country', 'sport', 'name'].includes(c.field!)),
    },
];

const buildDeepGroupColumnDefs = (columns: ColDef[]): (ColDef | ColGroupDef)[] => [
    {
        headerName: 'Athlete',
        children: columns.filter((c) => ['country', 'sport', 'name'].includes(c.field!)),
    },
    columns.find((c) => c.field === 'winningsTotal')!,
    {
        headerName: 'Yearly winnings',
        children: [
            {
                headerName: 'Even years',
                children: columns.filter((c) => ['winnings2022'].includes(c.field!)),
            },
            {
                headerName: 'Odd years',
                children: columns.filter((c) => ['winnings2023'].includes(c.field!)),
            },
        ],
    },
];
