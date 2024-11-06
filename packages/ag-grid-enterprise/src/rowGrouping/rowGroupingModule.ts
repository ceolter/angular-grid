import type { _ModuleWithApi, _ModuleWithoutApi, _RowGroupingGridApi } from 'ag-grid-community';
import { ColumnFilterModule, FloatingFilterModule, PopupModule, StickyRowModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { AggregationModule } from '../aggregation/aggregationModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { ClientSideRowModelHierarchyModule, GroupColumnModule } from '../rowHierarchy/rowHierarchyModule';
import { AgGridHeaderDropZonesSelector } from './columnDropZones/agGridHeaderDropZones';
import { GroupFilter } from './groupFilter/groupFilter';
import { GroupFloatingFilterComp } from './groupFilter/groupFloatingFilter';
import { GroupHideOpenParentsService } from './groupHideOpenParentsService';
import { GroupStage } from './groupStage/groupStage';
import {
    addRowGroupColumns,
    getRowGroupColumns,
    moveRowGroupColumn,
    removeRowGroupColumns,
    setRowGroupColumns,
} from './rowGroupingApi';

/**
 * @feature Row Grouping
 * @colDef enableRowGroup, rowGroup, rowGroupIndex
 */
export const RowGroupingCoreModule: _ModuleWithApi<_RowGroupingGridApi> = {
    ...baseEnterpriseModule('RowGroupingCoreModule'),
    beans: [GroupStage, GroupHideOpenParentsService],
    apiFunctions: {
        setRowGroupColumns,
        removeRowGroupColumns,
        addRowGroupColumns,
        getRowGroupColumns,
        moveRowGroupColumn,
    },
    dependsOn: [EnterpriseCoreModule, AggregationModule, GroupColumnModule],
};

/**
 * @feature Row Grouping -> Row Group Panel
 */
export const RowGroupingPanelModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('RowGroupingPanelModule'),
    selectors: [AgGridHeaderDropZonesSelector],
    icons: {
        // identifies the pivot drop zone
        pivotPanel: 'pivot',
        // "Row groups" drop zone in column tool panel
        rowGroupPanel: 'group',
        // separator between column 'pills' when you add multiple columns to the header drop zone
        panelDelimiter: 'small-right',
        // version of panelDelimiter used in RTL mode
        panelDelimiterRtl: 'small-left',
    },
    dependsOn: [RowGroupingCoreModule, PopupModule],
};

/**
 * @feature Row Grouping -> Filtering
 */
export const GroupFilterModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('GroupFilterModule'),
    userComponents: { agGroupColumnFilter: GroupFilter },
    dependsOn: [RowGroupingCoreModule, ColumnFilterModule],
};

/**
 * @feature Row Grouping -> Filtering
 */
export const GroupFloatingFilterModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('GroupFloatingFilterModule'),
    userComponents: { agGroupColumnFloatingFilter: GroupFloatingFilterComp },
    dependsOn: [GroupFilterModule, FloatingFilterModule],
};

/**
 * @feature Row Grouping
 */
export const RowGroupingNoPivotModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('RowGroupingNoPivotModule'),
    dependsOn: [
        RowGroupingCoreModule,
        StickyRowModule,
        RowGroupingPanelModule,
        ClientSideRowModelHierarchyModule,
        GroupFilterModule,
        GroupFloatingFilterModule,
    ],
};
