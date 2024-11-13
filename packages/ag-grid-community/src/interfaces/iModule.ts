import type { GridApi } from '../api/gridApi';
import type { ApiFunction, ApiFunctionName } from '../api/iApiFunction';
import type { ClassImp, ComponentMeta, DynamicBeanName, SingletonBean, UserComponentName } from '../context/context';
import type { IconName, IconValue } from '../utils/icon';
import { VERSION } from '../version';
import type { ComponentSelector } from '../widgets/component';
import type { RowModelType } from './iRowModel';

export type ModuleValidationValidResult = {
    isValid: true;
};

export type ModuleValidationInvalidResult = {
    isValid: false;
    message: string;
};

export type ModuleValidationResult = ModuleValidationValidResult | ModuleValidationInvalidResult;

/** A Module contains all the code related to this feature to enable tree shaking when this module is not used. */
export interface Module {
    moduleName: ModuleName;
    version: string;
    enterprise?: boolean;
    /**
     * Validation run when registering the module
     *
     * @return Whether the module is valid or not. If not, a message explaining why it is not valid
     */
    validate?: () => ModuleValidationResult;
    /** singleton beans which are created once on grid init */
    beans?: SingletonBean[];
    /** beans which can have many instances, and can be created/destroyed at any time */
    dynamicBeans?: Partial<Record<DynamicBeanName, ClassImp>>;
    /** components which can be overridden by the user (e.g. cell renderers). These are the default grid provided versions */
    userComponents?: Partial<Record<UserComponentName, ComponentMeta>>;
    /** selectors for grid components that can be defined in templates and created by AG stack */
    selectors?: ComponentSelector[];
    /**
     * icon mappings
     * *** IMPORTANT NOTE! ***
     * If you change the icons, copy/paste the new content into the docs page custom-icons
     */
    icons?: Partial<Record<IconName, IconValue>>;
    rowModels?: RowModelType[];
    dependsOn?: Module[];
    css?: string[];
}

/** Used to define a module that contains api functions. */
export type _ModuleWithApi<TGridApi extends Readonly<Partial<GridApi>>> = Module & {
    apiFunctions?: { [K in ApiFunctionName & keyof TGridApi]: ApiFunction<K> };
};
/** Used to define a module that does not contain api functions. */
export type _ModuleWithoutApi = Module & {
    apiFunctions?: never;
};
export function baseCommunityModule(moduleName: ModuleName): Readonly<Module> {
    return { moduleName, version: VERSION };
}

export type InternalModuleName =
    | 'AggregationModule'
    | 'AutoWidthModule'
    | 'CommunityCoreModule'
    | 'CsrmSsrmSharedApiModule'
    | 'DragAndDropModule'
    | 'DragModule'
    | 'EnterpriseCoreModule'
    | 'FilterValueModule'
    | 'GroupColumnModule'
    | 'HorizontalResizeModule'
    | 'MenuCoreModule'
    | 'MenuItemModule'
    | 'PopupModule'
    | 'SharedExportModule'
    | 'SharedMenuModule'
    | 'SideBarSharedModule'
    | 'SsrmInfiniteSharedApiModule';

