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
    icons: {
        // context menu chart item
        chart: 'chart',
        // columns in menu (column chooser / columns tab)
        columns: 'columns',
        // "Pin column" item in column header menu
        menuPin: 'pin',
        // "Value aggregation" column menu item (shown on numeric columns when grouping is active)"
        menuValue: 'aggregation',
        // "Group by {column-name}" item in column header menu
        menuAddRowGroup: 'group',
        // "Un-Group by {column-name}" item in column header menu
        menuRemoveRowGroup: 'group',
        // context menu copy item
        clipboardCopy: 'copy',
        // context menu cut item
        clipboardCut: 'cut',
        // context menu paste item
        clipboardPaste: 'paste',
        // context menu export item
        save: 'save',
        // csv export
        csvExport: 'csv',
        // excel export,
        excelExport: 'excel',
        // show on column header when column is sorted ascending
        sortAscending: 'asc',
        // show on column header when column is sorted descending
        sortDescending: 'desc',
        // show on column header when column has no sort, only when enabled with gridOptions.unSortIcon=true
        sortUnSort: 'none',
    },
    dependsOn: [EnterpriseCoreModule, PopupModule, SharedMenuModule, MenuItemModule],
    css: [menuCSS],
};

const COLUMN_SELECT_ICONS = {
    // column tool panel column group contracted (click to expand)
    columnSelectClosed: 'tree-closed',
    // column tool panel column group expanded (click to contract)
    columnSelectOpen: 'tree-open',
    // column tool panel header expand/collapse all button, shown when some children are expanded and
    //     others are collapsed
    columnSelectIndeterminate: 'tree-indeterminate',
} as const;

export const ColumnMenuModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ColumnMenuModule'),
    beans: [EnterpriseMenuFactory, ColumnMenuFactory],
    icons: {
        // menu tab icon in legacy tabbed enterprise column menu
        legacyMenu: 'menu',
        // filter tab icon in legacy tabbed enterprise column menu
        filterTab: 'filter',
        ...COLUMN_SELECT_ICONS,
    },
    dependsOn: [MenuCoreModule],
};

export const ColumnChooserModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ColumnChooserModule'),
    beans: [ColumnChooserFactory, ToolPanelColDefService],
    icons: COLUMN_SELECT_ICONS,
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
