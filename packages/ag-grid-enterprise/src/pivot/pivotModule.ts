import type { _ModuleWithApi, _ModuleWithoutApi, _PivotGridApi } from 'ag-grid-community';
import { ColumnGroupModule, StickyRowModule } from 'ag-grid-community';

import { baseEnterpriseModule } from '../moduleUtils';
import {
    GroupFilterModule,
    GroupFloatingFilterModule,
    RowGroupingCoreModule,
    RowGroupingPanelModule,
} from '../rowGrouping/rowGroupingModule';
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

export const PivotCoreModule: _ModuleWithApi<_PivotGridApi<any>> = {
    ...baseEnterpriseModule('PivotCoreModule'),
    beans: [PivotResultColsService, PivotColDefService, PivotStage, PivotColDefService, PivotColsSvc],
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
    dependsOn: [RowGroupingCoreModule, ColumnGroupModule],
};

export const PivotModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('PivotModule'),
    dependsOn: [
        PivotCoreModule,
        StickyRowModule,
        RowGroupingPanelModule,
        ClientSideRowModelHierarchyModule,
        GroupFilterModule,
        GroupFloatingFilterModule,
    ],
};
