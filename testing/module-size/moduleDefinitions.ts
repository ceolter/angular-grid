import { ModuleName } from 'ag-grid-community';

import { CommunityModuleName, EnterpriseModuleName } from '../../packages/ag-grid-community/src/interfaces/iModule';

export const AllCommunityModules: Record<CommunityModuleName, number> = {
    AlignedGridsModule: 3.06,
    AllCommunityModule: 546.49,
    AnimateShowChangeCellRendererModule: 1.73,
    AnimateSlideCellRendererModule: 1.45,
    CellApiModule: 0.28,
    CellFlashModule: 0.98,
    CellRendererFunctionModule: 0.48,
    CellStyleModule: 2.24,
    ClientSideRowModelApiModule: 1.88,
    ClientSideRowModelModule: 29.1,
    ColumnApiModule: 2.53,
    ColumnAutoSizeModule: 6.34,
    ColumnFlexModule: 1.81,
    ColumnHoverModule: 1.58,
    CommunityFeaturesModule: 351.57,
    CsvExportModule: 11.3,
    CustomEditorModule: 17.36,
    CustomFilterModule: 54.48,
    DataTypeEditorsModule: 25.33,
    DefaultEditorModule: 19.95,
    EventApiModule: 2.64,
    ExpressionModule: 0.86,
    ExternalFilterModule: 13.69,
    FullRowEditModule: 18.34,
    GetColumnDefsApiModule: 1.76,
    InfiniteRowModelModule: 18.08,
    LargeTextEditorModule: 18.6,
    LocaleModule: 0.43,
    NativeDragModule: 1.47,
    PaginationModule: 42.74,
    PinnedRowModule: 9.35,
    QuickFilterModule: 18.37,
    RenderApiModule: 1.48,
    RowApiModule: 0.88,
    RowAutoHeightModule: 1.84,
    RowDragModule: 13.29,
    RowSelectionModule: 29.91,
    RowStyleModule: 1.24,
    ScrollApiModule: 0.7,
    SelectEditorModule: 31.89,
    SimpleFilterModule: 126.92,
    StateModule: 13.24,
    TooltipModule: 22.24,
    UndoRedoEditModule: 23.5,
    ValidationModule: 69.56,
    ValueCacheModule: 0.65,
};
export const AllEnterpriseModules: Record<EnterpriseModuleName, number> = {
    AdvancedFilterModule: 2713.3,
    AllEnterpriseModule: 3618.99,
    CellSelectionModule: 2569.52,
    ClipboardModule: 2597.86,
    ColumnMenuModule: 2604.98,
    ColumnsToolPanelModule: 2822.46,
    ContextMenuModule: 2599.67,
    ExcelExportModule: 2637.37,
    FiltersToolPanelModule: 2639.18,
    GridChartsModule: 2569.52,
    IntegratedChartsModule: 432,
    GroupFilterModule: 2657.24,
    MasterDetailModule: 2625.17,
    MenuModule: 2676.84,
    MultiFilterModule: 2621.69,
    PivotModule: 2719.92,
    RangeSelectionModule: 2569.57,
    RichSelectModule: 2610.33,
    RowGroupingModule: 2742.15,
    RowGroupingPanelModule: 2639.07,
    ServerSideRowModelApiModule: 2650.19,
    ServerSideRowModelModule: 3048.19,
    SetFilterModule: 2662.31,
    SideBarModule: 2585.68,
    SkeletonCellRendererModule: 2570.47,
    SparklinesModule: 2570.6,
    StatusBarModule: 2580.12,
    TreeDataModule: 2643.36,
    ViewportRowModelModule: 2983.81,
};

export interface ModuleTest {
    modules: ModuleName[];
    expectedSize: number;
}

const allCommunityModules: ModuleTest[] = Object.entries(AllCommunityModules).map(([m, s]) => ({
    modules: [m as ModuleName],
    expectedSize: s,
}));
const allEnterpriseModules: ModuleTest[] = Object.entries(AllEnterpriseModules).map(([m, s]) => ({
    modules: [m as ModuleName],
    expectedSize: s,
}));

const commonFeatureSets: ModuleTest[] = [
    { modules: ['ClientSideRowModelModule', 'SimpleFilterModule'], expectedSize: 155.94 },
];

export const moduleCombinations: ModuleTest[] = [
    { modules: [], expectedSize: 445.89 },
    ...commonFeatureSets,
    {
        modules: ['AgChartsCommunityModule' as any, 'IntegratedChartsModule'],
        expectedSize: 1172,
    },
    {
        modules: ['AgChartsEnterpriseModule' as any, 'IntegratedChartsModule'],
        expectedSize: 1840,
    },
    {
        modules: ['AgChartsCommunityModule' as any, 'SparklinesModule'],
        expectedSize: 786,
    },
    {
        modules: ['AgChartsEnterpriseModule' as any, 'SparklinesModule'],
        expectedSize: 1452,
    },
    ...allCommunityModules, //.slice(0, 3),
    ...allEnterpriseModules, //.slice(0, 3),
];
