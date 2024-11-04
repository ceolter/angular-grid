import type {
    AgColumn,
    AgProvidedColumnGroup,
    BeanCollection,
    ColumnModel,
    IColsService,
    MenuItemDef,
    MenuService,
    NamedBean,
} from 'ag-grid-community';
import { BeanStub, _isClientSideRowModel, _isLegacyMenuEnabled } from 'ag-grid-community';

import { isRowGroupColLocked } from '../rowGrouping/rowGroupingUtils';
import { AgMenuList } from '../widgets/agMenuList';
import type { MenuItemMapper } from './menuItemMapper';

const MENU_ITEM_SEPARATOR = 'separator';

function _removeRepeatsFromArray<T>(array: T[], object: T) {
    if (!array) {
        return;
    }

    for (let index = array.length - 2; index >= 0; index--) {
        const thisOneMatches = array[index] === object;
        const nextOneMatches = array[index + 1] === object;

        if (thisOneMatches && nextOneMatches) {
            array.splice(index + 1, 1);
        }
    }
}

export class ColumnMenuFactory extends BeanStub implements NamedBean {
    beanName = 'colMenuFactory' as const;

    private menuItemMapper: MenuItemMapper;
    private colModel: ColumnModel;
    private menuSvc: MenuService;
    private rowGroupColsSvc?: IColsService;

    public wireBeans(beans: BeanCollection) {
        this.menuItemMapper = beans.menuItemMapper as MenuItemMapper;
        this.colModel = beans.colModel;
        this.menuSvc = beans.menuSvc!;
        this.rowGroupColsSvc = beans.rowGroupColsSvc;
    }

    public createMenu(
        parent: BeanStub<any>,
        menuItems: (string | MenuItemDef)[],
        column: AgColumn | undefined,
        sourceElement: () => HTMLElement
    ): AgMenuList {
        const menuList = parent.createManagedBean(
            new AgMenuList(0, {
                column: column ?? null,
                node: null,
                value: null,
            })
        );

        const menuItemsMapped = this.menuItemMapper.mapWithStockItems(
            menuItems,
            column ?? null,
            sourceElement,
            'columnMenu'
        );

        menuList.addMenuItems(menuItemsMapped);

        return menuList;
    }

    public getMenuItems(
        column: AgColumn | null = null,
        columnGroup: AgProvidedColumnGroup | null = null
    ): (string | MenuItemDef)[] {
        const defaultItems = this.getDefaultMenuOptions(column);
        let result: (string | MenuItemDef)[];

        const columnMainMenuItems = (column?.getColDef() ?? columnGroup?.getColGroupDef())?.mainMenuItems;
        if (Array.isArray(columnMainMenuItems)) {
            result = columnMainMenuItems;
        } else if (typeof columnMainMenuItems === 'function') {
            result = columnMainMenuItems(
                this.gos.addGridCommonParams({
                    column,
                    columnGroup,
                    defaultItems,
                })
            );
        } else {
            const userFunc = this.gos.getCallback('getMainMenuItems');
            if (userFunc) {
                result = userFunc({
                    column,
                    columnGroup,
                    defaultItems,
                });
            } else {
                result = defaultItems;
            }
        }

        // GUI looks weird when two separators are side by side. this can happen accidentally
        // if we remove items from the menu then two separators can edit up adjacent.
        _removeRepeatsFromArray(result, MENU_ITEM_SEPARATOR);

        return result;
    }

    private getDefaultMenuOptions(column: AgColumn | null): string[] {
        const result: string[] = [];

        const isLegacyMenuEnabled = _isLegacyMenuEnabled(this.gos);

        if (!column) {
            if (!isLegacyMenuEnabled) {
                result.push('columnChooser');
            }
            result.push('resetColumns');
            return result;
        }

        const allowPinning = !column.getColDef().lockPinned;

        const rowGroupCount = this.rowGroupColsSvc?.columns.length ?? 0;
        const doingGrouping = rowGroupCount > 0;

        const allowValue = column.isAllowValue();
        const allowRowGroup = column.isAllowRowGroup();
        const isPrimary = column.isPrimary();
        const pivotModeOn = this.colModel.isPivotMode();

        const isInMemoryRowModel = _isClientSideRowModel(this.gos);

        const usingTreeData = this.gos.get('treeData');

        const allowValueAgg =
            // if primary, then only allow aggValue if grouping and it's a value columns
            (isPrimary && doingGrouping && allowValue) ||
            // secondary columns can always have aggValue, as it means it's a pivot value column
            !isPrimary;

        if (!isLegacyMenuEnabled && column.isSortable()) {
            const sort = column.getSort();
            if (sort !== 'asc') {
                result.push('sortAscending');
            }
            if (sort !== 'desc') {
                result.push('sortDescending');
            }
            if (sort) {
                result.push('sortUnSort');
            }
            result.push(MENU_ITEM_SEPARATOR);
        }

        if (this.menuSvc.isFilterMenuItemEnabled(column)) {
            result.push('columnFilter');
            result.push(MENU_ITEM_SEPARATOR);
        }

        if (allowPinning) {
            result.push('pinSubMenu');
        }

        if (allowValueAgg) {
            result.push('valueAggSubMenu');
        }

        if (allowPinning || allowValueAgg) {
            result.push(MENU_ITEM_SEPARATOR);
        }

        result.push('autoSizeThis');
        result.push('autoSizeAll');
        result.push(MENU_ITEM_SEPARATOR);

        const showRowGroup = column.getColDef().showRowGroup;
        if (showRowGroup) {
            result.push('rowUnGroup');
        } else if (allowRowGroup && column.isPrimary()) {
            if (column.isRowGroupActive()) {
                const groupLocked = isRowGroupColLocked(column, this.beans);
                if (!groupLocked) {
                    result.push('rowUnGroup');
                }
            } else {
                result.push('rowGroup');
            }
        }
        result.push(MENU_ITEM_SEPARATOR);
        if (!isLegacyMenuEnabled) {
            result.push('columnChooser');
        }
        result.push('resetColumns');

        // only add grouping expand/collapse if grouping in the InMemoryRowModel
        // if pivoting, we only have expandable groups if grouping by 2 or more columns
        // as the lowest level group is not expandable while pivoting.
        // if not pivoting, then any active row group can be expanded.
        const allowExpandAndContract = isInMemoryRowModel && (usingTreeData || rowGroupCount > (pivotModeOn ? 1 : 0));

        if (allowExpandAndContract) {
            result.push('expandAll');
            result.push('contractAll');
        }

        return result;
    }
}
