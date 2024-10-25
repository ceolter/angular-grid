import type { AlignedGridsService } from '../alignedGrids/alignedGridsService';
import type { ApiFunctionService } from '../api/apiFunctionService';
import type { GridApi } from '../api/gridApi';
import type { ColumnAutosizeService } from '../columnAutosize/columnAutosizeService';
import type { ColumnMoveService } from '../columnMove/columnMoveService';
import type { ColumnResizeService } from '../columnResize/columnResizeService';
import type { ColumnDefFactory } from '../columns/columnDefFactory';
import type { ColumnFactory } from '../columns/columnFactory';
import type { ColumnFlexService } from '../columns/columnFlexService';
import type { ColumnGroupService } from '../columns/columnGroups/columnGroupService';
import type { ColumnHoverService } from '../columns/columnHover/columnHoverService';
import type { ColumnModel } from '../columns/columnModel';
import type { ColumnNameService } from '../columns/columnNameService';
import type { ColumnStateService } from '../columns/columnStateService';
import type { ColumnViewportService } from '../columns/columnViewportService';
import type { DataTypeService } from '../columns/dataTypeService';
import type { FuncColsService } from '../columns/funcColsService';
import type { SelectionColService } from '../columns/selectionColService';
import type { VisibleColsService } from '../columns/visibleColsService';
import type { AgComponentUtils } from '../components/framework/agComponentUtils';
import type { FrameworkComponentWrapper } from '../components/framework/frameworkComponentWrapper';
import type { Registry } from '../components/framework/registry';
import type { UserComponentFactory } from '../components/framework/userComponentFactory';
import type { CtrlsService } from '../ctrlsService';
import type { DragAndDropService } from '../dragAndDrop/dragAndDropService';
import type { DragService } from '../dragAndDrop/dragService';
import type { HorizontalResizeService } from '../dragAndDrop/horizontalResizeService';
import type { RowDragService } from '../dragAndDrop/rowDragService';
import type { EditService } from '../edit/editService';
import type { RowEditService } from '../edit/rowEditService';
import type { GridOptions } from '../entities/gridOptions';
import type { Environment } from '../environment';
import type { EventService } from '../eventService';
import type { AgGlobalEventListener } from '../events';
import type { ColumnFilterService } from '../filter/columnFilterService';
import type { FilterManager } from '../filter/filterManager';
import type { FilterValueService } from '../filter/filterValueService';
import type { QuickFilterService } from '../filter/quickFilterService';
import type { FocusService } from '../focusService';
import type { MouseEventService } from '../gridBodyComp/mouseEventService';
import type { ScrollVisibleService } from '../gridBodyComp/scrollVisibleService';
import type { GridDestroyService } from '../gridDestroyService';
import type { GridOptionsService } from '../gridOptionsService';
import type { RowNodeBlockLoader } from '../infiniteRowModel/rowNodeBlockLoader';
import type { IChartService } from '../interfaces/IChartService';
import type { IRangeService } from '../interfaces/IRangeService';
import type { IAdvancedFilterService } from '../interfaces/iAdvancedFilterService';
import type { IAggColumnNameService } from '../interfaces/iAggColumnNameService';
import type { IAggFuncService } from '../interfaces/iAggFuncService';
import type { IAutoColService } from '../interfaces/iAutoColService';
import type { IClientSideNodeManager } from '../interfaces/iClientSideNodeManager';
import type { IClipboardService } from '../interfaces/iClipboardService';
import type { IContextMenuService } from '../interfaces/iContextMenu';
import type { ICsvCreator } from '../interfaces/iCsvCreator';
import type { IDetailGridApiService } from '../interfaces/iDetailGridApiService';
import type { IExcelCreator } from '../interfaces/iExcelCreator';
import type { IExpansionService } from '../interfaces/iExpansionService';
import type { IFrameworkOverrides } from '../interfaces/iFrameworkOverrides';
import type { IGroupHideOpenParentsService } from '../interfaces/iGroupHideOpenParentsService';
import type { IMenuFactory } from '../interfaces/iMenuFactory';
import type { IPivotColDefService } from '../interfaces/iPivotColDefService';
import type { IPivotResultColsService } from '../interfaces/iPivotResultColsService';
import type { IRowChildrenService } from '../interfaces/iRowChildrenService';
import type { IRowModel } from '../interfaces/iRowModel';
import type { IRowNodeStage } from '../interfaces/iRowNodeStage';
import type { ISelectionService } from '../interfaces/iSelectionService';
import type { IServerSideTransactionManager } from '../interfaces/iServerSideRowModel';
import type { IShowRowGroupColsService } from '../interfaces/iShowRowGroupColsService';
import type { ISideBarService } from '../interfaces/iSideBar';
import type { IMasterDetailService } from '../interfaces/masterDetail';
import type { IRenderStatusService } from '../interfaces/renderStatusService';
import type { AnimationFrameService } from '../misc/animationFrameService';
import type { ApiEventService } from '../misc/apiEvents/apiEventService';
import type { LocaleService } from '../misc/locale/localeService';
import type { MenuService } from '../misc/menu/menuService';
import type { StateService } from '../misc/state/stateService';
import { _unRegisterGridModules } from '../modules/moduleRegistry';
import type { CellNavigationService } from '../navigation/cellNavigationService';
import type { HeaderNavigationService } from '../navigation/headerNavigationService';
import type { NavigationService } from '../navigation/navigationService';
import type { PageBoundsListener } from '../pagination/pageBoundsListener';
import type { PageBoundsService } from '../pagination/pageBoundsService';
import type { PaginationAutoPageSizeService } from '../pagination/paginationAutoPageSizeService';
import type { PaginationService } from '../pagination/paginationService';
import type { PinnedColumnService } from '../pinnedColumns/pinnedColumnService';
import type { PinnedRowModel } from '../pinnedRowModel/pinnedRowModel';
import type { AriaAnnouncementService } from '../rendering/ariaAnnouncementService';
import type { AutoWidthCalculator } from '../rendering/autoWidthCalculator';
import type { CellFlashService } from '../rendering/cell/cellFlashService';
import type { ColumnAnimationService } from '../rendering/columnAnimationService';
import type { StickyRowService } from '../rendering/features/stickyRowService';
import type { OverlayService } from '../rendering/overlays/overlayService';
import type { RowAutoHeightService } from '../rendering/row/rowAutoHeightService';
import type { RowContainerHeightService } from '../rendering/rowContainerHeightService';
import type { RowRenderer } from '../rendering/rowRenderer';
import type { RowNodeSorter } from '../sort/rowNodeSorter';
import type { SortService } from '../sort/sortService';
import type { CellStyleService } from '../styling/cellStyleService';
import type { RowStyleService } from '../styling/rowStyleService';
import type { SyncService } from '../syncService';
import type { TooltipService } from '../tooltip/tooltipService';
import type { UndoRedoService } from '../undoRedo/undoRedoService';
import type { ValidationService } from '../validation/validationService';
import type { ExpressionService } from '../valueService/expressionService';
import type { ValueCache } from '../valueService/valueCache';
import type { ValueService } from '../valueService/valueService';
import type { PopupService } from '../widgets/popupService';
import type { GenericContextParams, GenericSingletonBean } from './genericContext';
import { GenericContext } from './genericContext';

