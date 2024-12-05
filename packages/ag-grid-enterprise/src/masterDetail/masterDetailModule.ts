import type { _MasterDetailGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import {
    ClientSideRowModelHierarchyModule,
    GroupCellRendererModule,
    StickyRowModule,
} from '../rowHierarchy/rowHierarchyModule';
import { VERSION } from '../version';
import { DetailCellRenderer } from './detailCellRenderer';
import { DetailCellRendererCtrl } from './detailCellRendererCtrl';
import { addDetailGridInfo, forEachDetailGridInfo, getDetailGridInfo, removeDetailGridInfo } from './masterDetailApi';
import { masterDetailModuleCSS } from './masterDetailModule.css-GENERATED';
import { MasterDetailService } from './masterDetailService';

/**
 * @internal
 */
export const SharedMasterDetailModule: _ModuleWithApi<_MasterDetailGridApi> = {
    moduleName: 'SharedMasterDetail',
    version: VERSION,
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
    moduleName: 'MasterDetail',
    version: VERSION,
    dependsOn: [SharedMasterDetailModule, ClientSideRowModelHierarchyModule],
};
