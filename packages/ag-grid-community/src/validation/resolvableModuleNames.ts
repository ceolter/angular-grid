import type {
    CommunityModuleName,
    EnterpriseModuleName,
    ResolvableModuleName,
    ValidationModuleName,
} from '../interfaces/iModule';
import type { RowModelType } from '../interfaces/iRowModel';

const ALL_COLUMN_FILTERS = [
    'TextFilterModule',
    'NumberFilterModule',
    'DateFilterModule',
    'SetFilterModule',
    'MultiFilterModule',
    'GroupFilterModule',
    'CustomFilterModule',
] as const;

/**
 * Some of these modules are (for now) included by default in core. For these, we just return AllCommunityModule.
 */
export const RESOLVABLE_MODULE_NAMES: Record<
    ResolvableModuleName,
    readonly (CommunityModuleName | EnterpriseModuleName)[]
> = {
    EditCoreModule: [
        'TextEditorModule',
        'NumberEditorModule',
        'DateEditorModule',
        'CheckboxEditorModule',
        'LargeTextEditorModule',
        'SelectEditorModule',
        'RichSelectModule',
        'CustomEditorModule',
    ],
    CheckboxCellRendererModule: ['AllCommunityModule'],
    ClientSideRowModelHierarchyModule: ['RowGroupingModule', 'PivotModule', 'TreeDataModule'],
    ColumnFilterModule: ALL_COLUMN_FILTERS,
    ColumnGroupHeaderCompModule: ['AllCommunityModule'],
    ColumnGroupModule: ['AllCommunityModule'],
    ColumnHeaderCompModule: ['AllCommunityModule'],
    ColumnMoveModule: ['AllCommunityModule'],
    ColumnResizeModule: ['AllCommunityModule'],
    CommunityCoreModule: ['AllCommunityModule'],
    CsrmSsrmSharedApiModule: ['ClientSideRowModelApiModule', 'ServerSideRowModelApiModule'],
    EnterpriseCoreModule: ['AllEnterpriseModule'],
    FilterCoreModule: [...ALL_COLUMN_FILTERS, 'QuickFilterModule', 'ExternalFilterModule', 'AdvancedFilterModule'],
    GroupCellRendererModule: [
        'RowGroupingModule',
        'PivotModule',
        'TreeDataModule',
        'MasterDetailModule',
        'ServerSideRowModelModule',
    ],
    KeyboardNavigationModule: ['AllCommunityModule'],
    LoadingCellRendererModule: ['ServerSideRowModelModule'],
    MenuCoreModule: ['ColumnMenuModule', 'ContextMenuModule'],
    MenuItemModule: [
        'ColumnMenuModule',
        'ContextMenuModule',
        'MultiFilterModule',
        'IntegratedChartsModule',
        'ColumnsToolPanelModule',
    ],
    OverlayModule: ['AllCommunityModule'],
    PinnedColumnModule: ['AllCommunityModule'],
    SharedAggregationModule: ['RowGroupingModule', 'PivotModule', 'TreeDataModule', 'ServerSideRowModelModule'],
    SharedDragAndDropModule: ['AllCommunityModule'],
    SharedMasterDetailModule: ['MasterDetailModule', 'ServerSideRowModelModule'],
    SharedMenuModule: [...ALL_COLUMN_FILTERS, 'ColumnMenuModule', 'ContextMenuModule'],
    SharedPivotModule: ['PivotModule', 'ServerSideRowModelModule'],
    SharedRowGroupingModule: ['RowGroupingModule', 'ServerSideRowModelModule'],
    SharedRowSelectionModule: ['RowSelectionModule', 'ServerSideRowModelModule'],
    SkeletonCellRendererModule: ['ServerSideRowModelModule'],
    SortModule: ['AllCommunityModule'],
    SsrmInfiniteSharedApiModule: ['InfiniteRowModelModule', 'ServerSideRowModelApiModule'],
    SharedTreeDataModule: ['TreeDataModule', 'ServerSideRowModelModule'],
};

export const MODULES_FOR_ROW_MODELS: Partial<Record<CommunityModuleName | EnterpriseModuleName, RowModelType>> = {
    InfiniteRowModelModule: 'infinite',
    ClientSideRowModelApiModule: 'clientSide',
    ClientSideRowModelModule: 'clientSide',
    ServerSideRowModelApiModule: 'serverSide',
    ServerSideRowModelModule: 'serverSide',
    ViewportRowModelModule: 'viewport',
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
