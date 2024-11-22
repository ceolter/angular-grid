import type { _ModuleWithApi, _ModuleWithoutApi, _PivotGridApi } from 'ag-grid-community';
import { _ColumnGroupModule } from 'ag-grid-community';

import { baseEnterpriseModule } from '../moduleUtils';
import { RowGroupingModule, SharedRowGroupingModule } from '../rowGrouping/rowGroupingModule';
import { ClientSideRowModelHierarchyModule } from '../rowHierarchy/rowHierarchyModule';
import {
    addPivotColumns,
    addValueColumns,
    getPivotColumns,
    getPivotResultColumn,
    getPivotResultColumns,
    getValueColumns,
    isPivotMode,
    removePivotColumns,
    removeValueColumns,
    setPivotColumns,
    setPivotResultColumns,
    setValueColumns,
} from './pivotApi';
import { PivotColDefService } from './pivotColDefService';
import { PivotColsSvc } from './pivotColsSvc';
import { PivotResultColsService } from './pivotResultColsService';
import { PivotStage } from './pivotStage';

/**
 * @internal
 */
export const SharedPivotModule: _ModuleWithApi<_PivotGridApi<any>> = {
    ...baseEnterpriseModule('SharedPivot'),
    beans: [PivotResultColsService, PivotColDefService, PivotColsSvc],
    apiFunctions: {
        isPivotMode,
        getPivotResultColumn,
        setValueColumns,
        getValueColumns,
        removeValueColumns,
        addValueColumns,
        setPivotColumns,
        removePivotColumns,
        addPivotColumns,
        getPivotColumns,
        setPivotResultColumns,
        getPivotResultColumns,
    },
    dependsOn: [SharedRowGroupingModule, _ColumnGroupModule],
};

/**
 * @feature Pivoting
 * @colDef pivot, enablePivot
 * @gridOption pivotMode
 */
export const PivotModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('Pivot'),
    rowModels: ['clientSide'],
    beans: [PivotStage],
    dependsOn: [SharedPivotModule, RowGroupingModule, ClientSideRowModelHierarchyModule],
};
