import type { _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { AggregationModule, SharedAggregationModule } from '../aggregation/aggregationModule';
import {
    ClientSideRowModelHierarchyModule,
    GroupColumnModule,
    StickyRowModule,
} from '../rowHierarchy/rowHierarchyModule';
import { VERSION } from '../version';
import { ClientSideChildrenTreeNodeManager } from './clientSideChildrenTreeNodeManager';
import { ClientSidePathTreeNodeManager } from './clientSidePathTreeNodeManager';

/**
 * @internal
 */
export const SharedTreeDataModule: _ModuleWithoutApi = {
    moduleName: 'SharedTreeData',
    version: VERSION,
    dependsOn: [EnterpriseCoreModule, SharedAggregationModule, GroupColumnModule, StickyRowModule],
};

/**
 * @feature Tree Data
 * @gridOption treeData
 */
export const TreeDataModule: _ModuleWithoutApi = {
    moduleName: 'TreeData',
    version: VERSION,
    beans: [ClientSidePathTreeNodeManager, ClientSideChildrenTreeNodeManager],
    rowModels: ['clientSide'],
    dependsOn: [SharedTreeDataModule, AggregationModule, ClientSideRowModelHierarchyModule],
};
