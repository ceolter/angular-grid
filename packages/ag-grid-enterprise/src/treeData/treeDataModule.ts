import type { _ModuleWithoutApi } from 'ag-grid-community';
import { StickyRowModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { AggregationModule } from '../aggregation/aggregationModule';
import { ClientSideRowModelExpansionModule } from '../expansion/expansionModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { ClientSideRowModelHierarchyModule, GroupColumnModule } from '../rowHierarchy/rowHierarchyModule';
import { ClientSideChildrenTreeNodeManager } from './clientSideChildrenTreeNodeManager';
import { ClientSidePathTreeNodeManager } from './clientSidePathTreeNodeManager';

export const TreeDataCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('TreeDataCoreModule'),
    dependsOn: [EnterpriseCoreModule, AggregationModule, GroupColumnModule],
};

export const TreeDataModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('TreeDataModule'),
    beans: [ClientSidePathTreeNodeManager, ClientSideChildrenTreeNodeManager],
    rowModels: ['clientSide', 'serverSide'],
    dependsOn: [
        TreeDataCoreModule,
        StickyRowModule,
        ClientSideRowModelExpansionModule,
        ClientSideRowModelHierarchyModule,
    ],
};
