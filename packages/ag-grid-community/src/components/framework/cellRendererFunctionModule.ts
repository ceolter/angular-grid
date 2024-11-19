import { baseCommunityModule } from '../../interfaces/iModule';
import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { AgComponentUtils } from './agComponentUtils';

/**
 * @internal
 */
export const CellRendererFunctionModule: _ModuleWithoutApi = {
    ...baseCommunityModule('CellRendererFunction'),
    beans: [AgComponentUtils],
};
