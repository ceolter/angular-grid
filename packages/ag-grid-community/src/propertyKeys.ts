import type { GridOptions } from './entities/gridOptions';
import type { AgGridCommon } from './interfaces/iCommon';

type GridOptionKey = keyof GridOptions;

type GetKeys<T, U> = {
    [K in keyof T]: U extends T[K] ? K : T[K] extends U | null | undefined ? K : never; //Reverse match for string literal types
}[keyof T];

/**
 *  Get the GridProperties that are of type `any`.
 *  Works by finding the properties that can extend a non existing string.
 *  This will only be the properties of type `any`.
 */
export type AnyGridOptions = {
    [K in keyof GridOptions]: GridOptions[K] extends 'NO_MATCH' ? K : never;
}[keyof GridOptions];

/**
 * Get all the GridOptions properties of the provided type.
 * Will also include `any` properties.
 */
type KeysLike<U> = Exclude<GetKeys<GridOptions, U>, undefined>;
/**
 * Get all the GridOption properties that strictly contain the provided type.
 * Does not include `any` properties.
 */
type KeysOfType<U> = Exclude<GetKeys<GridOptions, U>, AnyGridOptions>;
type CallbackKeys = KeysOfType<(any: AgGridCommon<any, any>) => any>;
/** All function properties excluding those explicity match the common callback interface. */
// eslint-disable-next-line @typescript-eslint/ban-types
type FunctionKeys = Exclude<KeysLike<Function>, CallbackKeys>;

/**
 * These keys are used for validating properties supplied on a gridOptions object, and for code generation.
 * If you change the properties on the gridOptions interface, you *must* update this file as well to be consistent.
 */
// only used internally
const STRING_GRID_OPTIONS: KeysOfType<string>[] = [
    'overlayLoadingTemplate',
    'overlayNoRowsTemplate',
    'gridId',
    'quickFilterText',
    'rowModelType',
    'editType',
    'domLayout',
    'clipboardDelimiter',
    'rowGroupPanelShow',
    'multiSortKey',
    'pivotColumnGroupTotals',
    'pivotRowTotals',
    'pivotPanelShow',
    'fillHandleDirection',
    'groupDisplayType',
    'treeDataDisplayType',
    'colResizeDefault',
    'tooltipTrigger',
    'serverSidePivotResultFieldSeparator',
    'columnMenu',
    'tooltipShowMode',
    'grandTotalRow',
    // 'treeDataChildrenField',
];

// only used internally
const OBJECT_GRID_OPTIONS: KeysLike<object | HTMLElement>[] = [
    'components',
    'rowStyle',
    'context',
    'autoGroupColumnDef',
    'localeText',
    'icons',
    'datasource',
    'dragAndDropImageComponentParams',
    'serverSideDatasource',
    'viewportDatasource',
    'groupRowRendererParams',
    'aggFuncs',
    'fullWidthCellRendererParams',
    'defaultColGroupDef',
    'defaultColDef',
    'defaultCsvExportParams',
    'defaultExcelExportParams',
    'columnTypes',
    'rowClassRules',
    'detailCellRendererParams',
    'loadingCellRendererParams',
    'loadingOverlayComponentParams',
    'noRowsOverlayComponentParams',
    'popupParent',
    'statusBar',
    'chartThemeOverrides',
    'customChartThemes',
    'chartToolPanelsDef',
    'dataTypeDefinitions',
    'advancedFilterParent',
    'advancedFilterBuilderParams',
    'initialState',
    'autoSizeStrategy',
    'selectionColumnDef',
];

// only used internally
const ARRAY_GRID_OPTIONS: KeysOfType<any[]>[] = [
    'sortingOrder',
    'alignedGrids',
    'rowData',
    'columnDefs',
    'excelStyles',
    'pinnedTopRowData',
    'pinnedBottomRowData',
    'chartThemes',
    'rowClass',
    'paginationPageSizeSelector',
];

// Used in validations to check type of number inputs
export const _NUMBER_GRID_OPTIONS: KeysOfType<number>[] = [
    'rowHeight',
    'detailRowHeight',
    'rowBuffer',
    'headerHeight',
    'groupHeaderHeight',
    'groupLockGroupColumns',
    'floatingFiltersHeight',
    'pivotHeaderHeight',
    'pivotGroupHeaderHeight',
    'groupDefaultExpanded',
    'pivotDefaultExpanded',
    'viewportRowModelPageSize',
    'viewportRowModelBufferSize',
    'autoSizePadding',
    'maxBlocksInCache',
    'maxConcurrentDatasourceRequests',
    'tooltipShowDelay',
    'tooltipHideDelay',
    'cacheOverflowSize',
    'paginationPageSize',
    'cacheBlockSize',
    'infiniteInitialRowCount',
    'serverSideInitialRowCount',
    'scrollbarWidth',
    'asyncTransactionWaitMillis',
    'blockLoadDebounceMillis',
    'keepDetailRowsCount',
    'undoRedoCellEditingLimit',
    'cellFlashDuration',
    'cellFadeDuration',
    'tabIndex',
    'pivotMaxGeneratedColumns',
];

