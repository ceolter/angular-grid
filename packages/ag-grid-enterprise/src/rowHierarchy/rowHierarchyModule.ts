import type { _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { ValueColsSvc } from '../aggregation/valueColsSvc';
import { PivotColsSvc } from '../pivot/pivotColsSvc';
import { RowGroupColsSvc } from '../rowGrouping/rowGroupColsSvc';
import { VERSION } from '../version';
import { AutoColService } from './autoColService';
import { ClientSideExpansionService } from './clientSideExpansionService';
import { FlattenStage } from './flattenStage';
import { GroupCellRenderer } from './rendering/groupCellRenderer';
import { GroupCellRendererCtrl } from './rendering/groupCellRendererCtrl';
import { ShowRowGroupColsService } from './showRowGroupColsService';
import { StickyRowService } from './stickyRowService';

/**
 * @internal
 */
export const GroupCellRendererModule: _ModuleWithoutApi = {
    moduleName: 'GroupCellRenderer',
    version: VERSION,
    userComponents: {
        agGroupRowRenderer: GroupCellRenderer,
        agGroupCellRenderer: GroupCellRenderer,
    },
    dynamicBeans: { groupCellRendererCtrl: GroupCellRendererCtrl },
    icons: {
        // shown on row group when contracted (click to expand)
        groupContracted: 'tree-closed',
        // shown on row group when expanded (click to contract)
        groupExpanded: 'tree-open',
    },
    dependsOn: [EnterpriseCoreModule],
};

/**
 * Shared between row grouping and tree data
 * @internal
 */
export const GroupColumnModule: _ModuleWithoutApi = {
    moduleName: 'GroupColumn',
    version: VERSION,
    beans: [AutoColService, ShowRowGroupColsService, RowGroupColsSvc, PivotColsSvc, ValueColsSvc],
    dependsOn: [EnterpriseCoreModule, GroupCellRendererModule],
};

/**
 * @internal
 */
export const ClientSideRowModelHierarchyModule: _ModuleWithoutApi = {
    moduleName: 'ClientSideRowModelHierarchy',
    version: VERSION,
    rowModels: ['clientSide'],
    beans: [FlattenStage, ClientSideExpansionService],
    dependsOn: [EnterpriseCoreModule],
};

/**
 * @internal
 */
export const StickyRowModule: _ModuleWithoutApi = {
    moduleName: 'StickyRow',
    version: VERSION,
    beans: [StickyRowService],
};
