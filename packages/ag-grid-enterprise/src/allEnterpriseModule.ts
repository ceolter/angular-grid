import type { _ModuleWithoutApi } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

import { AdvancedFilterModule } from './advancedFilter/advancedFilterModule';
import { ClipboardModule } from './clipboard/clipboardModule';
import { ColumnsToolPanelModule } from './columnToolPanel/columnsToolPanelModule';
import { ExcelExportModule } from './excelExport/excelExportModule';
import { FiltersToolPanelModule } from './filterToolPanel/filtersToolPanelModule';
import { MasterDetailModule } from './masterDetail/masterDetailModule';
import { MenuModule } from './menu/menuModule';
import { baseEnterpriseModule } from './moduleUtils';
import { MultiFilterModule } from './multiFilter/multiFilterModule';
import { CellSelectionModule } from './rangeSelection/rangeSelectionModule';
import { RichSelectModule } from './richSelect/richSelectModule';
import { RowGroupingModule } from './rowGrouping/rowGroupingBundleModule';
import { ServerSideRowModelModule } from './serverSideRowModel/serverSideRowModelModule';
import { SetFilterModule } from './setFilter/setFilterModule';
import { SideBarModule } from './sideBar/sideBarModule';
import { StatusBarModule } from './statusBar/statusBarModule';
import { ViewportRowModelModule } from './viewportRowModel/viewportRowModelModule';

export const AllEnterpriseModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('AllEnterpriseModule'),
    dependsOn: [
        AllCommunityModule,
        ClipboardModule,
        ColumnsToolPanelModule,
        ExcelExportModule,
        FiltersToolPanelModule,
        MasterDetailModule,
        MenuModule,
        CellSelectionModule,
        RichSelectModule,
        RowGroupingModule,
        ServerSideRowModelModule,
        SetFilterModule,
        MultiFilterModule,
        AdvancedFilterModule,
        SideBarModule,
        StatusBarModule,
        ViewportRowModelModule,
    ],
};
