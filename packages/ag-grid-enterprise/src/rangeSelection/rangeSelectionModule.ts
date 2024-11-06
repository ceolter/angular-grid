import type { _CellSelectionGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';
import { DragModule, KeyboardNavigationModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { AgFillHandle } from './agFillHandle';
import { AgRangeHandle } from './agRangeHandle';
import { rangeSelectionCSS } from './rangeSelection.css-GENERATED';
import { addCellRange, clearRangeSelection, getCellRanges } from './rangeSelectionApi';
import { RangeService } from './rangeService';

/**
 * @feature Selection -> Cell Selection
 * @gridOption cellSelection
 */
export const CellSelectionCoreModule: _ModuleWithApi<_CellSelectionGridApi> = {
    ...baseEnterpriseModule('CellSelectionCoreModule'),
    beans: [RangeService],
    apiFunctions: {
        getCellRanges,
        addCellRange,
        clearRangeSelection,
        clearCellSelection: clearRangeSelection,
    },
    dependsOn: [EnterpriseCoreModule, KeyboardNavigationModule, DragModule],
    css: [rangeSelectionCSS],
};

/**
 * @feature Selection -> Fill Handle
 */
export const CellSelectionFillHandleModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('CellSelectionFillHandleModule'),
    dynamicBeans: { fillHandle: AgFillHandle },
};

/**
 * @feature Selection -> Range Handle
 */
export const CellSelectionRangeHandleModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('CellSelectionRangeHandleModule'),
    dynamicBeans: { rangeHandle: AgRangeHandle },
};

/**
 * @feature Selection -> Cell Selection
 */
export const CellSelectionModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('CellSelectionModule'),
    dependsOn: [CellSelectionCoreModule, CellSelectionFillHandleModule, CellSelectionRangeHandleModule],
};

// legacy name
/**
 * @feature Selection -> Cell Selection
 */
export const RangeSelectionModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('RangeSelectionModule'),
    dependsOn: [CellSelectionModule],
};
