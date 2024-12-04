import type { _ModuleWithoutApi } from 'ag-grid-community';
import { _ColumnMoveModule, _PopupModule, _SharedDragAndDropModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { SideBarModule } from '../sideBar/sideBarModule';
import { VERSION } from '../version';
import { MenuItemModule } from '../widgets/menuItemModule';
import { ColumnToolPanel } from './columnToolPanel';
import { ColumnToolPanelFactory } from './columnToolPanelFactory';

/**
 * @feature Accessories -> Columns Tool Panel
 */
export const ColumnsToolPanelModule: _ModuleWithoutApi = {
    moduleName: 'ColumnsToolPanel',
    version: VERSION,
    beans: [ColumnToolPanelFactory],
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
        _ColumnMoveModule,
        _SharedDragAndDropModule,
        _PopupModule,
        MenuItemModule,
    ],
};
