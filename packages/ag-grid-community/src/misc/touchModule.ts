import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { baseCommunityModule } from '../interfaces/iModule';
import { TouchService } from './touchService';

/**
 * @feature Interactivity -> Touch
 */
export const TouchModule: _ModuleWithoutApi = {
    ...baseCommunityModule('Touch'),
    beans: [TouchService],
};
