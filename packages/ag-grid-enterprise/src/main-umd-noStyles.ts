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

import { GridChartsModule } from './charts/main';
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
    SparklinesModule,
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
    GridChartsModule,
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
    SparklinesModule,
    StatusBarModule,
    TreeDataModule,
    ViewportRowModelModule,
]);

export * from 'ag-grid-community';
export * from './main';
