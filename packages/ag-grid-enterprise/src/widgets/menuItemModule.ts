import type { _ModuleWithoutApi } from 'ag-grid-community';

import { VERSION } from '../version';
import { AgMenuItemRenderer } from './agMenuItemRenderer';
import { menuCSS } from './menu.css-GENERATED';

/**
 * @internal
 */
export const MenuItemModule: _ModuleWithoutApi = {
    moduleName: 'MenuItem',
    version: VERSION,
    userComponents: {
        agMenuItem: AgMenuItemRenderer,
    },
    icons: {
        // indicates the currently active pin state in the "Pin column" sub-menu of the column menu
        check: 'tick',
        // icon for sub menu item
        subMenuOpen: 'small-right',
        // version of subMenuOpen used in RTL mode
        subMenuOpenRtl: 'small-left',
    },
    css: [menuCSS],
};