// If property does not fit above, i.e union that should not be coerced.
// used internally
const OTHER_GRID_OPTIONS: GridOptionKey[] = ['theme', 'rowSelection'];

// Used by Angular to support the user setting these
// as plain HTML attributes and us correctly mapping that to true
// These are all of type boolean | something else
export const _BOOLEAN_MIXED_GRID_OPTIONS: KeysOfType<boolean>[] = [
    'cellSelection',
    'sideBar',
    'suppressGroupChangesColumnVisibility',
    'groupAggFiltering',
    'suppressStickyTotalRow',
    'groupHideParentOfSingleChild',
];

// Used in validations to check type of pure boolean inputs
export const _BOOLEAN_GRID_OPTIONS: KeysOfType<boolean>[] = [
    'loadThemeGoogleFonts',
    'suppressMakeColumnVisibleAfterUnGroup',
    'suppressRowClickSelection',
    'suppressCellFocus',
    'suppressHeaderFocus',
    'suppressHorizontalScroll',
    'groupSelectsChildren',
    'alwaysShowHorizontalScroll',
    'alwaysShowVerticalScroll',
    'debug',
    'enableBrowserTooltips',
    'enableCellExpressions',
    'groupSuppressBlankHeader',
    'suppressMenuHide',
    'suppressRowDeselection',
    'unSortIcon',
    'suppressMultiSort',
    'alwaysMultiSort',
    'singleClickEdit',
    'suppressLoadingOverlay',
    'suppressNoRowsOverlay',
    'suppressAutoSize',
    'skipHeaderOnAutoSize',
    'suppressColumnMoveAnimation',
    'suppressMoveWhenColumnDragging',
    'suppressMovableColumns',
    'suppressFieldDotNotation',
    'enableRangeSelection',
    'enableRangeHandle',
    'enableFillHandle',
    'suppressClearOnFillReduction',
    'deltaSort',
    'suppressTouch',
    'allowContextMenuWithControlKey',
    'suppressContextMenu',
    'suppressDragLeaveHidesColumns',
    'suppressRowGroupHidesColumns',
    'suppressMiddleClickScrolls',
    'suppressPreventDefaultOnMouseWheel',
    'suppressCopyRowsToClipboard',
    'copyHeadersToClipboard',
    'copyGroupHeadersToClipboard',
    'pivotMode',
    'suppressAggFuncInHeader',
    'suppressColumnVirtualisation',
    'alwaysAggregateAtRootLevel',
    'suppressFocusAfterRefresh',
    'functionsReadOnly',
    'animateRows',
    'groupSelectsFiltered',
    'groupRemoveSingleChildren',
    'groupRemoveLowestSingleChildren',
    'enableRtl',
    'suppressClickEdit',
    'rowDragEntireRow',
    'rowDragManaged',
    'suppressRowDrag',
    'suppressMoveWhenRowDragging',
    'rowDragMultiRow',
    'enableGroupEdit',
    'embedFullWidthRows',
    'suppressPaginationPanel',
    'groupHideOpenParents',
    'groupAllowUnbalanced',
    'pagination',
    'paginationAutoPageSize',
    'suppressScrollOnNewData',
    'suppressScrollWhenPopupsAreOpen',
    'purgeClosedRowNodes',
    'cacheQuickFilter',
    'includeHiddenColumnsInQuickFilter',
    'ensureDomOrder',
    'accentedSort',
    'suppressChangeDetection',
    'valueCache',
    'valueCacheNeverExpires',
    'aggregateOnlyChangedColumns',
    'suppressAnimationFrame',
    'suppressExcelExport',
    'suppressCsvExport',
    'includeHiddenColumnsInAdvancedFilter',
    'suppressMultiRangeSelection',
    'enterNavigatesVerticallyAfterEdit',
    'enterNavigatesVertically',
    'suppressPropertyNamesCheck',
    'rowMultiSelectWithClick',
    'suppressRowHoverHighlight',
    'suppressRowTransform',
    'suppressClipboardPaste',
    'suppressLastEmptyLineOnPaste',
    'enableCharts',
    'suppressMaintainUnsortedOrder',
    'enableCellTextSelection',
    'suppressBrowserResizeObserver',
    'suppressMaxRenderedRowRestriction',
    'excludeChildrenWhenTreeDataFiltering',
    'tooltipMouseTrack',
    'tooltipInteraction',
    'keepDetailRows',
    'paginateChildRows',
    'preventDefaultOnContextMenu',
    'undoRedoCellEditing',
    'allowDragFromColumnsToolPanel',
    'pivotSuppressAutoColumn',
    'suppressExpandablePivotGroups',
    'debounceVerticalScrollbar',
    'detailRowAutoHeight',
    'serverSideSortAllLevels',
    'serverSideEnableClientSideSort',
    'serverSideOnlyRefreshFilteredGroups',
    'suppressAggFilteredOnly',
    'showOpenedGroup',
    'suppressClipboardApi',
    'suppressModelUpdateAfterUpdateTransaction',
    'stopEditingWhenCellsLoseFocus',
    'groupMaintainOrder',
    'columnHoverHighlight',
    'readOnlyEdit',
    'suppressRowVirtualisation',
    'enableCellEditingOnBackspace',
    'resetRowDataOnUpdate',
    'removePivotHeaderRowWhenSingleValueColumn',
    'suppressCopySingleCellRanges',
    'suppressGroupRowsSticky',
    'suppressCutToClipboard',
    'rowGroupPanelSuppressSort',
    'allowShowChangeAfterFilter',
    'enableAdvancedFilter',
    'masterDetail',
    'treeData',
    'reactiveCustomComponents',
    'applyQuickFilterBeforePivotOrAgg',
    'suppressServerSideFullWidthLoadingRow',
    'suppressAdvancedFilterEval',
    'loading',
    'maintainColumnOrder',
    'enableStrictPivotColumnOrder',
    'suppressSetFilterByDefault',
];

