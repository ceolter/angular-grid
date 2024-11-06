import type { _CommunityMenuGridApi } from '../../api/gridApi';
import { baseCommunityModule } from '../../interfaces/iModule';
import type { _ModuleWithApi } from '../../interfaces/iModule';
import { hidePopupMenu, showColumnMenu } from './menuApi';
import { MenuService } from './menuService';

/**
 * @internal
 */
export const SharedMenuModule: _ModuleWithApi<_CommunityMenuGridApi> = {
    ...baseCommunityModule('SharedMenuModule'),
    beans: [MenuService],
    apiFunctions: {
        showColumnMenu,
        hidePopupMenu,
    },
};