export interface ContextParams extends GenericContextParams<BeanName, BeanCollection> {
    gridId: string;
}

export interface SingletonBean extends GenericSingletonBean<BeanName, BeanCollection> {}

export type DynamicBeanName =
    | 'detailCellRendererCtrl'
    | 'dndSourceComp'
    | 'fillHandle'
    | 'groupCellRendererCtrl'
    | 'headerFilterCellCtrl'
    | 'headerGroupCellCtrl'
    | 'rangeHandle'
    | 'tooltipFeature';

export type UserComponentName =
    | 'agDragAndDropImage'
    | 'agColumnHeader'
    | 'agColumnGroupHeader'
    | 'agSortIndicator'
    | 'agAnimateShowChangeCellRenderer'
    | 'agAnimateSlideCellRenderer'
    | 'agLoadingCellRenderer'
    | 'agSkeletonCellRenderer'
    | 'agCheckboxCellRenderer'
    | 'agLoadingOverlay'
    | 'agNoRowsOverlay'
    | 'agTooltipComponent'
    | 'agReadOnlyFloatingFilter'
    | 'agTextColumnFilter'
    | 'agNumberColumnFilter'
    | 'agDateColumnFilter'
    | 'agDateInput'
    | 'agTextColumnFloatingFilter'
    | 'agNumberColumnFloatingFilter'
    | 'agDateColumnFloatingFilter'
    | 'agMultiColumnFilter'
    | 'agMultiColumnFloatingFilter'
    | 'agGroupColumnFilter'
    | 'agGroupColumnFloatingFilter'
    | 'agSetColumnFilter'
    | 'agSetColumnFloatingFilter'
    | 'agCellEditor'
    | 'agSelectCellEditor'
    | 'agTextCellEditor'
    | 'agNumberCellEditor'
    | 'agDateCellEditor'
    | 'agDateStringCellEditor'
    | 'agCheckboxCellEditor'
    | 'agLargeTextCellEditor'
    | 'agRichSelect'
    | 'agRichSelectCellEditor'
    | 'agMenuItem'
    | 'agColumnsToolPanel'
    | 'agFiltersToolPanel'
    | 'agGroupRowRenderer'
    | 'agGroupCellRenderer'
    | 'agDetailCellRenderer'
    | 'agSparklineCellRenderer'
    | 'agAggregationComponent'
    | 'agSelectedRowCountComponent'
    | 'agTotalRowCountComponent'
    | 'agFilteredRowCountComponent'
    | 'agTotalAndFilteredRowCountComponent';

