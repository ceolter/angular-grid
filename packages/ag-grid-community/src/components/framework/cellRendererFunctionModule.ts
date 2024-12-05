import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { VERSION } from '../../version';
import { AgComponentUtils } from './agComponentUtils';

/**
 * @internal
 */
export const CellRendererFunctionModule: _ModuleWithoutApi = {
    moduleName: 'CellRendererFunction',
    version: VERSION,
    beans: [AgComponentUtils],
};
