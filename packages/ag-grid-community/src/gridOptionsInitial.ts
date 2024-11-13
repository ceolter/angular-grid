import type { GridOptions } from './entities/gridOptions';

export const INITIAL_GRID_OPTION_KEYS = {
    enableBrowserTooltips: true,
    tooltipTrigger: true,
    tooltipMouseTrack: true,
    tooltipShowMode: true,
    tooltipInteraction: true,
    defaultColGroupDef: true,
    suppressAutoSize: true,
    skipHeaderOnAutoSize: true,
    autoSizeStrategy: true,
    components: true,
    stopEditingWhenCellsLoseFocus: true,
    undoRedoCellEditing: true,
    undoRedoCellEditingLimit: true,
    excelStyles: true,
    cacheQuickFilter: true,
    customChartThemes: true,
    chartThemeOverrides: true,
    chartToolPanelsDef: true,
    loadingCellRendererSelector: true,
    localeText: true,
    keepDetailRows: true,
    keepDetailRowsCount: true,
    detailRowHeight: true,
    detailRowAutoHeight: true,
    tabIndex: true,
    valueCache: true,
    valueCacheNeverExpires: true,
    enableCellExpressions: true,
    suppressTouch: true,
    suppressBrowserResizeObserver: true,
    suppressPropertyNamesCheck: true,
    debug: true,
    dragAndDropImageComponent: true,
    loadingOverlayComponent: true,
    suppressLoadingOverlay: true,
    noRowsOverlayComponent: true,
    paginationPageSizeSelector: true,
    paginateChildRows: true,
    pivotPanelShow: true,
    pivotSuppressAutoColumn: true,
    suppressExpandablePivotGroups: true,
    aggFuncs: true,
    allowShowChangeAfterFilter: true,
    ensureDomOrder: true,
    enableRtl: true,
    suppressColumnVirtualisation: true,
    suppressMaxRenderedRowRestriction: true,
    suppressRowVirtualisation: true,
    rowDragText: true,
    groupLockGroupColumns: true,
    suppressGroupRowsSticky: true,
    rowModelType: true,
    cacheOverflowSize: true,
    infiniteInitialRowCount: true,
    serverSideInitialRowCount: true,
    maxBlocksInCache: true,
    maxConcurrentDatasourceRequests: true,
    blockLoadDebounceMillis: true,
    serverSideOnlyRefreshFilteredGroups: true,
    serverSidePivotResultFieldSeparator: true,
    viewportRowModelPageSize: true,
    viewportRowModelBufferSize: true,
    debounceVerticalScrollbar: true,
    suppressAnimationFrame: true,
    suppressPreventDefaultOnMouseWheel: true,
    scrollbarWidth: true,
    icons: true,
    suppressRowTransform: true,
    gridId: true,
    enableGroupEdit: true,
    initialState: true,
    processUnpinnedColumns: true,
    createChartContainer: true,
    getLocaleText: true,
    getRowId: true,
    reactiveCustomComponents: true,
    columnMenu: true,
    suppressSetFilterByDefault: true,
    getDataPath: true,
};

type InitialGridOptionKey = keyof typeof INITIAL_GRID_OPTION_KEYS;
/**
 * Used simply to type check the default grid options.
 * Done here to allow inference of the above type, for gridOptionsService.get to infer where defaults exist.
 */
type AllValidKeys = Exclude<InitialGridOptionKey, keyof GridOptions> extends never ? true : false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const allValidKeys: AllValidKeys = true;

export type ManagedGridOptionKey = Exclude<keyof GridOptions, InitialGridOptionKey>;

export type ManagedGridOptions<TData = any> = {
    [K in ManagedGridOptionKey]?: GridOptions<TData>[K];
};
