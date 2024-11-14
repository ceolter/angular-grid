/*
 * Used for umd bundles without styles
 */
import {
    ClientSideRowModelModule,
    CommunityFeaturesModule,
    CsvExportModule,
    InfiniteRowModelModule,
    ModuleRegistry,
} from 'ag-grid-community';

import {
    AdvancedFilterModule,
    CellSelectionModule,
    ClipboardModule,
    ColumnsToolPanelModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    GroupFilterModule,
    MasterDetailModule,
    MenuModule,
    MultiFilterModule,
    PivotModule,
    RichSelectModule,
    RowGroupingModule,
    RowGroupingPanelModule,
    ServerSideRowModelApiModule,
    ServerSideRowModelModule,
    SetFilterModule,
    SideBarModule,
    SkeletonCellRendererModule,
    StatusBarModule,
    TreeDataModule,
    ViewportRowModelModule,
} from './main';

ModuleRegistry.registerModules([
    CommunityFeaturesModule,
    ClientSideRowModelModule,
    InfiniteRowModelModule,
    CsvExportModule,
    AdvancedFilterModule,
    CellSelectionModule,
    ClipboardModule,
    ColumnsToolPanelModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    GroupFilterModule,
    MasterDetailModule,
    MenuModule,
    MultiFilterModule,
    PivotModule,
    RichSelectModule,
    RowGroupingModule,
    RowGroupingPanelModule,
    ServerSideRowModelModule,
    ServerSideRowModelApiModule,
    SetFilterModule,
    SideBarModule,
    SkeletonCellRendererModule,
    StatusBarModule,
    TreeDataModule,
    ViewportRowModelModule,
]);

export * from 'ag-grid-community';
export * from './main';
// Export the overridden createGrid function which automatically registers AG Charts modules if present
export { createGrid } from './main-umd-shared';
