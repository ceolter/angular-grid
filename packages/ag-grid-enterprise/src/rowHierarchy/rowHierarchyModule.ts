import type { _ModuleWithoutApi } from 'ag-grid-community';

import { baseEnterpriseModule } from '../moduleUtils';
import { PivotColsSvc } from '../pivot/pivotColsSvc';
import { ValueColsSvc } from '../pivot/valueColsSvc';
import { RowGroupColsSvc } from '../rowGrouping/rowGroupColsSvc';
import { AutoColService } from './autoColService';
import { ClientSideExpansionService } from './clientSideExpansionService';
import { FlattenStage } from './flattenStage';
import { GroupCellRenderer } from './rendering/groupCellRenderer';
import { GroupCellRendererCtrl } from './rendering/groupCellRendererCtrl';
import { ShowRowGroupColsService } from './showRowGroupColsService';

export const GroupCellRendererModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('GroupCellRendererModule'),
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
};

/** Shared between row grouping and tree data */
export const GroupColumnModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('GroupColumnModule'),
    beans: [AutoColService, ShowRowGroupColsService, RowGroupColsSvc, PivotColsSvc, ValueColsSvc],
    dependsOn: [GroupCellRendererModule],
};

export const ClientSideRowModelHierarchyModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ClientSideRowModelHierarchyModule'),
    rowModels: ['clientSide'],
    beans: [FlattenStage, ClientSideExpansionService],
};
