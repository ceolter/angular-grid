import type { _MasterDetailGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { ClientSideRowModelExpansionModule } from '../expansion/expansionModule';
import { GroupCellRendererModule } from '../groupColumn/groupColumnModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { DetailCellRenderer } from './detailCellRenderer';
import { DetailCellRendererCtrl } from './detailCellRendererCtrl';
import { DetailGridApiService } from './detailGridApiService';
import { addDetailGridInfo, forEachDetailGridInfo, getDetailGridInfo, removeDetailGridInfo } from './masterDetailApi';
import { MasterDetailService } from './masterDetailService';

/**
 * @feature Master Detail
 * @gridOption masterDetail
 */
export const MasterDetailCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MasterDetailCoreModule'),
    beans: [MasterDetailService],
    userComponents: { agDetailCellRenderer: DetailCellRenderer },
    dynamicBeans: { detailCellRendererCtrl: DetailCellRendererCtrl },
    dependsOn: [EnterpriseCoreModule, GroupCellRendererModule],
};

/**
 * @feature Master Detail
 */
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

/**
 * @feature Master Detail
 */
export const MasterDetailModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MasterDetailModule'),
    dependsOn: [MasterDetailCoreModule, MasterDetailApiModule, ClientSideRowModelExpansionModule],
};
