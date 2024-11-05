import type { _EventGridApi } from '../../api/gridApi';
import type { _ModuleWithApi } from '../../interfaces/iModule';
import { baseCommunityModule } from '../../interfaces/iModule';
import { ApiEventService } from './apiEventService';
import { addEventListener, addGlobalListener, removeEventListener, removeGlobalListener } from './eventApi';

/**
 * @feature API -> Grid Events
 */
export const EventApiModule: _ModuleWithApi<_EventGridApi<any>> = {
    ...baseCommunityModule('EventApiModule'),
    apiFunctions: {
        addEventListener,
        addGlobalListener,
        removeEventListener,
        removeGlobalListener,
    },
    beans: [ApiEventService],
};
