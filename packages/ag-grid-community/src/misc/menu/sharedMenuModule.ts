import type { _CommunityMenuGridApi } from '../../api/gridApi';
import type { _ModuleWithApi } from '../../interfaces/iModule';
import { VERSION } from '../../version';
import { hidePopupMenu, showColumnMenu } from './menuApi';
import { MenuService } from './menuService';

/**
 * @internal
 */
export const SharedMenuModule: _ModuleWithApi<_CommunityMenuGridApi> = {
    moduleName: 'SharedMenu',
    version: VERSION,
    beans: [MenuService],
    apiFunctions: {
        showColumnMenu,
        hidePopupMenu,
    },
};
