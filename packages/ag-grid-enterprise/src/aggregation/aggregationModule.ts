import type { _AggregationGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { VERSION } from '../version';
import { AggColumnNameService } from './aggColumnNameService';
import { AggFuncService } from './aggFuncService';
import { addAggFuncs, clearAggFuncs, setColumnAggFunc } from './aggregationApi';
import { AggregationStage } from './aggregationStage';
import { FilterAggregatesStage } from './filterAggregatesStage';
import { FooterService } from './footerService';
import { ValueColsSvc } from './valueColsSvc';

/**
 * @internal
 */
export const SharedAggregationModule: _ModuleWithApi<_AggregationGridApi<any>> = {
    moduleName: 'SharedAggregation',
    version: VERSION,
    beans: [AggFuncService, AggColumnNameService, FooterService, ValueColsSvc],
    apiFunctions: {
        addAggFuncs,
        clearAggFuncs,
        setColumnAggFunc,
    },
    dependsOn: [EnterpriseCoreModule],
};

/**
 * @internal
 */
export const AggregationModule: _ModuleWithoutApi = {
    moduleName: 'Aggregation',
    version: VERSION,
    beans: [AggregationStage, FilterAggregatesStage],
    rowModels: ['clientSide'],
    dependsOn: [SharedAggregationModule],
};
