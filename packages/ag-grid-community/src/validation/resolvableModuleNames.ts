import type {
    CommunityModuleName,
    EnterpriseModuleName,
    ResolvableModuleName,
    ValidationModuleName,
} from '../interfaces/iModule';
import type { RowModelType } from '../interfaces/iRowModel';

const ALL_COLUMN_FILTERS = [
    'TextFilter',
    'NumberFilter',
    'DateFilter',
    'SetFilter',
    'MultiFilter',
    'GroupFilter',
    'CustomFilter',
] as const;

/**
 * Some of these modules are (for now) included by default in core. For these, we just return AllCommunityModule.
 */
export const RESOLVABLE_MODULE_NAMES: Record<
    ResolvableModuleName,
    readonly (CommunityModuleName | EnterpriseModuleName)[]
> = {
    EditCore: [
        'TextEditor',
        'NumberEditor',
        'DateEditor',
        'CheckboxEditor',
        'LargeTextEditor',
        'SelectEditor',
        'RichSelect',
        'CustomEditor',
    ],
    CheckboxCellRenderer: ['AllCommunity'],
    ClientSideRowModelHierarchy: ['RowGrouping', 'Pivot', 'TreeData'],
    ColumnFilter: ALL_COLUMN_FILTERS,
    ColumnGroupHeaderComp: ['AllCommunity'],
    ColumnGroup: ['AllCommunity'],
    ColumnHeaderComp: ['AllCommunity'],
    ColumnMove: ['AllCommunity'],
    ColumnResize: ['AllCommunity'],
    CommunityCore: ['AllCommunity'],
    CsrmSsrmSharedApi: ['ClientSideRowModelApi', 'ServerSideRowModelApi'],
    EnterpriseCore: ['AllEnterprise'],
    FilterCore: [...ALL_COLUMN_FILTERS, 'QuickFilter', 'ExternalFilter', 'AdvancedFilter'],
    GroupCellRenderer: ['RowGrouping', 'Pivot', 'TreeData', 'MasterDetail', 'ServerSideRowModel'],
    KeyboardNavigation: ['AllCommunity'],
    LoadingCellRenderer: ['ServerSideRowModel'],
    MenuCore: ['ColumnMenu', 'ContextMenu'],
    MenuItem: ['ColumnMenu', 'ContextMenu', 'MultiFilter', 'IntegratedCharts', 'ColumnsToolPanel'],
    Overlay: ['AllCommunity'],
    PinnedColumn: ['AllCommunity'],
    SharedAggregation: ['RowGrouping', 'Pivot', 'TreeData', 'ServerSideRowModel'],
    SharedDragAndDrop: ['AllCommunity'],
    SharedMasterDetail: ['MasterDetail', 'ServerSideRowModel'],
    SharedMenu: [...ALL_COLUMN_FILTERS, 'ColumnMenu', 'ContextMenu'],
    SharedPivot: ['Pivot', 'ServerSideRowModel'],
    SharedRowGrouping: ['RowGrouping', 'ServerSideRowModel'],
    SharedRowSelection: ['RowSelection', 'ServerSideRowModel'],
    SkeletonCellRenderer: ['ServerSideRowModel'],
    Sort: ['AllCommunity'],
    SsrmInfiniteSharedApi: ['InfiniteRowModel', 'ServerSideRowModelApi'],
    SharedTreeData: ['TreeData', 'ServerSideRowModel'],
};

export const MODULES_FOR_ROW_MODELS: Partial<Record<CommunityModuleName | EnterpriseModuleName, RowModelType>> = {
    InfiniteRowModel: 'infinite',
    ClientSideRowModelApi: 'clientSide',
    ClientSideRowModel: 'clientSide',
    ServerSideRowModelApi: 'serverSide',
    ServerSideRowModel: 'serverSide',
    ViewportRowModel: 'viewport',
};

export function resolveModuleNames(
    moduleName: ValidationModuleName | ValidationModuleName[],
    rowModelType: RowModelType
): (CommunityModuleName | EnterpriseModuleName)[] {
    const resolvedModuleNames: (CommunityModuleName | EnterpriseModuleName)[] = [];
    (Array.isArray(moduleName) ? moduleName : [moduleName]).forEach((modName) => {
        const resolved = RESOLVABLE_MODULE_NAMES[modName as ResolvableModuleName];
        if (resolved) {
            resolved.forEach((resolvedModName) => {
                const rowModelForModule = MODULES_FOR_ROW_MODELS[resolvedModName];
                // don't show module for different row models
                if (!rowModelForModule || rowModelForModule === rowModelType) {
                    resolvedModuleNames.push(resolvedModName);
                }
            });
        } else {
            resolvedModuleNames.push(modName as CommunityModuleName | EnterpriseModuleName);
        }
    });
    return resolvedModuleNames;
}