export type CommunityModuleName =
    | 'AlignedGridsModule'
    | 'AllCommunityEditorsModule'
    | 'AllCommunityModule'
    | 'AnimateShowChangeCellRendererModule'
    | 'AnimateSlideCellRendererModule'
    | 'AnimationFrameModule'
    | 'AriaModule'
    | 'CellApiModule'
    | 'CellFlashModule'
    | 'CellRendererFunctionModule'
    | 'CellStyleModule'
    | 'ChangeDetectionModule'
    | 'CheckboxCellRendererModule'
    | 'ClientSideRowModelApiModule'
    | 'ClientSideRowModelCoreModule'
    | 'ClientSideRowModelDefaultModule'
    | 'ClientSideRowModelFilterModule'
    | 'ClientSideRowModelModule'
    | 'ClientSideRowModelSortModule'
    | 'ColumnAnimationModule'
    | 'ColumnApiModule'
    | 'ColumnAutoSizeModule'
    | 'ColumnFilterModule'
    | 'ColumnFlexModule'
    | 'ColumnGroupHeaderCompModule'
    | 'ColumnGroupModule'
    | 'ColumnHeaderCompModule'
    | 'ColumnHoverModule'
    | 'ColumnMoveCoreModule'
    | 'ColumnMoveModule'
    | 'ColumnResizeModule'
    | 'CommunityDefaultModule'
    | 'CommunityFeaturesModule'
    | 'CsvExportModule'
    | 'DataTypeEditorsModule'
    | 'DataTypeModule'
    | 'DefaultEditorModule'
    | 'EditCoreModule'
    | 'EditModule'
    | 'EventApiModule'
    | 'ExpressionModule'
    | 'FilterCoreModule'
    | 'FilterModule'
    | 'FloatingFilterModule'
    | 'FullRowEditModule'
    | 'GetColumnDefsApiModule'
    | 'InfiniteRowModelApiModule'
    | 'InfiniteRowModelCoreModule'
    | 'InfiniteRowModelDefaultModule'
    | 'InfiniteRowModelModule'
    | 'KeyboardNavigationModule'
    | 'LargeTextEditorModule'
    | 'LoadingOverlayModule'
    | 'LocaleModule'
    | 'NativeDragModule'
    | 'NoRowsOverlayModule'
    | 'OverlayCoreModule'
    | 'OverlayModule'
    | 'PaginationModule'
    | 'PinnedColumnModule'
    | 'PinnedRowModule'
    | 'QuickFilterModule'
    | 'ReadOnlyFloatingFilterModule'
    | 'RenderApiModule'
    | 'RowApiModule'
    | 'RowAutoHeightModule'
    | 'RowDragModule'
    | 'RowSelectionApiModule'
    | 'RowSelectionCoreModule'
    | 'RowSelectionModule'
    | 'RowStyleModule'
    | 'ScrollApiModule'
    | 'SelectEditorModule'
    | 'SelectionColumnModule'
    | 'SimpleFilterModule'
    | 'SimpleFloatingFilterModule'
    | 'SortCoreModule'
    | 'SortIndicatorCompModule'
    | 'SortModule'
    | 'StateModule'
    | 'StickyRowModule'
    | 'TooltipCoreModule'
    | 'TooltipCompModule'
    | 'TooltipModule'
    | 'TouchModule'
    | 'UndoRedoEditModule'
    | 'ValidationModule'
    | 'ValueCacheModule';

export type EnterpriseModuleName =
    | 'AdvancedFilterModule'
    | 'AllEnterpriseModule'
    | 'CellSelectionCoreModule'
    | 'CellSelectionFillHandleModule'
    | 'CellSelectionModule'
    | 'CellSelectionRangeHandleModule'
    | 'ClientSideRowModelHierarchyModule'
    | 'ClipboardModule'
    | 'ColumnMenuModule'
    | 'ColumnsToolPanelCoreModule'
    | 'ColumnsToolPanelModule'
    | 'ColumnsToolPanelRowGroupingModule'
    | 'ContextMenuModule'
    | 'EnterpriseDefaultModule'
    | 'ExcelExportModule'
    | 'FiltersToolPanelModule'
    | 'GridChartsModule'
    | 'IntegratedChartsModule'
    | 'GroupCellRendererModule'
    | 'GroupFilterModule'
    | 'GroupFloatingFilterModule'
    | 'LoadingCellRendererModule'
    | 'MasterDetailCoreModule'
    | 'MasterDetailModule'
    | 'MenuModule'
    | 'MultiFilterCoreModule'
    | 'MultiFilterModule'
    | 'MultiFloatingFilterModule'
    | 'PivotCoreModule'
    | 'PivotModule'
    | 'RangeSelectionModule'
    | 'RichSelectModule'
    | 'RowGroupingCoreModule'
    | 'RowGroupingModule'
    | 'RowGroupingOnlyModule'
    | 'RowGroupingPanelModule'
    | 'ServerSideRowModelApiModule'
    | 'ServerSideRowModelCoreModule'
    | 'ServerSideRowModelDefaultModule'
    | 'ServerSideRowModelHierarchyModule'
    | 'ServerSideRowModelModule'
    | 'ServerSideRowModelRowSelectionModule'
    | 'ServerSideRowModelSortModule'
    | 'SetFilterCoreModule'
    | 'SetFilterModule'
    | 'SetFloatingFilterModule'
    | 'SideBarModule'
    | 'SkeletonCellRendererModule'
    | 'SparklinesModule'
    | 'StatusBarCoreModule'
    | 'StatusBarModule'
    | 'StatusBarSelectionModule'
    | 'TreeDataCoreModule'
    | 'TreeDataModule'
    | 'ViewportRowModelCoreModule'
    | 'ViewportRowModelDefaultModule'
    | 'ViewportRowModelModule';

export type ModuleName = InternalModuleName | CommunityModuleName | EnterpriseModuleName;
