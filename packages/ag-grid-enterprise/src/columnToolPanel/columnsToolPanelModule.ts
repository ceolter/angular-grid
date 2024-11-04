import type { _ModuleWithoutApi } from 'ag-grid-community';
import { ColumnMoveModule, DragAndDropModule, PopupModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { RowGroupingModule } from '../rowGrouping/rowGroupingBundleModule';
import { RowGroupingCoreModule } from '../rowGrouping/rowGroupingModule';
import { SideBarModule, SideBarSharedModule } from '../sideBar/sideBarModule';
import { MenuItemModule } from '../widgets/menuItemModule';
import { ColumnToolPanel } from './columnToolPanel';
import { ColumnToolPanelFactory } from './columnToolPanelFactory';
import { ModelItemUtils } from './modelItemUtils';

/**
 * @feature Accessories -> Columns Tool Panel
 */
export const ColumnsToolPanelCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ColumnsToolPanelCoreModule'),
    beans: [ModelItemUtils],
    userComponents: { agColumnsToolPanel: ColumnToolPanel },
    icons: {
        // column tool panel tab
        columnsToolPanel: 'columns',
        // "Group by {column-name}" item in column header menu
        menuAddRowGroup: 'group',
        // "Un-Group by {column-name}" item in column header menu
        menuRemoveRowGroup: 'group',
        // identifies the pivot drop zone
        pivotPanel: 'pivot',
        // "Row groups" drop zone in column tool panel
        rowGroupPanel: 'group',
        // columns tool panel Values drop zone
        valuePanel: 'aggregation',
        // column tool panel column group contracted (click to expand)
        columnSelectClosed: 'tree-closed',
        // column tool panel column group expanded (click to contract)
        columnSelectOpen: 'tree-open',
        // column tool panel header expand/collapse all button, shown when some children are expanded and
        //     others are collapsed
        columnSelectIndeterminate: 'tree-indeterminate',
    },
    dependsOn: [
        EnterpriseCoreModule,
        SideBarModule,
        ColumnMoveModule,
        DragAndDropModule,
        PopupModule,
        MenuItemModule,
        SideBarSharedModule,
    ],
};

/**
 * @feature Accessories -> Columns Tool Panel
 */
export const ColumnsToolPanelRowGroupingModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ColumnsToolPanelRowGroupingModule'),
    beans: [ColumnToolPanelFactory],
    dependsOn: [ColumnsToolPanelCoreModule, RowGroupingCoreModule],
};

/**
 * @feature Accessories -> Columns Tool Panel
 */
export const ColumnsToolPanelModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ColumnsToolPanelModule'),
    dependsOn: [ColumnsToolPanelCoreModule, ColumnsToolPanelRowGroupingModule, RowGroupingModule],
};
