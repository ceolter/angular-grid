import type { AgColumn, AgProvidedColumnGroup, IconName, MenuItemDef } from 'ag-grid-community';
import { Component, _createIconNoSpan, _focusInto, isColumn, isProvidedColumnGroup } from 'ag-grid-community';

import { isRowGroupColLocked } from '../rowGrouping/rowGroupingUtils';
import { AgMenuList } from '../widgets/agMenuList';

type MenuItemName = 'rowGroup' | 'value' | 'pivot';

type MenuItemProperty = {
    allowedFunction: (col: AgColumn) => boolean;
    activeFunction: (col: AgColumn) => boolean;
    activateLabel: (name: string) => string;
    deactivateLabel: (name: string) => string;
    activateFunction: () => void;
    deActivateFunction: () => void;
    addIcon: IconName;
    removeIcon: IconName;
};

export class ToolPanelContextMenu extends Component {
    private columns: AgColumn[];
    private allowGrouping: boolean;
    private allowValues: boolean;
    private allowPivoting: boolean;
    private menuItemMap: Map<MenuItemName, MenuItemProperty>;
    private displayName: string | null = null;

    constructor(
        private readonly column: AgColumn | AgProvidedColumnGroup,
        private readonly mouseEvent: MouseEvent,
        private readonly parentEl: HTMLElement
    ) {
        super(/* html */ `<div class="ag-menu"></div>`);
    }

    public postConstruct(): void {
        const {
            column,
            beans: { colNames },
        } = this;
        this.initializeProperties(column);
        this.buildMenuItemMap();

        let displayName: string | null;
        if (isColumn(column)) {
            displayName = colNames.getDisplayNameForColumn(column, 'columnToolPanel');
        } else {
            displayName = colNames.getDisplayNameForProvidedColumnGroup(null, column, 'columnToolPanel');
        }
        this.displayName = displayName;

        if (this.isActive()) {
            this.mouseEvent.preventDefault();
            const menuItemsMapped: MenuItemDef[] = this.getMappedMenuItems();
            if (menuItemsMapped.length === 0) {
                return;
            }

            this.displayContextMenu(menuItemsMapped);
        }
    }

    private initializeProperties(column: AgColumn | AgProvidedColumnGroup): void {
        let columns: AgColumn[];
        if (isProvidedColumnGroup(column)) {
            columns = column.getLeafColumns();
        } else {
            columns = [column];
        }
        this.columns = columns;

        this.allowGrouping = columns.some((col) => col.isPrimary() && col.isAllowRowGroup());
        this.allowValues = columns.some((col) => col.isPrimary() && col.isAllowValue());
        this.allowPivoting =
            this.beans.colModel.isPivotMode() && columns.some((col) => col.isPrimary() && col.isAllowPivot());
    }

