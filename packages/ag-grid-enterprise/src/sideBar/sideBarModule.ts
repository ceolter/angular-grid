import type { _ModuleWithApi, _ModuleWithoutApi, _SideBarGridApi } from 'ag-grid-community';
import { HorizontalResizeModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { ToolPanelColDefService } from './common/toolPanelColDefService';
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
export const SideBarCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SideBarCoreModule'),
    beans: [SideBarService],
    dependsOn: [EnterpriseCoreModule, HorizontalResizeModule],
};

/**
 * @feature Accessories -> Side Bar
 */
export const SideBarApiModule: _ModuleWithApi<_SideBarGridApi<any>> = {
    ...baseEnterpriseModule('SideBarApiModule'),
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
    dependsOn: [SideBarCoreModule],
};

/**
 * @internal
 */
export const SideBarSharedModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SideBarSharedModule'),
    beans: [ToolPanelColDefService],
};

/**
 * @feature Accessories -> Side Bar
 */
export const SideBarModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SideBarModule'),
    dependsOn: [SideBarCoreModule, SideBarApiModule],
};
