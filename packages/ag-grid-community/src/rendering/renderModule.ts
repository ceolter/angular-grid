import type { _RenderGridApi } from '../api/gridApi';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import {
    flushAllAnimationFrames,
    getCellRendererInstances,
    getSizesForCurrentTheme,
    isAnimationFrameQueueEmpty,
    refreshCells,
    refreshHeader,
    setGridAriaProperty,
} from './renderApi';

/**
 * @feature Rendering
 */
export const RenderApiModule: _ModuleWithApi<_RenderGridApi<any>> = {
    moduleName: 'RenderApi',
    version: VERSION,
    apiFunctions: {
        setGridAriaProperty,
        refreshCells,
        refreshHeader,
        isAnimationFrameQueueEmpty,
        flushAllAnimationFrames,
        getSizesForCurrentTheme,
        getCellRendererInstances,
    },
};
