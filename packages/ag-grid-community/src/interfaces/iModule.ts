import type { GridApi } from '../api/gridApi';
import type { ApiFunction, ApiFunctionName } from '../api/iApiFunction';
import type { ClassImp, ComponentMeta, DynamicBeanName, SingletonBean, UserComponentName } from '../context/context';
import type { IconName, IconValue } from '../utils/icon';
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

export type InternalModuleName =
    | 'Aggregation'
    | 'AnimationFrame'
    | 'Aria'
    | 'AutoWidth'
    | 'CellRendererFunction'
    | 'ChangeDetection'
    | 'CheckboxCellRenderer'
    | 'ClientSideRowModelFilter'
    | 'ClientSideRowModelHierarchy'
    | 'ColumnFilter'
    | 'ColumnFlex'
    | 'ColumnGroupHeaderComp'
    | 'ColumnGroup'
    | 'ColumnHeaderComp'
    | 'ColumnMove'
    | 'ColumnResize'
    | 'CommunityCore'
    | 'CsrmSsrmSharedApi'
    | 'DataType'
    | 'Drag'
    | 'EditCore'
    | 'EnterpriseCore'
    | 'Expression'
    | 'FilterCore'
    | 'FilterValue'
    | 'GroupCellRenderer'
    | 'GroupColumn'
    | 'HorizontalResize'
    | 'KeyboardNavigation'
    | 'LoadingCellRenderer'
    | 'MenuCore'
    | 'MenuItem'
    | 'Overlay'
    | 'PinnedColumn'
    | 'Popup'
    | 'SharedAggregation'
    | 'SharedDragAndDrop'
    | 'SharedExport'
    | 'SharedMasterDetail'
    | 'SharedMenu'
    | 'SharedPivot'
    | 'SharedRowGrouping'
    | 'SharedRowSelection'
    | 'SharedTreeData'
    | 'SideBarShared'
    | 'SkeletonCellRenderer'
    | 'Sort'
    | 'SsrmInfiniteSharedApi'
    | 'StickyRow'
    | 'Touch';

export type CommunityModuleName =
    | 'AlignedGrids'
    | 'AllCommunity'
    | 'CellApi'
    | 'CellStyle'
    | 'CheckboxEditor'
    | 'ClientSideRowModelApi'
    | 'ClientSideRowModel'
    | 'ColumnApi'
    | 'ColumnAutoSize'
    | 'ColumnHover'
    | 'CsvExport'
    | 'CustomEditor'
    | 'CustomFilter'
    | 'DateEditor'
    | 'DateFilter'
    | 'DragAndDrop'
    | 'EventApi'
    | 'ExternalFilter'
    | 'GridState'
    | 'HighlightChanges'
    | 'InfiniteRowModel'
    | 'LargeTextEditor'
    | 'Locale'
    | 'NumberEditor'
    | 'NumberFilter'
    | 'Pagination'
    | 'PinnedRow'
    | 'QuickFilter'
    | 'RenderApi'
    | 'RowApi'
    | 'RowAutoHeight'
    | 'RowDrag'
    | 'RowSelection'
    | 'RowStyle'
    | 'ScrollApi'
    | 'SelectEditor'
    | 'TextEditor'
    | 'TextFilter'
    | 'Tooltip'
    | 'UndoRedoEdit'
    | 'Validation'
    | 'ValueCache';

export type EnterpriseModuleName =
    | 'AdvancedFilter'
    | 'AllEnterprise'
    | 'CellSelection'
    | 'Clipboard'
    | 'ColumnMenu'
    | 'ColumnsToolPanel'
    | 'ContextMenu'
    | 'ExcelExport'
    | 'FiltersToolPanel'
    | 'GridCharts'
    | 'IntegratedCharts'
    | 'GroupFilter'
    | 'MasterDetail'
    | 'Menu'
    | 'MultiFilter'
    | 'Pivot'
    | 'RangeSelection'
    | 'RichSelect'
    | 'RowGrouping'
    | 'RowGroupingPanel'
    | 'ServerSideRowModelApi'
    | 'ServerSideRowModel'
    | 'SetFilter'
    | 'SideBar'
    | 'Sparklines'
    | 'StatusBar'
    | 'TreeData'
    | 'ViewportRowModel';

export type ModuleName = InternalModuleName | CommunityModuleName | EnterpriseModuleName;

/** These are the internal modules that we have mappings for to convert into exported modules */
export type ResolvableModuleName = Extract<
    InternalModuleName,
    | 'EditCore'
    | 'MenuCore'
    | 'EnterpriseCore'
    | 'ColumnHeaderComp'
    | 'ColumnFilter'
    | 'ColumnGroupHeaderComp'
    | 'SharedDragAndDrop'
    | 'GroupCellRenderer'
    | 'MenuItem'
    | 'CommunityCore'
    | 'LoadingCellRenderer'
    | 'Sort'
    | 'SharedRowSelection'
    | 'KeyboardNavigation'
    | 'SharedMenu'
    | 'ColumnMove'
    | 'ColumnResize'
    | 'FilterCore'
    | 'CsrmSsrmSharedApi'
    | 'SsrmInfiniteSharedApi'
    | 'SharedMasterDetail'
    | 'SharedRowGrouping'
    | 'SharedAggregation'
    | 'SharedPivot'
    | 'ColumnGroup'
    | 'Overlay'
    | 'PinnedColumn'
    | 'ClientSideRowModelHierarchy'
    | 'SkeletonCellRenderer'
    | 'CheckboxCellRenderer'
    | 'SharedTreeData'
>;

/** These are the types that we can display validations for */
export type ValidationModuleName = CommunityModuleName | EnterpriseModuleName | ResolvableModuleName;
