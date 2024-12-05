import type { _CellSelectionGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';
import { _DragModule, _KeyboardNavigationModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { VERSION } from '../version';
import { AgFillHandle } from './agFillHandle';
import { AgRangeHandle } from './agRangeHandle';
import { rangeSelectionCSS } from './rangeSelection.css-GENERATED';
import { addCellRange, clearRangeSelection, getCellRanges } from './rangeSelectionApi';
import { RangeService } from './rangeService';

/**
 * @feature Selection -> Cell Selection
 * @gridOption cellSelection
 */
export const CellSelectionModule: _ModuleWithApi<_CellSelectionGridApi> = {
    moduleName: 'CellSelection',
    version: VERSION,
    beans: [RangeService],
    dynamicBeans: { fillHandle: AgFillHandle, rangeHandle: AgRangeHandle },
    apiFunctions: {
        getCellRanges,
        addCellRange,
        clearRangeSelection,
        clearCellSelection: clearRangeSelection,
    },
    dependsOn: [EnterpriseCoreModule, _KeyboardNavigationModule, _DragModule],
    css: [rangeSelectionCSS],
};

/**
 * @deprecated v33 Use `CellSelectionModule` instead
 */
export const RangeSelectionModule: _ModuleWithoutApi = {
    moduleName: 'RangeSelection',
    version: VERSION,
    dependsOn: [CellSelectionModule],
};
