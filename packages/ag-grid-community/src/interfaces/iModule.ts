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
    | 'AnimationFrameModule'
    | 'AriaModule'
    | 'AutoWidthModule'
    | 'CellRendererFunctionModule'
    | 'ChangeDetectionModule'
    | 'CheckboxCellRendererModule'
    | 'ClientSideRowModelFilterModule'
    | 'ClientSideRowModelHierarchyModule'
    | 'ColumnFilterModule'
    | 'ColumnFlexModule'
    | 'ColumnGroupHeaderCompModule'
    | 'ColumnGroupModule'
    | 'ColumnHeaderCompModule'
    | 'ColumnMoveModule'
    | 'ColumnResizeModule'
    | 'CommunityCoreModule'
    | 'CsrmSsrmSharedApiModule'
    | 'DataTypeModule'
    | 'DragModule'
    | 'EditCoreModule'
    | 'EnterpriseCoreModule'
    | 'ExpressionModule'
    | 'FilterCoreModule'
    | 'FilterValueModule'
    | 'GroupCellRendererModule'
    | 'GroupColumnModule'
    | 'HorizontalResizeModule'
    | 'KeyboardNavigationModule'
    | 'LoadingCellRendererModule'
    | 'MenuCoreModule'
    | 'MenuItemModule'
    | 'OverlayModule'
    | 'PinnedColumnModule'
    | 'PopupModule'
    | 'SharedAggregationModule'
    | 'SharedDragAndDropModule'
    | 'SharedExportModule'
    | 'SharedMasterDetailModule'
    | 'SharedMenuModule'
    | 'SharedPivotModule'
    | 'SharedRowGroupingModule'
    | 'SharedRowSelectionModule'
    | 'SharedTreeDataModule'
    | 'SideBarSharedModule'
    | 'SkeletonCellRendererModule'
    | 'SortModule'
    | 'SsrmInfiniteSharedApiModule'
    | 'StickyRowModule'
    | 'TouchModule';

export type CommunityModuleName =
    | 'AlignedGridsModule'
    | 'AllCommunityModule'
    | 'CellApiModule'
    | 'CellStyleModule'
    | 'CheckboxEditorModule'
    | 'ClientSideRowModelApiModule'
    | 'ClientSideRowModelModule'
    | 'ColumnApiModule'
    | 'ColumnAutoSizeModule'
    | 'ColumnHoverModule'
    | 'CsvExportModule'
    | 'CustomEditorModule'
    | 'CustomFilterModule'
    | 'DateEditorModule'
    | 'DateFilterModule'
    | 'DragAndDropModule'
    | 'EventApiModule'
    | 'ExternalFilterModule'
    | 'GridStateModule'
    | 'HighlightChangesModule'
    | 'InfiniteRowModelModule'
    | 'LargeTextEditorModule'
    | 'LocaleModule'
    | 'NumberEditorModule'
    | 'NumberFilterModule'
    | 'PaginationModule'
    | 'PinnedRowModule'
    | 'QuickFilterModule'
    | 'RenderApiModule'
    | 'RowApiModule'
    | 'RowAutoHeightModule'
    | 'RowDragModule'
    | 'RowSelectionModule'
    | 'RowStyleModule'
    | 'ScrollApiModule'
    | 'SelectEditorModule'
    | 'TextEditorModule'
    | 'TextFilterModule'
    | 'TooltipModule'
    | 'UndoRedoEditModule'
    | 'ValidationModule'
    | 'ValueCacheModule';

export type EnterpriseModuleName =
    | 'AdvancedFilterModule'
    | 'AllEnterpriseModule'
    | 'CellSelectionModule'
    | 'ClipboardModule'
    | 'ColumnMenuModule'
    | 'ColumnsToolPanelModule'
    | 'ContextMenuModule'
    | 'ExcelExportModule'
    | 'FiltersToolPanelModule'
    | 'GridChartsModule'
    | 'IntegratedChartsModule'
    | 'GroupFilterModule'
    | 'MasterDetailModule'
    | 'MenuModule'
    | 'MultiFilterModule'
    | 'PivotModule'
    | 'RangeSelectionModule'
    | 'RichSelectModule'
    | 'RowGroupingModule'
    | 'RowGroupingPanelModule'
    | 'ServerSideRowModelApiModule'
    | 'ServerSideRowModelModule'
    | 'SetFilterModule'
    | 'SideBarModule'
    | 'SparklinesModule'
    | 'StatusBarModule'
    | 'TreeDataModule'
    | 'ViewportRowModelModule';

export type ModuleName = InternalModuleName | CommunityModuleName | EnterpriseModuleName;

/** These are the internal modules that we have mappings for to convert into exported modules */
export type ResolvableModuleName = Extract<
    InternalModuleName,
    | 'EditCoreModule'
    | 'MenuCoreModule'
    | 'EnterpriseCoreModule'
    | 'ColumnHeaderCompModule'
    | 'ColumnFilterModule'
    | 'ColumnGroupHeaderCompModule'
    | 'SharedDragAndDropModule'
    | 'GroupCellRendererModule'
    | 'MenuItemModule'
    | 'CommunityCoreModule'
    | 'LoadingCellRendererModule'
    | 'SortModule'
    | 'SharedRowSelectionModule'
    | 'KeyboardNavigationModule'
    | 'SharedMenuModule'
    | 'ColumnMoveModule'
    | 'ColumnResizeModule'
    | 'FilterCoreModule'
    | 'CsrmSsrmSharedApiModule'
    | 'SsrmInfiniteSharedApiModule'
    | 'SharedMasterDetailModule'
    | 'SharedRowGroupingModule'
    | 'SharedAggregationModule'
    | 'SharedPivotModule'
    | 'ColumnGroupModule'
    | 'OverlayModule'
    | 'PinnedColumnModule'
    | 'ClientSideRowModelHierarchyModule'
    | 'SkeletonCellRendererModule'
    | 'CheckboxCellRendererModule'
    | 'SharedTreeDataModule'
>;

/** These are the types that we can display validations for */
export type ValidationModuleName = CommunityModuleName | EnterpriseModuleName | ResolvableModuleName;
