import type { _ModuleWithApi, _SideBarGridApi } from 'ag-grid-community';
import { _HorizontalResizeModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { VERSION } from '../version';
import {
    closeToolPanel,
    getOpenedToolPanel,
    getSideBar,
    getToolPanelInstance,
    isSideBarVisible,
    isToolPanelShowing,
    openToolPanel,
    refreshToolPanel,
    setSideBarPosition,
    setSideBarVisible,
} from './sideBarApi';
import { SideBarService } from './sideBarService';

/**
 * @feature Accessories -> Side Bar
 * @gridOption sideBar
 */
export const SideBarModule: _ModuleWithApi<_SideBarGridApi<any>> = {
    moduleName: 'SideBar',
    version: VERSION,
    beans: [SideBarService],
    apiFunctions: {
        isSideBarVisible,
        setSideBarVisible,
        setSideBarPosition,
        openToolPanel,
        closeToolPanel,
        getOpenedToolPanel,
        refreshToolPanel,
        isToolPanelShowing,
        getToolPanelInstance,
        getSideBar,
    },
    dependsOn: [EnterpriseCoreModule, _HorizontalResizeModule],
};
