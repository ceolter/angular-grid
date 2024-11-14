/*
 * Used for umd bundles with styles
 */
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-alpine-no-font.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';
import '@ag-grid-community/styles/ag-theme-balham-no-font.css';
import '@ag-grid-community/styles/ag-theme-balham.css';
import '@ag-grid-community/styles/ag-theme-material-no-font.css';
import '@ag-grid-community/styles/ag-theme-material.css';
import '@ag-grid-community/styles/ag-theme-quartz-no-font.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';
import '@ag-grid-community/styles/agGridAlpineFont.css';
import '@ag-grid-community/styles/agGridBalhamFont.css';
import '@ag-grid-community/styles/agGridClassicFont.css';
import '@ag-grid-community/styles/agGridMaterialFont.css';
import '@ag-grid-community/styles/agGridQuartzFont.css';

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
