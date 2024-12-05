import type { IntegratedModule } from 'ag-charts-types';

import type { ModuleName, _ModuleWithoutApi } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

import { AdvancedFilterModule } from './advancedFilter/advancedFilterModule';
import { IntegratedChartsModule } from './charts/integratedChartsModule';
import { ClipboardModule } from './clipboard/clipboardModule';
import { ColumnsToolPanelModule } from './columnToolPanel/columnsToolPanelModule';
import { ExcelExportModule } from './excelExport/excelExportModule';
import { FiltersToolPanelModule } from './filterToolPanel/filtersToolPanelModule';
import { MasterDetailModule } from './masterDetail/masterDetailModule';
import { ColumnMenuModule, ContextMenuModule } from './menu/menuModule';
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
import { VERSION } from './version';
import { ViewportRowModelModule } from './viewportRowModel/viewportRowModelModule';

type AllEnterpriseModuleType = { with: (params: IntegratedModule) => _ModuleWithoutApi } & _ModuleWithoutApi;

const dependsOn = [
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
];
const moduleName: ModuleName = 'AllEnterprise';

/**
 * @feature All Enterprise and Community features
 * Registers all the Grid features: Community and Enterprise.
 * If using Integrated Charts or Sparklines then the relevant AG Charts module must be provided.
 * @example
 * // All Enterprise features
 * import { ModuleRegistry } from 'ag-grid-community';
 * import { AllEnterpriseModule } from 'ag-grid-enterprise';
 *
 * ModuleRegistry.registerModules([ AllEnterpriseModule ]);
 * @example
 * // All Enterprise features including Integrated Charts and Sparklines
 * import { ModuleRegistry } from 'ag-grid-community';
 * import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
 * import { AllEnterpriseModule } from 'ag-grid-enterprise';
 *
 * ModuleRegistry.registerModules([ AllEnterpriseModule.with(AgChartsEnterpriseModule) ]);
 *
 */
export const AllEnterpriseModule: AllEnterpriseModuleType = {
    with: (params) => ({
        moduleName,
        version: VERSION,
        dependsOn: [...dependsOn, IntegratedChartsModule.with(params), SparklinesModule.with(params)],
    }),
    moduleName,
    version: VERSION,
    dependsOn: dependsOn,
};
