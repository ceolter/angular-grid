import type { _AggregationGridApi, _ModuleWithApi } from 'ag-grid-community';

import { baseEnterpriseModule } from '../moduleUtils';
import { AggColumnNameService } from './aggColumnNameService';
import { AggFuncService } from './aggFuncService';
import { addAggFuncs, clearAggFuncs, setColumnAggFunc } from './aggregationApi';
import { AggregationStage } from './aggregationStage';
import { FilterAggregatesStage } from './filterAggregatesStage';
import { FooterService } from './footerService';

export const AggregationModule: _ModuleWithApi<_AggregationGridApi<any>> = {
    ...baseEnterpriseModule('AggregationModule'),
    beans: [AggFuncService, AggregationStage, FilterAggregatesStage, AggColumnNameService, FooterService],
    apiFunctions: {
        addAggFuncs,
        clearAggFuncs,
        setColumnAggFunc,
    },
};