export type ClassImp = new (...args: []) => object;
export type ComponentMeta =
    | ClassImp
    | {
          classImp: ClassImp;
          /** Default params for provided components */
          params?: any;
      };

export interface CoreBeanCollection {
    context: Context;
    pageBoundsListener: PageBoundsListener;
    gos: GridOptionsService;
    environment: Environment;
    rowRenderer: RowRenderer;
    valueSvc: ValueService;
    eventSvc: EventService;
    colModel: ColumnModel;
    colViewport: ColumnViewportService;
    colNames: ColumnNameService;
    visibleCols: VisibleColsService;
    colMoves?: ColumnMoveService;
    colFlex?: ColumnFlexService;
    colResize?: ColumnResizeService;
    headerNavigation?: HeaderNavigationService;
    navigation?: NavigationService;
    colAnimation?: ColumnAnimationService;
    focusSvc: FocusService;
    popupSvc?: PopupService;
    cellStyles?: CellStyleService;
    colHover?: ColumnHoverService;
    userCompFactory: UserComponentFactory;
    registry: Registry;
    animationFrameSvc?: AnimationFrameService;
    dragSvc?: DragService;
    dragAndDrop?: DragAndDropService;
    sortSvc?: SortService;
    colFilter?: ColumnFilterService;
    filterManager?: FilterManager;
    rowContainerHeight: RowContainerHeightService;
    frameworkOverrides: IFrameworkOverrides;
    selectionSvc?: ISelectionService;
    rowStyleSvc?: RowStyleService;
    rowModel: IRowModel;
    ctrlsSvc: CtrlsService;
    valueCache?: ValueCache;
    localeSvc?: LocaleService;
    syncSvc: SyncService;
    ariaAnnounce: AriaAnnouncementService;
    rangeSvc?: IRangeService;
    validation?: ValidationService;
    gridApi: GridApi;
    gridOptions: GridOptions;
    eGridDiv: HTMLElement;
    colState: ColumnStateService;
    colFactory: ColumnFactory;
    pivotResultCols?: IPivotResultColsService;
    autoColSvc?: IAutoColService;
    selectionColSvc?: SelectionColService;
    colDefFactory?: ColumnDefFactory;
    colAutosize?: ColumnAutosizeService;
    funcColsSvc: FuncColsService;
    quickFilter?: QuickFilterService;
    showRowGroupCols?: IShowRowGroupColsService;
    dataTypeSvc?: DataTypeService;
    globalEventListener: AgGlobalEventListener;
    globalSyncEventListener: AgGlobalEventListener;
    stateSvc?: StateService;
    overlays?: OverlayService;
    pinnedRowModel?: PinnedRowModel;
    menuSvc?: MenuService;
    apiEventSvc?: ApiEventService;
    undoRedo?: UndoRedoService;
    rowNodeBlockLoader?: RowNodeBlockLoader;
    csvCreator?: ICsvCreator;
    excelCreator?: IExcelCreator;
    clipboardSvc?: IClipboardService;
    mouseEventSvc: MouseEventService;
    cellNavigation?: CellNavigationService;
    scrollVisibleSvc: ScrollVisibleService;
    pinnedCols?: PinnedColumnService;
    expressionSvc?: ExpressionService;
    autoWidthCalculator?: AutoWidthCalculator;
    agComponentUtils?: AgComponentUtils;
    frameworkComponentWrapper: FrameworkComponentWrapper;
    horizontalResizeSvc?: HorizontalResizeService;
    filterMenuFactory?: IMenuFactory;
    enterpriseMenuFactory?: IMenuFactory;
    contextMenuSvc?: IContextMenuService;
    editSvc?: EditService;
    rowEditSvc?: RowEditService;
    alignedGridsSvc?: AlignedGridsService;
    paginationAutoPageSizeSvc?: PaginationAutoPageSizeService;
    pagination?: PaginationService;
    pageBounds: PageBoundsService;
    apiFunctionSvc: ApiFunctionService;
    detailGridApiSvc?: IDetailGridApiService;
    gridDestroySvc: GridDestroyService;
    expansionSvc?: IExpansionService;
    sideBar?: ISideBarService;
    ssrmTransactionManager?: IServerSideTransactionManager;
    aggFuncSvc?: IAggFuncService;
    advancedFilter: IAdvancedFilterService;
    filterStage?: IRowNodeStage;
    sortStage?: IRowNodeStage;
    flattenStage?: IRowNodeStage;
    groupStage?: IRowNodeStage;
    aggregationStage?: IRowNodeStage;
    pivotStage?: IRowNodeStage;
    filterAggregatesStage?: IRowNodeStage;
    rowNodeSorter?: RowNodeSorter;
    pivotColDefSvc?: IPivotColDefService;
    chartSvc?: IChartService;
    aggColumnNameSvc?: IAggColumnNameService;
    renderStatus?: IRenderStatusService;
    rowDragSvc?: RowDragService;
    stickyRowSvc?: StickyRowService;
    groupHideOpenParentsSvc?: IGroupHideOpenParentsService;
    filterValueSvc?: FilterValueService;
    csrmNodeSvc?: IClientSideNodeManager;
    csrmPathTreeNodeSvc?: IClientSideNodeManager;
    csrmChildrenTreeNodeSvc?: IClientSideNodeManager;
    cellFlashSvc?: CellFlashService;
    masterDetailSvc?: IMasterDetailService;
    tooltipSvc?: TooltipService;
    columnGroupSvc?: ColumnGroupService;
    rowAutoHeight?: RowAutoHeightService;
    rowChildrenSvc?: IRowChildrenService;
}

