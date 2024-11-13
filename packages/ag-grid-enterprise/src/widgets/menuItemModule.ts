import type { _ModuleWithoutApi } from 'ag-grid-community';

import { baseEnterpriseModule } from '../moduleUtils';
import { AgMenuItemRenderer } from './agMenuItemRenderer';

/**
 * @internal
 */
export const MenuItemModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MenuItemModule'),
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
};
