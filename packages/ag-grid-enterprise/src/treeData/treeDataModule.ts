import type { _ModuleWithoutApi } from 'ag-grid-community';
import { StickyRowModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { AggregationModule } from '../aggregation/aggregationModule';
import { ClientSideRowModelExpansionModule } from '../expansion/expansionModule';
import { GroupColumnModule } from '../groupColumn/groupColumnModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { ClientSideChildrenTreeNodeManager } from './clientSideChildrenTreeNodeManager';
import { ClientSidePathTreeNodeManager } from './clientSidePathTreeNodeManager';

/**
 * @feature Tree Data
 * @gridOption treeData
 */
export const TreeDataCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('TreeDataCoreModule'),
    dependsOn: [EnterpriseCoreModule, AggregationModule, GroupColumnModule],
};
/**
 * @feature Tree Data
 */
export const TreeDataModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('TreeDataModule'),
    beans: [ClientSidePathTreeNodeManager, ClientSideChildrenTreeNodeManager],
    rowModels: ['clientSide', 'serverSide'],
    dependsOn: [TreeDataCoreModule, StickyRowModule, ClientSideRowModelExpansionModule],
};
