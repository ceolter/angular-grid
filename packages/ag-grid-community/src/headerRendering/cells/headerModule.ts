import { baseCommunityModule } from '../../interfaces/iModule';
import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { HeaderComp } from './column/headerComp';
import { HeaderGroupComp } from './columnGroup/headerGroupComp';

/**
 * @feature Columns -> Column Header
 * @colDef headerComponent
 */
export const ColumnHeaderCompModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ColumnHeaderComp'),
    userComponents: {
        agColumnHeader: HeaderComp,
    },
    icons: {
        // button to launch legacy column menu
        menu: 'menu',
        // button to launch new enterprise column menu
        menuAlt: 'menu-alt',
    },
};

/**
 * @feature Columns -> Column Groups
 * @colGroupDef headerGroupComponent
 */
export const ColumnGroupHeaderCompModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ColumnGroupHeaderComp'),
    userComponents: {
        agColumnGroupHeader: HeaderGroupComp,
    },
    icons: {
        // header column group shown when expanded (click to contract)
        columnGroupOpened: 'expanded',
        // header column group shown when contracted (click to expand)
        columnGroupClosed: 'contracted',
    },
};
