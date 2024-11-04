import type { _ModuleWithApi } from '../interfaces/iModule';
import { baseCommunityModule } from '../interfaces/iModule';
import { destroy, getGridId, getGridOption, isDestroyed, setGridOption, updateGridOptions } from './coreApi';
import type { _CoreGridApi, _RowGridApi, _ScrollGridApi } from './gridApi';
import {
    addRenderedRowListener,
    forEachNode,
    getDisplayedRowAtIndex,
    getDisplayedRowCount,
    getFirstDisplayedRowIndex,
    getLastDisplayedRowIndex,
    getRenderedNodes,
    getRowNode,
    redrawRows,
    setRowNodeExpanded,
} from './rowApi';
import {
    ensureColumnVisible,
    ensureIndexVisible,
    ensureNodeVisible,
    getHorizontalPixelRange,
    getVerticalPixelRange,
} from './scrollApi';

/**
 * Included by default
 * @internal
 */
export const CoreApiModule: _ModuleWithApi<_CoreGridApi> = {
    ...baseCommunityModule('CoreApiModule'),
    apiFunctions: {
        getGridId,
        destroy,
        isDestroyed,
        getGridOption,
        setGridOption,
        updateGridOptions,
    },
};

/**
 * @feature Rows
 */
export const RowApiModule: _ModuleWithApi<_RowGridApi<any>> = {
    ...baseCommunityModule('RowApiModule'),
    apiFunctions: {
        redrawRows,
        setRowNodeExpanded,
        getRowNode,
        addRenderedRowListener,
        getRenderedNodes,
        forEachNode,
        getFirstDisplayedRowIndex,
        getLastDisplayedRowIndex,
        getDisplayedRowAtIndex,
        getDisplayedRowCount,
    },
};

/**
 * @feature Scrolling
 */
export const ScrollApiModule: _ModuleWithApi<_ScrollGridApi<any>> = {
    ...baseCommunityModule('ScrollApiModule'),
    apiFunctions: {
        getVerticalPixelRange,
        getHorizontalPixelRange,
        ensureColumnVisible,
        ensureIndexVisible,
        ensureNodeVisible,
    },
};
