import {
    CommunityModuleName,
    EnterpriseModuleName,
    ModuleName,
} from '../../packages/ag-grid-community/src/interfaces/iModule';

export const AllCommunityModules: Record<CommunityModuleName, number> = {
    AlignedGridsModule: 3.06,
    AllCommunityModule: 399.71,
    CellApiModule: 0.28,
    CellStyleModule: 2.24,
    CheckboxEditorModule: 18.81,
    ClientSideRowModelApiModule: 1.88,
    ClientSideRowModelModule: 29.1,
    ColumnApiModule: 3.6,
    ColumnAutoSizeModule: 6.34,
    ColumnHoverModule: 1.58,
    CsvExportModule: 11.3,
    CustomEditorModule: 17.36,
    CustomFilterModule: 54.48,
    DateEditorModule: 22.02,
    DateFilterModule: 113.8,
    DragAndDropModule: 1.47,
    EventApiModule: 2.64,
    ExternalFilterModule: 13.69,
    GridStateModule: 13.24,
    HighlightChangesModule: 3.92,
    InfiniteRowModelModule: 18.08,
    LargeTextEditorModule: 18.6,
    LocaleModule: 0.43,
    NumberEditorModule: 22.82,
    NumberFilterModule: 112.05,
    PaginationModule: 42.74,
    PinnedRowModule: 9.35,
    QuickFilterModule: 17.3,
    RenderApiModule: 1.48,
    RowApiModule: 0.88,
    RowAutoHeightModule: 1.84,
    RowDragModule: 13.29,
    RowSelectionModule: 29.91,
    RowStyleModule: 1.24,
    ScrollApiModule: 0.7,
    SelectEditorModule: 31.89,
    TextEditorModule: 19.95,
    TextFilterModule: 107.66,
    TooltipModule: 22.24,
    UndoRedoEditModule: 23.5,
    ValidationModule: 69.56,
    ValueCacheModule: 0.65,
};
export const AllEnterpriseModules: Record<EnterpriseModuleName, number> = {
    AdvancedFilterModule: 231.28,
    AllEnterpriseModule: 1096.36,
    CellSelectionModule: 79.37,
    ClipboardModule: 73.72,
    ColumnMenuModule: 177.62,
    ColumnsToolPanelModule: 174.86,
    ContextMenuModule: 97.08,
    ExcelExportModule: 111.327,
    FiltersToolPanelModule: 145.16,
    GridChartsModule: 106.67,
    IntegratedChartsModule: 385.33,
    GroupFilterModule: 164.38,
    MasterDetailModule: 107.84,
    MenuModule: 184.12,
    MultiFilterModule: 147.76,
    PivotModule: 120.06,
    RangeSelectionModule: 79.42,
    RichSelectModule: 102.86,
    RowGroupingModule: 107.07,
    RowGroupingPanelModule: 141.97,
    ServerSideRowModelApiModule: 46.22,
    ServerSideRowModelModule: 176.29,
    SetFilterModule: 168.2,
    SideBarModule: 59.57,
    SparklinesModule: 45.31,
    StatusBarModule: 54.49,
    TreeDataModule: 116.33,
    ViewportRowModelModule: 53.7,
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
    { modules: ['ClientSideRowModelModule', 'TextFilterModule'], expectedSize: 133.67 },
    {
        modules: [
            'TextFilterModule',
            'NumberFilterModule',
            'DateFilterModule',
            'SetFilterModule',
            'MultiFilterModule',
            'CustomFilterModule',
            'ExternalFilterModule',
            'QuickFilterModule',
        ],
        expectedSize: 258.92, //258.92
    },
];

const chartModules: ModuleTest[] = [
    {
        modules: ['AgChartsCommunityModule' as any, 'IntegratedChartsModule'],
        expectedSize: 1159.67,
    },
    {
        modules: ['AgChartsEnterpriseModule' as any, 'IntegratedChartsModule'],
        expectedSize: 1840,
    },
    {
        modules: ['AgChartsCommunityModule' as any, 'SparklinesModule'],
        expectedSize: 820,
    },
    {
        modules: ['AgChartsEnterpriseModule' as any, 'SparklinesModule'],
        expectedSize: 1452,
    },
];

export const moduleCombinations: ModuleTest[] = [
    { modules: [], expectedSize: 445.89 },
    ...commonFeatureSets,
    ...chartModules,
    ...allCommunityModules, //.slice(0, 3),
    ...allEnterpriseModules, //.slice(0, 3),
];