    private buildMenuItemMap(): void {
        const localeTextFunc = this.getLocaleTextFunc();
        const { beans, displayName } = this;
        const { rowGroupColsSvc, valueColsSvc, pivotColsSvc, colModel } = beans;

        const menuItemMap = new Map<MenuItemName, MenuItemProperty>();
        this.menuItemMap = menuItemMap;
        menuItemMap.set('rowGroup', {
            allowedFunction: (col) => col.isPrimary() && col.isAllowRowGroup() && !isRowGroupColLocked(col, beans),
            activeFunction: (col) => col.isRowGroupActive(),
            activateLabel: () => `${localeTextFunc('groupBy', 'Group by')} ${displayName}`,
            deactivateLabel: () => `${localeTextFunc('ungroupBy', 'Un-Group by')} ${displayName}`,
            activateFunction: () =>
                rowGroupColsSvc?.setColumns(this.addColumnsToList(rowGroupColsSvc.columns), 'toolPanelUi'),
            deActivateFunction: () =>
                rowGroupColsSvc?.setColumns(this.removeColumnsFromList(rowGroupColsSvc.columns), 'toolPanelUi'),
            addIcon: 'menuAddRowGroup',
            removeIcon: 'menuRemoveRowGroup',
        });

        menuItemMap.set('value', {
            allowedFunction: (col) => col.isPrimary() && col.isAllowValue(),
            activeFunction: (col) => col.isValueActive(),
            activateLabel: () => localeTextFunc('addToValues', `Add ${displayName} to values`, [displayName!]),
            deactivateLabel: () =>
                localeTextFunc('removeFromValues', `Remove ${displayName} from values`, [displayName!]),
            activateFunction: () =>
                valueColsSvc?.setColumns(this.addColumnsToList(valueColsSvc.columns), 'toolPanelUi'),
            deActivateFunction: () =>
                valueColsSvc?.setColumns(this.removeColumnsFromList(valueColsSvc.columns), 'toolPanelUi'),
            addIcon: 'valuePanel',
            removeIcon: 'valuePanel',
        });

        menuItemMap.set('pivot', {
            allowedFunction: (col) => colModel.isPivotMode() && col.isPrimary() && col.isAllowPivot(),
            activeFunction: (col) => col.isPivotActive(),
            activateLabel: () => localeTextFunc('addToLabels', `Add ${displayName} to labels`, [displayName!]),
            deactivateLabel: () =>
                localeTextFunc('removeFromLabels', `Remove ${displayName} from labels`, [displayName!]),
            activateFunction: () =>
                pivotColsSvc?.setColumns(this.addColumnsToList(pivotColsSvc.columns), 'toolPanelUi'),
            deActivateFunction: () =>
                pivotColsSvc?.setColumns(this.removeColumnsFromList(pivotColsSvc.columns), 'toolPanelUi'),
            addIcon: 'pivotPanel',
            removeIcon: 'pivotPanel',
        });
    }

    private addColumnsToList(columnList: AgColumn[]): AgColumn[] {
        return [...columnList].concat(this.columns.filter((col) => columnList.indexOf(col) === -1));
    }

    private removeColumnsFromList(columnList: AgColumn[]): AgColumn[] {
        return columnList.filter((col) => this.columns.indexOf(col) === -1);
    }

    private displayContextMenu(menuItemsMapped: MenuItemDef[]): void {
        const eGui = this.getGui();
        const menuList = this.createBean(new AgMenuList());
        const localeTextFunc = this.getLocaleTextFunc();

        let hideFunc = () => {};

        eGui.appendChild(menuList.getGui());
        menuList.addMenuItems(menuItemsMapped);
        menuList.addManagedListeners(menuList, {
            closeMenu: () => {
                this.parentEl.focus();
                hideFunc();
            },
        });

        const popupSvc = this.beans.popupSvc!;
        const addPopupRes = popupSvc.addPopup({
            modal: true,
            eChild: eGui,
            closeOnEsc: true,
            afterGuiAttached: () => _focusInto(menuList.getGui()),
            ariaLabel: localeTextFunc('ariaLabelContextMenu', 'Context Menu'),
            closedCallback: (e: KeyboardEvent) => {
                if (e instanceof KeyboardEvent) {
                    this.parentEl.focus();
                }
                this.destroyBean(menuList);
            },
        });

        if (addPopupRes) {
            hideFunc = addPopupRes.hideFunc;
        }

        popupSvc.positionPopupUnderMouseEvent({
            type: 'columnContextMenu',
            mouseEvent: this.mouseEvent,
            ePopup: eGui,
        });
    }

    private isActive(): boolean {
        return this.allowGrouping || this.allowValues || this.allowPivoting;
    }

    private getMappedMenuItems(): MenuItemDef[] {
        const ret: MenuItemDef[] = [];
        const { menuItemMap, columns, displayName, beans } = this;
        for (const val of menuItemMap.values()) {
            const isInactive = columns.some((col) => val.allowedFunction(col) && !val.activeFunction(col));
            const isActive = columns.some((col) => val.allowedFunction(col) && val.activeFunction(col));

            if (isInactive) {
                ret.push({
                    name: val.activateLabel(displayName!),
                    icon: _createIconNoSpan(val.addIcon, beans, null),
                    action: () => val.activateFunction(),
                });
            }

            if (isActive) {
                ret.push({
                    name: val.deactivateLabel(displayName!),
                    icon: _createIconNoSpan(val.removeIcon, beans, null),
                    action: () => val.deActivateFunction(),
                });
            }
        }

        return ret;
    }
}
