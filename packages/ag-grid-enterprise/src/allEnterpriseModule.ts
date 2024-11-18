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
import { PivotModule } from './pivot/pivotModule';
import { CellSelectionModule } from './rangeSelection/rangeSelectionModule';
import { RichSelectModule } from './richSelect/richSelectModule';
import { GroupFilterModule, RowGroupingModule, RowGroupingPanelModule } from './rowGrouping/rowGroupingModule';
import { ServerSideRowModelApiModule, ServerSideRowModelModule } from './serverSideRowModel/serverSideRowModelModule';
import { SetFilterModule } from './setFilter/setFilterModule';
import { SideBarModule } from './sideBar/sideBarModule';
import { StatusBarModule } from './statusBar/statusBarModule';
import { TreeDataModule } from './treeData/treeDataModule';
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
        RowGroupingPanelModule,
        GroupFilterModule,
        ServerSideRowModelModule,
        ServerSideRowModelApiModule,
        SetFilterModule,
        MultiFilterModule,
        AdvancedFilterModule,
        SideBarModule,
        StatusBarModule,
        ViewportRowModelModule,
        PivotModule,
        TreeDataModule,
    ],
};
