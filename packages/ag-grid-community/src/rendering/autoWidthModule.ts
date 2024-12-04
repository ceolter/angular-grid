import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { AutoWidthCalculator } from './autoWidthCalculator';

/**
 * @internal
 */
export const AutoWidthModule: _ModuleWithoutApi = {
    moduleName: 'AutoWidth',
    version: VERSION,
    beans: [AutoWidthCalculator],
};
