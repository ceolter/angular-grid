import type { ModuleName } from '../../interfaces/iModule';
import type { DefaultMenuItem } from '../../interfaces/menuItem';

export const MENU_ITEM_MODULES: Record<DefaultMenuItem, ModuleName | ModuleName[]> = {
    pinSubMenu: 'PinnedColumnModule',
    pinLeft: 'PinnedColumnModule',
    pinRight: 'PinnedColumnModule',
    clearPinned: 'PinnedColumnModule',
    valueAggSubMenu: 'AggregationModule',
    autoSizeThis: 'ColumnAutoSizeModule',
    autoSizeAll: 'ColumnAutoSizeModule',
    rowGroup: 'RowGroupingCoreModule',
    rowUnGroup: 'RowGroupingCoreModule',
    resetColumns: 'CommunityCoreModule',
    expandAll: ['ClientSideRowModelHierarchyModule', 'ServerSideRowModelHierarchyModule'],
    contractAll: ['ClientSideRowModelHierarchyModule', 'ServerSideRowModelHierarchyModule'],
    copy: 'ClipboardModule',
    copyWithHeaders: 'ClipboardModule',
    copyWithGroupHeaders: 'ClipboardModule',
    cut: 'ClipboardModule',
    paste: 'ClipboardModule',
    export: ['CsvExportModule', 'ExcelExportModule'],
    csvExport: 'CsvExportModule',
    excelExport: 'ExcelExportModule',
    separator: 'CommunityCoreModule',
    pivotChart: 'IntegratedChartsModule',
    chartRange: 'IntegratedChartsModule',
    columnFilter: 'ColumnFilterModule',
    columnChooser: 'ColumnMenuModule',
    sortAscending: 'SortCoreModule',
    sortDescending: 'SortCoreModule',
    sortUnSort: 'SortCoreModule',
};
