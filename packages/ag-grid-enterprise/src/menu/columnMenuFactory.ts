import type { AgColumn, AgProvidedColumnGroup, DefaultMenuItem, MenuItemDef, NamedBean } from 'ag-grid-community';
import { BeanStub, _isClientSideRowModel, _isLegacyMenuEnabled } from 'ag-grid-community';

import { isRowGroupColLocked } from '../rowGrouping/rowGroupingUtils';
import { AgMenuList } from '../widgets/agMenuList';
import { MENU_ITEM_SEPARATOR, _removeRepeatsFromArray } from './menuItemMapper';
import type { MenuItemMapper } from './menuItemMapper';

export class ColumnMenuFactory extends BeanStub implements NamedBean {
    beanName = 'colMenuFactory' as const;

    public createMenu(
        parent: BeanStub<any>,
        menuItems: (DefaultMenuItem | MenuItemDef)[],
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

        const menuItemsMapped = (this.beans.menuItemMapper as MenuItemMapper).mapWithStockItems(
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
    ): (DefaultMenuItem | MenuItemDef)[] {
        const defaultItems = this.getDefaultMenuOptions(column);
        let result: (DefaultMenuItem | MenuItemDef)[];

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

    private getDefaultMenuOptions(column: AgColumn | null): DefaultMenuItem[] {
        const result: DefaultMenuItem[] = [];

        const { beans, gos } = this;
        const {
            colChooserFactory,
            rowGroupColsSvc,
            colModel,
            expansionSvc,
            sortSvc,
            menuSvc,
            pinnedCols,
            aggFuncSvc,
            colAutosize,
        } = beans;
        const isLegacyMenuEnabled = _isLegacyMenuEnabled(gos);

        const addColumnItems = () => {
            if (!isLegacyMenuEnabled && colChooserFactory) {
                result.push('columnChooser');
            }
            result.push('resetColumns');
        };

        if (!column) {
            addColumnItems();
            return result;
        }

        const { colDef } = column;
        const allowPinning = pinnedCols && !colDef.lockPinned;

        const rowGroupCount = rowGroupColsSvc?.columns.length ?? 0;
        const doingGrouping = rowGroupCount > 0;

        const isPrimary = column.isPrimary();

        const allowValueAgg =
            (aggFuncSvc &&
                // if primary, then only allow aggValue if grouping and it's a value columns
                isPrimary &&
                doingGrouping &&
                column.isAllowValue()) ||
            // secondary columns can always have aggValue, as it means it's a pivot value column
            !isPrimary;

        if (sortSvc && !isLegacyMenuEnabled && column.isSortable()) {
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

        if (menuSvc?.isFilterMenuItemEnabled(column)) {
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

        if (colAutosize) {
            result.push('autoSizeThis');
            result.push('autoSizeAll');
            result.push(MENU_ITEM_SEPARATOR);
        }

        if (rowGroupColsSvc) {
            const numItems = result.length;
            const showRowGroup = colDef.showRowGroup;
            if (showRowGroup) {
                result.push('rowUnGroup');
            } else if (column.isAllowRowGroup() && isPrimary) {
                if (column.isRowGroupActive()) {
                    const groupLocked = isRowGroupColLocked(column, beans);
                    if (!groupLocked) {
                        result.push('rowUnGroup');
                    }
                } else {
                    result.push('rowGroup');
                }
            }
            if (result.length > numItems) {
                // only add separator if added group items
                result.push(MENU_ITEM_SEPARATOR);
            }
        }

        addColumnItems();

        // only add grouping expand/collapse if grouping in the InMemoryRowModel
        // if pivoting, we only have expandable groups if grouping by 2 or more columns
        // as the lowest level group is not expandable while pivoting.
        // if not pivoting, then any active row group can be expanded.
        if (
            expansionSvc &&
            _isClientSideRowModel(gos) &&
            (gos.get('treeData') || rowGroupCount > (colModel.isPivotMode() ? 1 : 0))
        ) {
            result.push('expandAll');
            result.push('contractAll');
        }

        return result;
    }
}
