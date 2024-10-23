import type { _MenuGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';
import { CommunityMenuApiModule, PopupModule, SharedMenuModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { ToolPanelColDefService } from '../sideBar/common/toolPanelColDefService';
import { MenuItemModule } from '../widgets/menuItemModule';
import { ChartMenuItemMapper } from './chartMenuItemMapper';
import { ColumnChooserFactory } from './columnChooserFactory';
import { ColumnMenuFactory } from './columnMenuFactory';
import { ContextMenuService } from './contextMenu';
import { EnterpriseMenuFactory } from './enterpriseMenu';
import { menuCSS } from './menu.css-GENERATED';
import { hideColumnChooser, showColumnChooser, showContextMenu } from './menuApi';
import { MenuItemMapper } from './menuItemMapper';
import { MenuUtils } from './menuUtils';

export const MenuCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MenuCoreModule'),
    beans: [MenuItemMapper, ChartMenuItemMapper, MenuUtils],
    dependsOn: [EnterpriseCoreModule, PopupModule, SharedMenuModule, MenuItemModule],
    css: [menuCSS],
};

export const ColumnMenuModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ColumnMenuModule'),
    beans: [EnterpriseMenuFactory, ColumnMenuFactory],
    dependsOn: [MenuCoreModule],
};

export const ColumnChooserModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ColumnChooserModule'),
    beans: [ColumnChooserFactory, ToolPanelColDefService],
    dependsOn: [MenuCoreModule],
};

export const ContextMenuModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ContextMenuModule'),
    beans: [ContextMenuService],
    dependsOn: [MenuCoreModule],
};

export const MenuApiModule: _ModuleWithApi<_MenuGridApi> = {
    ...baseEnterpriseModule('MenuApiModule'),
    apiFunctions: {
        showContextMenu,
        showColumnChooser,
        hideColumnChooser,
    },
    dependsOn: [ColumnChooserModule, ContextMenuModule, CommunityMenuApiModule],
};

export const MenuModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MenuModule'),
    dependsOn: [ColumnMenuModule, ColumnChooserModule, ContextMenuModule, MenuApiModule],
};
