import { baseCommunityModule } from '../../interfaces/iModule';
import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { AgComponentUtils } from './agComponentUtils';

/**
 * @feature Cells => Cell Content
 * @colDef cellRenderer
 */
export const CellRendererFunctionModule: _ModuleWithoutApi = {
    ...baseCommunityModule('CellRendererFunctionModule'),
    beans: [AgComponentUtils],
};
