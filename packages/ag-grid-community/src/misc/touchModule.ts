import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { baseCommunityModule } from '../interfaces/iModule';
import { TouchService } from './touchService';

export const TouchModule: _ModuleWithoutApi = {
    ...baseCommunityModule('TouchModule'),
    beans: [TouchService],
};
