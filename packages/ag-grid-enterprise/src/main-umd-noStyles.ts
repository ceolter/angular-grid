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
    ClipboardModule,
    ColumnsToolPanelModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    MasterDetailModule,
    MenuModule,
    MultiFilterModule,
    RangeSelectionModule,
    RichSelectModule,
    RowGroupingModule,
    ServerSideRowModelModule,
    SetFilterModule,
    SideBarModule,
    StatusBarModule,
    ViewportRowModelModule,
} from './main';

ModuleRegistry.registerModules([
    CommunityFeaturesModule,
    ClientSideRowModelModule,
    InfiniteRowModelModule,
    CsvExportModule,
    AdvancedFilterModule,
    ClipboardModule,
    ColumnsToolPanelModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    MasterDetailModule,
    MenuModule,
    MultiFilterModule,
    RangeSelectionModule,
    RichSelectModule,
    RowGroupingModule,
    ServerSideRowModelModule,
    SetFilterModule,
    SideBarModule,
    StatusBarModule,
    ViewportRowModelModule,
]);

export * from 'ag-grid-community';
export * from './main';
// Export the overridden createGrid function which automatically registers AG Charts modules if present
export { createGrid } from './main-umd-shared';
