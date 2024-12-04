import type { _ColumnChooserGridApi, _ContextMenuGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';
import { _ColumnMoveModule, _PopupModule, _SharedDragAndDropModule, _SharedMenuModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { VERSION } from '../version';
import { MenuItemModule } from '../widgets/menuItemModule';
import { ChartMenuItemMapper } from './chartMenuItemMapper';
import { ColumnChooserFactory } from './columnChooserFactory';
import { ColumnMenuFactory } from './columnMenuFactory';
import { ContextMenuService } from './contextMenu';
import { EnterpriseMenuFactory } from './enterpriseMenu';
import { hideColumnChooser, showColumnChooser, showContextMenu } from './menuApi';
import { MenuItemMapper } from './menuItemMapper';
import { MenuUtils } from './menuUtils';

/**
 * @internal
 */
export const MenuCoreModule: _ModuleWithoutApi = {
    moduleName: 'MenuCore',
    version: VERSION,
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
        // show on column header when column has no sort, only when enabled with colDef.unSortIcon=true
        sortUnSort: 'none',
    },
    dependsOn: [EnterpriseCoreModule, _PopupModule, _SharedMenuModule, MenuItemModule],
};

/**
 * @feature Accessories -> Column Menu
 */
export const ColumnMenuModule: _ModuleWithApi<_ColumnChooserGridApi> = {
    moduleName: 'ColumnMenu',
    version: VERSION,
    beans: [EnterpriseMenuFactory, ColumnMenuFactory, ColumnChooserFactory],
    icons: {
        // menu tab icon in legacy tabbed enterprise column menu
        legacyMenu: 'menu',
        // filter tab icon in legacy tabbed enterprise column menu
        filterTab: 'filter',
        // column tool panel column group contracted (click to expand)
        columnSelectClosed: 'tree-closed',
        // column tool panel column group expanded (click to contract)
        columnSelectOpen: 'tree-open',
        // column tool panel header expand/collapse all button, shown when some children are expanded and
        //     others are collapsed
        columnSelectIndeterminate: 'tree-indeterminate',
    },
    apiFunctions: {
        showColumnChooser,
        hideColumnChooser,
    },
    dependsOn: [MenuCoreModule, _SharedDragAndDropModule, _ColumnMoveModule],
};

/**
 * @feature Accessories -> Context Menu
 */
export const ContextMenuModule: _ModuleWithApi<_ContextMenuGridApi> = {
    moduleName: 'ContextMenu',
    version: VERSION,
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
    moduleName: 'Menu',
    version: VERSION,
    dependsOn: [ColumnMenuModule, ContextMenuModule],
};
