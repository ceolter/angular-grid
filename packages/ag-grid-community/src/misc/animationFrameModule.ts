import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { AnimationFrameService } from './animationFrameService';

/**
 * @feature Rendering
 * @gridOption suppressAnimationFrame
 */
export const AnimationFrameModule: _ModuleWithoutApi = {
    ...baseCommunityModule('AnimationFrame'),
    beans: [AnimationFrameService],
};
