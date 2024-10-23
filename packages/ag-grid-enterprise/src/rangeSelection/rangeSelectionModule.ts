import type { _ModuleWithApi, _ModuleWithoutApi, _RangeSelectionGridApi } from 'ag-grid-community';
import { KeyboardNavigationCoreModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { AgFillHandle } from './agFillHandle';
import { AgRangeHandle } from './agRangeHandle';
import { rangeSelectionCSS } from './rangeSelection.css-GENERATED';
import { addCellRange, clearRangeSelection, getCellRanges } from './rangeSelectionApi';
import { RangeService } from './rangeService';

export const RangeSelectionCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('RangeSelectionCoreModule'),
    beans: [RangeService],
    dependsOn: [EnterpriseCoreModule, KeyboardNavigationCoreModule],
    css: [rangeSelectionCSS],
};

export const RangeSelectionApiModule: _ModuleWithApi<_RangeSelectionGridApi> = {
    ...baseEnterpriseModule('RangeSelectionApiModule'),
    apiFunctions: {
        getCellRanges,
        addCellRange,
        clearRangeSelection,
        clearCellSelection: clearRangeSelection,
    },
    dependsOn: [RangeSelectionCoreModule],
};

export const RangeSelectionFillHandleModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('RangeSelectionFillHandleModule'),
    dynamicBeans: { fillHandle: AgFillHandle },
};

export const RangeSelectionRangeHandleModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('RangeSelectionRangeHandleModule'),
    dynamicBeans: { rangeHandle: AgRangeHandle },
};

export const RangeSelectionModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('RangeSelectionModule'),
    dependsOn: [
        RangeSelectionCoreModule,
        RangeSelectionApiModule,
        RangeSelectionFillHandleModule,
        RangeSelectionRangeHandleModule,
    ],
};
