import type { _StateGridApi } from '../../api/gridApi';
import { baseCommunityModule } from '../../interfaces/iModule';
import type { _ModuleWithApi } from '../../interfaces/iModule';
import { getState } from './stateApi';
import { StateService } from './stateService';

/**
 * @feature API -> Grid State
 * @gridOption initialState
 */
export const StateModule: _ModuleWithApi<_StateGridApi> = {
    ...baseCommunityModule('StateModule'),
    beans: [StateService],
    apiFunctions: {
        getState,
    },
};
