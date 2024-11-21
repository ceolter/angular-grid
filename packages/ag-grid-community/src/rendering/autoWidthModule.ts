import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { AutoWidthCalculator } from './autoWidthCalculator';

/**
 * @internal
 */
export const AutoWidthModule: _ModuleWithoutApi = {
    ...baseCommunityModule('AutoWidth'),
    beans: [AutoWidthCalculator],
};
