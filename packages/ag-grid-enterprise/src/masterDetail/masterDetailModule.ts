import type { _MasterDetailGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { ClientSideRowModelHierarchyModule, GroupCellRendererModule } from '../rowHierarchy/rowHierarchyModule';
import { DetailCellRenderer } from './detailCellRenderer';
import { DetailCellRendererCtrl } from './detailCellRendererCtrl';
import { DetailGridApiService } from './detailGridApiService';
import { addDetailGridInfo, forEachDetailGridInfo, getDetailGridInfo, removeDetailGridInfo } from './masterDetailApi';
import { MasterDetailService } from './masterDetailService';

export const MasterDetailCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MasterDetailCoreModule'),
    beans: [MasterDetailService],
    userComponents: { agDetailCellRenderer: DetailCellRenderer },
    dynamicBeans: { detailCellRendererCtrl: DetailCellRendererCtrl },
    dependsOn: [EnterpriseCoreModule, GroupCellRendererModule],
};

export const MasterDetailApiModule: _ModuleWithApi<_MasterDetailGridApi> = {
    ...baseEnterpriseModule('MasterDetailApiModule'),
    beans: [DetailGridApiService],
    apiFunctions: {
        addDetailGridInfo,
        removeDetailGridInfo,
        getDetailGridInfo,
        forEachDetailGridInfo,
    },
    dependsOn: [MasterDetailCoreModule],
};

export const MasterDetailModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MasterDetailModule'),
    dependsOn: [MasterDetailCoreModule, MasterDetailApiModule, ClientSideRowModelHierarchyModule],
};
