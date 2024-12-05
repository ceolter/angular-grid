import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { AnimationFrameService } from './animationFrameService';

/**
 * @feature Rendering
 * @gridOption suppressAnimationFrame
 */
export const AnimationFrameModule: _ModuleWithoutApi = {
    moduleName: 'AnimationFrame',
    version: VERSION,
    beans: [AnimationFrameService],
};
