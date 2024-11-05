import type { _CommunityMenuGridApi } from '../../api/gridApi';
import { baseCommunityModule } from '../../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../../interfaces/iModule';
import { hidePopupMenu, showColumnMenu } from './menuApi';
import { MenuService } from './menuService';

/**
 * @internal
 */
export const SharedMenuModule: _ModuleWithoutApi = {
    ...baseCommunityModule('SharedMenuModule'),
    beans: [MenuService],
};

/**
 * @internal
 */
export const CommunityMenuApiModule: _ModuleWithApi<_CommunityMenuGridApi> = {
    ...baseCommunityModule('CommunityMenuApiModule'),
    apiFunctions: {
        showColumnMenu,
        hidePopupMenu,
    },
};
