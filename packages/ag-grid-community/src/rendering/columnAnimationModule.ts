import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { ColumnAnimationService } from './columnAnimationService';

/**
 * @feature Columns -> Column Animation
 * @gridOption suppressColumnMoveAnimation
 */
export const ColumnAnimationModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ColumnAnimationModule'),
    beans: [ColumnAnimationService],
};