export type BeanCollection = CoreBeanCollection & {
    // `unknown | undefined` to make sure the type is handled correctly when used
    [key in Exclude<BeanName, keyof CoreBeanCollection>]?: unknown;
};

export class Context extends GenericContext<BeanName, BeanCollection> {
    private gridId: string;

    protected override init(params: ContextParams): void {
        this.gridId = params.gridId;

        this.beans.context = this;
        super.init(params);
    }

    public override destroy(): void {
        super.destroy();

        _unRegisterGridModules(this.gridId);
    }

    public getGridId(): string {
        return this.gridId;
    }
}

export type BeanName =
    | 'advancedFilterExpressionService'
    | 'advancedFilter'
    | 'advancedSettingsMenuFactory'
    | 'aggFuncSvc'
    | 'agComponentUtils'
    | 'aggColumnNameSvc'
    | 'aggregationStage'
    | 'alignedGridsSvc'
    | 'animationFrameSvc'
    | 'apiFunctionSvc'
    | 'ariaAnnounce'
    | 'apiEventSvc'
    | 'autoColSvc'
    | 'autoWidthCalculator'
    | 'beans'
    | 'cellEditorFactory'
    | 'cellFlashSvc'
    | 'cellNavigation'
    | 'cellRendererFactory'
    | 'cellRendererService'
    | 'cellStyles'
    | 'changeDetectionService'
    | 'chartColumnService'
    | 'chartCrossFilterService'
    | 'chartMenuItemMapper'
    | 'chartMenuListFactory'
    | 'chartMenuService'
    | 'chartTranslationService'
    | 'chartSvc'
    | 'clipboardSvc'
    | 'colAnimation'
    | 'colAutosize'
    | 'columnChooserFactory'
    | 'columnController'
    | 'colDefFactory'
    | 'columnEditorFactory'
    | 'colFactory'
    | 'colFilter'
    | 'colFlex'
    | 'columnGroupSvc'
    | 'colHover'
    | 'columnMenuFactory'
    | 'colModel'
    | 'colMoves'
    | 'colNames'
    | 'columnPositionService'
    | 'colResize'
    | 'colState'
    | 'columnToolPanelFactory'
    | 'columnUtils'
    | 'colViewport'
    | 'pivotResultCols'
    | 'context'
    | 'contextMenuSvc'
    | 'selectionColSvc'
    | 'ctrlsSvc'
    | 'csvCreator'
    | 'dataTypeSvc'
    | 'visibleCols'
    | 'detailGridApiSvc'
    | 'dragAndDrop'
    | 'dragSvc'
    | 'editSvc'
    | 'excelCreator'
    | 'enterpriseMenuFactory'
    | 'environment'
    | 'eventSvc'
    | 'eGridDiv'
    | 'enterpriseChartProxyFactory'
    | 'expansionSvc'
    | 'expressionSvc'
    | 'filterAggregatesStage'
    | 'filterManager'
    | 'filterMenuFactory'
    | 'filterStage'
    | 'filterValueSvc'
    | 'flashCellService'
    | 'flattenStage'
    | 'focusSvc'
    | 'funcColsSvc'
    | 'frameworkComponentWrapper'
    | 'frameworkOverrides'
    | 'globalEventListener'
    | 'globalSyncEventListener'
    | 'gridApi'
    | 'gridDestroySvc'
    | 'gridOptions'
    | 'gos'
    | 'gridOptionsWrapper'
    | 'gridSerializer'
    | 'groupHideOpenParentsSvc'
    | 'groupStage'
    | 'headerNavigation'
    | 'horizontalResizeSvc'
    | 'lazyBlockLoadingService'
    | 'licenseManager'
    | 'localeSvc'
    | 'loggerFactory'
    | 'masterDetailSvc'
    | 'menuItemMapper'
    | 'menuSvc'
    | 'menuUtils'
    | 'modelItemUtils'
    | 'mouseEventSvc'
    | 'navigation'
    | 'overlays'
    | 'paginationAutoPageSizeSvc'
    | 'pagination'
    | 'pinnedRowModel'
    | 'pinnedCols'
    | 'pivotColDefSvc'
    | 'pivotStage'
    | 'popupSvc'
    | 'quickFilter'
    | 'rangeSvc'
    | 'pageBoundsListener'
    | 'pageBounds'
    | 'registry'
    | 'renderStatus'
    | 'rowAutoHeight'
    | 'rowChildrenSvc'
    | 'rowContainerHeight'
    | 'rowDragSvc'
    | 'rowEditSvc'
    | 'rowModel'
    | 'rowNodeBlockLoader'
    | 'rowNodeSorter'
    | 'rowRenderer'
    | 'rowStyleSvc'
    | 'scrollVisibleSvc'
    | 'selectionController'
    | 'selectionSvc'
    | 'showRowGroupCols'
    | 'sideBar'
    | 'sortSvc'
    | 'sortStage'
    | 'sparklineTooltipSingleton'
    | 'ssrmBlockUtils'
    | 'ssrmExpandListener'
    | 'ssrmFilterListener'
    | 'ssrmListenerUtils'
    | 'ssrmNodeManager'
    | 'ssrmSortService'
    | 'ssrmStoreFactory'
    | 'ssrmStoreUtils'
    | 'ssrmTransactionManager'
    | 'stateSvc'
    | 'statusBarService'
    | 'stickyRowSvc'
    | 'syncSvc'
    | 'templateService'
    | 'toolPanelColDefService'
    | 'tooltipSvc'
    | 'undoRedo'
    | 'userCompFactory'
    | 'valueCache'
    | 'valueSvc'
    | 'validationLogger'
    | 'validation'
    | 'csrmNodeSvc'
    | 'csrmPathTreeNodeSvc'
    | 'csrmChildrenTreeNodeSvc';
