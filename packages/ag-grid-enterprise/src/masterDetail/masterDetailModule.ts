import type { _MasterDetailGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import {
    ClientSideRowModelHierarchyModule,
    GroupCellRendererModule,
    StickyRowModule,
} from '../rowHierarchy/rowHierarchyModule';
import { DetailCellRenderer } from './detailCellRenderer';
import { DetailCellRendererCtrl } from './detailCellRendererCtrl';
import { addDetailGridInfo, forEachDetailGridInfo, getDetailGridInfo, removeDetailGridInfo } from './masterDetailApi';
import { masterDetailModuleCSS } from './masterDetailModule.css-GENERATED';
import { MasterDetailService } from './masterDetailService';

/**
 * @internal
 */
export const SharedMasterDetailModule: _ModuleWithApi<_MasterDetailGridApi> = {
    ...baseEnterpriseModule('SharedMasterDetail'),
    beans: [MasterDetailService],
    userComponents: { agDetailCellRenderer: DetailCellRenderer },
    dynamicBeans: { detailCellRendererCtrl: DetailCellRendererCtrl },
    apiFunctions: {
        addDetailGridInfo,
        removeDetailGridInfo,
        getDetailGridInfo,
        forEachDetailGridInfo,
    },
    dependsOn: [EnterpriseCoreModule, GroupCellRendererModule, StickyRowModule],
    css: [masterDetailModuleCSS],
};

/**
 * @feature Master Detail
 * @gridOption masterDetail
 */
export const MasterDetailModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MasterDetail'),
    dependsOn: [SharedMasterDetailModule, ClientSideRowModelHierarchyModule],
};
