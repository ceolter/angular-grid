import { ModuleNames } from '../modules/moduleNames';
import type {
    GridApi,
    _AdvancedFilterGridApi,
    _ClientSideRowModelGridApi,
    _ClipboardGridApi,
    _CoreModuleGridApi,
    _CsvExportGridApi,
    _ExcelExportGridApi,
    _GridChartsGridApi,
    _InfiniteRowModelGridApi,
    _MasterDetailGridApi,
    _MenuGridApi,
    _RangeSelectionGridApi,
    _RowGroupingGridApi,
    _ServerSideRowModelGridApi,
    _SideBarGridApi,
    _StatusBarGridApi,
} from './gridApi';
import type { ApiFunctionName } from './iApiFunction';

// enable minification
const coreModule = ModuleNames.CommunityCoreModule;
const clientSideRowModelModule = ModuleNames.ClientSideRowModelModule;
const csvExportModule = ModuleNames.CsvExportModule;
const infiniteRowModelModule = ModuleNames.InfiniteRowModelModule;
const advancedFilterModule = ModuleNames.AdvancedFilterModule;
const gridChartsModule = ModuleNames.GridChartsModule;
const clipboardModule = ModuleNames.ClipboardModule;
const excelExportModule = ModuleNames.ExcelExportModule;
const masterDetailModule = ModuleNames.MasterDetailModule;
const menuModule = ModuleNames.MenuModule;
const rangeSelectionModule = ModuleNames.RangeSelectionModule;
const rowGroupingModule = ModuleNames.RowGroupingModule;
const serverSideRowModelModule = ModuleNames.ServerSideRowModelModule;
const sideBarModule = ModuleNames.SideBarModule;
const statusBarModule = ModuleNames.StatusBarModule;

export const gridApiFunctionNames: ApiFunctionName[] = [];

const mod = <TGridApi extends Partial<GridApi>>(
    moduleName: ModuleNames,
    input: Record<keyof TGridApi, 0>
): Record<keyof TGridApi, ModuleNames> => {
    for (const key in input) {
        (input as any)[key] = moduleName;
        gridApiFunctionNames.push(key as ApiFunctionName);
    }
    return input as any;
};

