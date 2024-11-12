import type { _ColumnChooserGridApi, _ContextMenuGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';
import { ColumnMoveCoreModule, DragAndDropModule, PopupModule, SharedMenuModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
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

/**
 * @internal
 */
export const MenuCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MenuCoreModule'),
    beans: [MenuItemMapper, ChartMenuItemMapper, MenuUtils],
    icons: {
        // context menu chart item
        chart: 'chart',
        // columns in menu (column chooser / columns tab)
        columns: 'columns',
        // loading async menu items
        loadingMenuItems: 'loading',
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

/**
 * @feature Accessories -> Column Menu
 */
export const ColumnMenuModule: _ModuleWithApi<_ColumnChooserGridApi> = {
    ...baseEnterpriseModule('ColumnMenuModule'),
    beans: [EnterpriseMenuFactory, ColumnMenuFactory, ColumnChooserFactory],
    icons: {
        // menu tab icon in legacy tabbed enterprise column menu
        legacyMenu: 'menu',
        // filter tab icon in legacy tabbed enterprise column menu
        filterTab: 'filter',
        ...COLUMN_SELECT_ICONS,
    },
    apiFunctions: {
        showColumnChooser,
        hideColumnChooser,
    },
    dependsOn: [MenuCoreModule, DragAndDropModule, ColumnMoveCoreModule],
};

/**
 * @feature Accessories -> Context Menu
 */
export const ContextMenuModule: _ModuleWithApi<_ContextMenuGridApi> = {
    ...baseEnterpriseModule('ContextMenuModule'),
    beans: [ContextMenuService],
    apiFunctions: {
        showContextMenu,
    },
    dependsOn: [MenuCoreModule],
};

/**
 * @feature Accessories -> Column Menu / Context Menu
 */
export const MenuModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MenuModule'),
    dependsOn: [ColumnMenuModule, ContextMenuModule],
};