// Used in example generation
export const _FUNCTION_GRID_OPTIONS: (CallbackKeys | FunctionKeys)[] = [
    'doesExternalFilterPass',
    'processPivotResultColDef',
    'processPivotResultColGroupDef',
    'getBusinessKeyForNode',
    'isRowSelectable',
    'rowDragText',
    'groupRowRenderer',
    'dragAndDropImageComponent',
    'fullWidthCellRenderer',
    'loadingCellRenderer',
    'loadingOverlayComponent',
    'noRowsOverlayComponent',
    'detailCellRenderer',
    'quickFilterParser',
    'quickFilterMatcher',
    'getLocaleText',
    'isExternalFilterPresent',
    'getRowHeight',
    'getRowClass',
    'getRowStyle',
    'getContextMenuItems',
    'getMainMenuItems',
    'processRowPostCreate',
    'processCellForClipboard',
    'getGroupRowAgg',
    'isFullWidthRow',
    'sendToClipboard',
    'focusGridInnerElement',
    'navigateToNextHeader',
    'tabToNextHeader',
    'navigateToNextCell',
    'tabToNextCell',
    'processCellFromClipboard',
    'getDocument',
    'postProcessPopup',
    'getChildCount',
    'getDataPath',
    'isRowMaster',
    'postSortRows',
    'processHeaderForClipboard',
    'processUnpinnedColumns',
    'processGroupHeaderForClipboard',
    'paginationNumberFormatter',
    'processDataFromClipboard',
    'getServerSideGroupKey',
    'isServerSideGroup',
    'createChartContainer',
    'getChartToolbarItems',
    'fillOperation',
    'isApplyServerSideTransaction',
    'getServerSideGroupLevelParams',
    'isServerSideGroupOpenByDefault',
    'isGroupOpenByDefault',
    'initialGroupOrderComparator',
    'loadingCellRendererSelector',
    'getRowId',
    'chartMenuItems',
    'groupTotalRow',
    'alwaysPassFilter',
];

// angular generation of component
// validation of properties
// Vue Runtime prop changes
// example generation
export const _ALL_GRID_OPTIONS: GridOptionKey[] = [
    ...ARRAY_GRID_OPTIONS,
    ...OBJECT_GRID_OPTIONS,
    ...STRING_GRID_OPTIONS,
    ..._NUMBER_GRID_OPTIONS,
    ..._FUNCTION_GRID_OPTIONS,
    ..._BOOLEAN_GRID_OPTIONS,
    ..._BOOLEAN_MIXED_GRID_OPTIONS,
    ...OTHER_GRID_OPTIONS,
];