export const gridApiFunctionsMap = {
    ...mod<_CoreModuleGridApi>(coreModule, {
        dispatchEvent: 0,
        destroy: 0,
        getGridId: 0,
        getGridOption: 0,
        isDestroyed: 0,
        setGridOption: 0,
        updateGridOptions: 0,
        getState: 0,
        setNodesSelected: 0,
        selectAll: 0,
        deselectAll: 0,
        selectAllFiltered: 0,
        deselectAllFiltered: 0,
        selectAllOnCurrentPage: 0,
        deselectAllOnCurrentPage: 0,
        getSelectedNodes: 0,
        getSelectedRows: 0,
        redrawRows: 0,
        setRowNodeExpanded: 0,
        getRowNode: 0,
        addRenderedRowListener: 0,
        getRenderedNodes: 0,
        forEachNode: 0,
        getFirstDisplayedRow: 0,
        getFirstDisplayedRowIndex: 0,
        getLastDisplayedRow: 0,
        getLastDisplayedRowIndex: 0,
        getDisplayedRowAtIndex: 0,
        getDisplayedRowCount: 0,
        getModel: 0,
        getVerticalPixelRange: 0,
        getHorizontalPixelRange: 0,
        ensureColumnVisible: 0,
        ensureIndexVisible: 0,
        ensureNodeVisible: 0,
        getFocusedCell: 0,
        clearFocusedCell: 0,
        setFocusedCell: 0,
        tabToNextCell: 0,
        tabToPreviousCell: 0,
        setFocusedHeader: 0,
        addEventListener: 0,
        addGlobalListener: 0,
        removeEventListener: 0,
        removeGlobalListener: 0,
        expireValueCache: 0,
        getValue: 0,
        getCellValue: 0,
        showColumnMenuAfterButtonClick: 0,
        showColumnMenuAfterMouseClick: 0,
        showColumnMenu: 0,
        hidePopupMenu: 0,
        onSortChanged: 0,
        getPinnedTopRowCount: 0,
        getPinnedBottomRowCount: 0,
        getPinnedTopRow: 0,
        getPinnedBottomRow: 0,
        showLoadingOverlay: 0,
        showNoRowsOverlay: 0,
        hideOverlay: 0,
        setGridAriaProperty: 0,
        refreshCells: 0,
        flashCells: 0,
        refreshHeader: 0,
        isAnimationFrameQueueEmpty: 0,
        flushAllAnimationFrames: 0,
        getSizesForCurrentTheme: 0,
        getCellRendererInstances: 0,
        addRowDropZone: 0,
        removeRowDropZone: 0,
        getRowDropZoneParams: 0,
        getColumnDef: 0,
        getColumnDefs: 0,
        sizeColumnsToFit: 0,
        setColumnGroupOpened: 0,
        getColumnGroup: 0,
        getProvidedColumnGroup: 0,
        getDisplayNameForColumn: 0,
        getDisplayNameForColumnGroup: 0,
        getColumn: 0,
        getColumns: 0,
        applyColumnState: 0,
        getColumnState: 0,
        resetColumnState: 0,
        getColumnGroupState: 0,
        setColumnGroupState: 0,
        resetColumnGroupState: 0,
        isPinning: 0,
        isPinningLeft: 0,
        isPinningRight: 0,
        getDisplayedColAfter: 0,
        getDisplayedColBefore: 0,
        setColumnVisible: 0,
        setColumnsVisible: 0,
        setColumnPinned: 0,
        setColumnsPinned: 0,
        getAllGridColumns: 0,
        getDisplayedLeftColumns: 0,
        getDisplayedCenterColumns: 0,
        getDisplayedRightColumns: 0,
        getAllDisplayedColumns: 0,
        getAllDisplayedVirtualColumns: 0,
        moveColumn: 0,
        moveColumnByIndex: 0,
        moveColumns: 0,
        setColumnWidth: 0,
        setColumnWidths: 0,
        getLeftDisplayedColumnGroups: 0,
        getCenterDisplayedColumnGroups: 0,
        getRightDisplayedColumnGroups: 0,
        getAllDisplayedColumnGroups: 0,
        autoSizeColumn: 0,
        autoSizeColumns: 0,
        autoSizeAllColumns: 0,

        undoCellEditing: 0,
        redoCellEditing: 0,
        getCellEditorInstances: 0,
        getEditingCells: 0,
        stopEditing: 0,
        startEditingCell: 0,
        getCurrentUndoSize: 0,
        getCurrentRedoSize: 0,

        isAnyFilterPresent: 0,
        onFilterChanged: 0,
        isColumnFilterPresent: 0,
        getFilterInstance: 0,
        getColumnFilterInstance: 0,
        destroyFilter: 0,
        setFilterModel: 0,
        getFilterModel: 0,
        getColumnFilterModel: 0,
        setColumnFilterModel: 0,
        showColumnFilter: 0,
        isQuickFilterPresent: 0,
        getQuickFilter: 0,
        resetQuickFilter: 0,

        paginationIsLastPageFound: 0,
        paginationGetPageSize: 0,
        paginationGetCurrentPage: 0,
        paginationGetTotalPages: 0,
        paginationGetRowCount: 0,
        paginationGoToNextPage: 0,
        paginationGoToPreviousPage: 0,
        paginationGoToFirstPage: 0,
        paginationGoToLastPage: 0,
        paginationGoToPage: 0,

        // These may need updating to say which of multiple possible modules they could be missing from.
        expandAll: 0,
        collapseAll: 0,
        onRowHeightChanged: 0,
        setRowCount: 0,
        getCacheBlockState: 0,
    }),

    ...mod<_ClientSideRowModelGridApi>(clientSideRowModelModule, {
        onGroupExpandedOrCollapsed: 0,
        refreshClientSideRowModel: 0,
        forEachLeafNode: 0,
        forEachNodeAfterFilter: 0,
        forEachNodeAfterFilterAndSort: 0,
        resetRowHeights: 0,
        applyTransaction: 0,
        applyTransactionAsync: 0,
        flushAsyncTransactions: 0,
        getBestCostNodeSelection: 0,
    }),

    ...mod<_CsvExportGridApi>(csvExportModule, {
        getDataAsCsv: 0,
        exportDataAsCsv: 0,
    }),

    ...mod<_InfiniteRowModelGridApi>(infiniteRowModelModule, {
        refreshInfiniteCache: 0,
        purgeInfiniteCache: 0,
        getInfiniteRowCount: 0,
        isLastRowIndexKnown: 0,
    }),

    ...mod<_AdvancedFilterGridApi>(advancedFilterModule, {
        getAdvancedFilterModel: 0,
        setAdvancedFilterModel: 0,
        showAdvancedFilterBuilder: 0,
        hideAdvancedFilterBuilder: 0,
    }),

    ...mod<_GridChartsGridApi>(gridChartsModule, {
        getChartModels: 0,
        getChartRef: 0,
        getChartImageDataURL: 0,
        downloadChart: 0,
        openChartToolPanel: 0,
        closeChartToolPanel: 0,
        createRangeChart: 0,
        createPivotChart: 0,
        createCrossFilterChart: 0,
        updateChart: 0,
        restoreChart: 0,
    }),

    ...mod<_ClipboardGridApi>(clipboardModule, {
        copyToClipboard: 0,
        cutToClipboard: 0,
        copySelectedRowsToClipboard: 0,
        copySelectedRangeToClipboard: 0,
        copySelectedRangeDown: 0,
        pasteFromClipboard: 0,
    }),

    ...mod<_ExcelExportGridApi>(excelExportModule, {
        getDataAsExcel: 0,
        exportDataAsExcel: 0,
        getSheetDataForExcel: 0,
        getMultipleSheetsAsExcel: 0,
        exportMultipleSheetsAsExcel: 0,
    }),

    ...mod<_MasterDetailGridApi>(masterDetailModule, {
        addDetailGridInfo: 0,
        removeDetailGridInfo: 0,
        getDetailGridInfo: 0,
        forEachDetailGridInfo: 0,
    }),

    ...mod<_MenuGridApi>(menuModule, {
        showContextMenu: 0,
        showColumnChooser: 0,
        hideColumnChooser: 0,
    }),

    ...mod<_RangeSelectionGridApi>(rangeSelectionModule, {
        getCellRanges: 0,
        addCellRange: 0,
        clearRangeSelection: 0,
    }),

    ...mod<_RowGroupingGridApi>(rowGroupingModule, {
        addAggFunc: 0,
        addAggFuncs: 0,
        clearAggFuncs: 0,
        setColumnAggFunc: 0,
        isPivotMode: 0,
        getPivotResultColumn: 0,
        setValueColumns: 0,
        getValueColumns: 0,
        removeValueColumn: 0,
        removeValueColumns: 0,
        addValueColumn: 0,
        addValueColumns: 0,
        setRowGroupColumns: 0,
        removeRowGroupColumn: 0,
        removeRowGroupColumns: 0,
        addRowGroupColumn: 0,
        addRowGroupColumns: 0,
        getRowGroupColumns: 0,
        moveRowGroupColumn: 0,
        setPivotColumns: 0,
        removePivotColumn: 0,
        removePivotColumns: 0,
        addPivotColumn: 0,
        addPivotColumns: 0,
        getPivotColumns: 0,
        setPivotResultColumns: 0,
        getPivotResultColumns: 0,
    }),

    ...mod<_ServerSideRowModelGridApi>(serverSideRowModelModule, {
        getServerSideSelectionState: 0,
        setServerSideSelectionState: 0,
        applyServerSideTransaction: 0,
        applyServerSideTransactionAsync: 0,
        applyServerSideRowData: 0,
        retryServerSideLoads: 0,
        flushServerSideAsyncTransactions: 0,
        refreshServerSide: 0,
        getServerSideGroupLevelState: 0,
    }),

    ...mod<_SideBarGridApi>(sideBarModule, {
        isSideBarVisible: 0,
        setSideBarVisible: 0,
        setSideBarPosition: 0,
        openToolPanel: 0,
        closeToolPanel: 0,
        getOpenedToolPanel: 0,
        refreshToolPanel: 0,
        isToolPanelShowing: 0,
        getToolPanelInstance: 0,
        getSideBar: 0,
    }),

    ...mod<_StatusBarGridApi>(statusBarModule, {
        getStatusPanel: 0,
    }),
};
