import type { _ModuleWithApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import type { _RowGridApi, _ScrollGridApi } from './gridApi';
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
 * @feature Rows
 */
export const RowApiModule: _ModuleWithApi<_RowGridApi<any>> = {
    moduleName: 'RowApi',
    version: VERSION,
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
    moduleName: 'ScrollApi',
    version: VERSION,
    apiFunctions: {
        getVerticalPixelRange,
        getHorizontalPixelRange,
        ensureColumnVisible,
        ensureIndexVisible,
        ensureNodeVisible,
    },
};
