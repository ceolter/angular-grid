import type { _ModuleWithoutApi } from 'ag-grid-community';

import { baseEnterpriseModule } from '../moduleUtils';
import { PivotColsSvc } from '../pivot/pivotColsSvc';
import { ValueColsSvc } from '../pivot/valueColsSvc';
import { RowGroupColsSvc } from '../rowGrouping/rowGroupColsSvc';
import { AutoColService } from './autoColService';
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
};

/** Shared between row grouping and tree data */
export const GroupColumnModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('GroupColumnModule'),
    beans: [AutoColService, ShowRowGroupColsService, RowGroupColsSvc, PivotColsSvc, ValueColsSvc],
    dependsOn: [GroupCellRendererModule],
};
