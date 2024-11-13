import type { _MasterDetailGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { ClientSideRowModelHierarchyModule, GroupCellRendererModule } from '../rowHierarchy/rowHierarchyModule';
import { DetailCellRenderer } from './detailCellRenderer';
import { DetailCellRendererCtrl } from './detailCellRendererCtrl';
import { addDetailGridInfo, forEachDetailGridInfo, getDetailGridInfo, removeDetailGridInfo } from './masterDetailApi';
import { MasterDetailService } from './masterDetailService';

/**
 * @feature Master Detail
 * @gridOption masterDetail
 */
export const MasterDetailCoreModule: _ModuleWithApi<_MasterDetailGridApi> = {
    ...baseEnterpriseModule('MasterDetailCoreModule'),
    beans: [MasterDetailService],
    userComponents: { agDetailCellRenderer: DetailCellRenderer },
    dynamicBeans: { detailCellRendererCtrl: DetailCellRendererCtrl },
    apiFunctions: {
        addDetailGridInfo,
        removeDetailGridInfo,
        getDetailGridInfo,
        forEachDetailGridInfo,
    },
    dependsOn: [EnterpriseCoreModule, GroupCellRendererModule],
};

/**
 * @feature Master Detail
 */
export const MasterDetailModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MasterDetailModule'),
    dependsOn: [MasterDetailCoreModule, ClientSideRowModelHierarchyModule],
};
