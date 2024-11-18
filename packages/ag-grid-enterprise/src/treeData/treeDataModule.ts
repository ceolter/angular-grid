import type { _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { AggregationModule, SharedAggregationModule } from '../aggregation/aggregationModule';
import { baseEnterpriseModule } from '../moduleUtils';
import {
    ClientSideRowModelHierarchyModule,
    GroupColumnModule,
    StickyRowModule,
} from '../rowHierarchy/rowHierarchyModule';
import { ClientSideChildrenTreeNodeManager } from './clientSideChildrenTreeNodeManager';
import { ClientSidePathTreeNodeManager } from './clientSidePathTreeNodeManager';

/**
 * @internal
 */
export const SharedTreeDataModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SharedTreeDataModule'),
    dependsOn: [EnterpriseCoreModule, SharedAggregationModule, GroupColumnModule, StickyRowModule],
};

/**
 * @feature Tree Data
 * @gridOption treeData
 */
export const TreeDataModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('TreeDataModule'),
    beans: [ClientSidePathTreeNodeManager, ClientSideChildrenTreeNodeManager],
    rowModels: ['clientSide'],
    dependsOn: [SharedTreeDataModule, AggregationModule, ClientSideRowModelHierarchyModule],
};
