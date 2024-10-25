import type { _ModuleWithApi, _ModuleWithoutApi, _PivotGridApi } from 'ag-grid-community';
import { ColumnGroupCoreModule, StickyRowModule } from 'ag-grid-community';

import { ClientSideRowModelExpansionModule } from '../expansion/expansionModule';
import { baseEnterpriseModule } from '../moduleUtils';
import {
    GroupFilterModule,
    GroupFloatingFilterModule,
    RowGroupingCoreModule,
    RowGroupingPanelModule,
} from '../rowGrouping/rowGroupingModule';
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
import { PivotResultColsService } from './pivotResultColsService';
import { PivotStage } from './pivotStage';

export const PivotCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('PivotCoreModule'),
    beans: [PivotResultColsService, PivotColDefService, PivotStage],
    dependsOn: [RowGroupingCoreModule, ColumnGroupCoreModule],
};

export const PivotApiModule: _ModuleWithApi<_PivotGridApi<any>> = {
    ...baseEnterpriseModule('PivotApiModule'),
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
    dependsOn: [PivotCoreModule],
};

export const PivotModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('PivotModule'),
    dependsOn: [
        PivotCoreModule,
        PivotApiModule,
        StickyRowModule,
        RowGroupingPanelModule,
        ClientSideRowModelExpansionModule,
        GroupFilterModule,
        GroupFloatingFilterModule,
    ],
};
