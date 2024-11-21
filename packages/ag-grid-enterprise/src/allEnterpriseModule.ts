import type { IntegratedModule } from 'ag-charts-types';

import type { _ModuleWithoutApi } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

import { AdvancedFilterModule } from './advancedFilter/advancedFilterModule';
import { IntegratedChartsModule } from './charts/integratedChartsModule';
import { ClipboardModule } from './clipboard/clipboardModule';
import { ColumnsToolPanelModule } from './columnToolPanel/columnsToolPanelModule';
import { ExcelExportModule } from './excelExport/excelExportModule';
import { FiltersToolPanelModule } from './filterToolPanel/filtersToolPanelModule';
import { MasterDetailModule } from './masterDetail/masterDetailModule';
import { ColumnMenuModule, ContextMenuModule } from './menu/menuModule';
import { baseEnterpriseModule } from './moduleUtils';
import { MultiFilterModule } from './multiFilter/multiFilterModule';
import { PivotModule } from './pivot/pivotModule';
import { CellSelectionModule } from './rangeSelection/rangeSelectionModule';
import { RichSelectModule } from './richSelect/richSelectModule';
import { GroupFilterModule, RowGroupingModule, RowGroupingPanelModule } from './rowGrouping/rowGroupingModule';
import { ServerSideRowModelApiModule, ServerSideRowModelModule } from './serverSideRowModel/serverSideRowModelModule';
import { SetFilterModule } from './setFilter/setFilterModule';
import { SideBarModule } from './sideBar/sideBarModule';
import { SparklinesModule } from './sparkline/sparklinesModule';
import { StatusBarModule } from './statusBar/statusBarModule';
import { TreeDataModule } from './treeData/treeDataModule';
import { ViewportRowModelModule } from './viewportRowModel/viewportRowModelModule';

type AllEnterpriseModuleType = { with: (params: IntegratedModule) => _ModuleWithoutApi } & _ModuleWithoutApi;

const baseAllEnterpriseModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('AllEnterprise'),
    dependsOn: [
        AllCommunityModule,
        ClipboardModule,
        ColumnsToolPanelModule,
        ExcelExportModule,
        FiltersToolPanelModule,
        MasterDetailModule,
        ColumnMenuModule,
        ContextMenuModule,
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

/**
 * @feature All Enterprise and Community features
 */
export const AllEnterpriseModule: AllEnterpriseModuleType = {
    with: (params) => ({
        ...baseAllEnterpriseModule,
        dependsOn: [
            ...baseAllEnterpriseModule.dependsOn!,
            IntegratedChartsModule.with(params),
            SparklinesModule.with(params),
        ],
    }),
    ...baseAllEnterpriseModule,
};
