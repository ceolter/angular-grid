import type {
    AgColumn,
    AgProvidedColumnGroup,
    BeanCollection,
    ColumnModel,
    ColumnNameService,
    FocusService,
    FuncColsService,
    IconName,
    MenuItemDef,
    PopupService,
} from 'ag-grid-community';
import { Component, _createIconNoSpan, isColumn, isProvidedColumnGroup } from 'ag-grid-community';

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
    private columnModel: ColumnModel;
    private columnNameService: ColumnNameService;
    private funcColsService: FuncColsService;
    private popupService: PopupService;
    private focusService: FocusService;

    public wireBeans(beans: BeanCollection) {
        this.columnModel = beans.columnModel;
        this.columnNameService = beans.columnNameService;
        this.funcColsService = beans.funcColsService;
        this.popupService = beans.popupService!;
        this.focusService = beans.focusService;
    }

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
        this.initializeProperties(this.column);
        this.buildMenuItemMap();

        if (isColumn(this.column)) {
            this.displayName = this.columnNameService.getDisplayNameForColumn(this.column, 'columnToolPanel');
        } else {
            this.displayName = this.columnNameService.getDisplayNameForProvidedColumnGroup(
                null,
                this.column,
                'columnToolPanel'
            );
        }

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
        if (isProvidedColumnGroup(column)) {
            this.columns = column.getLeafColumns();
        } else {
            this.columns = [column];
        }

        this.allowGrouping = this.columns.some((col) => col.isPrimary() && col.isAllowRowGroup());
        this.allowValues = this.columns.some((col) => col.isPrimary() && col.isAllowValue());
        this.allowPivoting =
            this.columnModel.isPivotMode() && this.columns.some((col) => col.isPrimary() && col.isAllowPivot());
    }

    private buildMenuItemMap(): void {
        const localeTextFunc = this.getLocaleTextFunc();

        this.menuItemMap = new Map<MenuItemName, MenuItemProperty>();
        this.menuItemMap.set('rowGroup', {
            allowedFunction: (col) =>
                col.isPrimary() && col.isAllowRowGroup() && !isRowGroupColLocked(this.funcColsService, this.gos, col),
            activeFunction: (col) => col.isRowGroupActive(),
            activateLabel: () => `${localeTextFunc('groupBy', 'Group by')} ${this.displayName}`,
            deactivateLabel: () => `${localeTextFunc('ungroupBy', 'Un-Group by')} ${this.displayName}`,
            activateFunction: () => {
                const groupedColumns = this.funcColsService.rowGroupCols;
                this.funcColsService.setRowGroupColumns(this.addColumnsToList(groupedColumns), 'toolPanelUi');
            },
            deActivateFunction: () => {
                const groupedColumns = this.funcColsService.rowGroupCols;
                this.funcColsService.setRowGroupColumns(this.removeColumnsFromList(groupedColumns), 'toolPanelUi');
            },
            addIcon: 'menuAddRowGroup',
            removeIcon: 'menuRemoveRowGroup',
        });

        this.menuItemMap.set('value', {
            allowedFunction: (col) => col.isPrimary() && col.isAllowValue(),
            activeFunction: (col) => col.isValueActive(),
            activateLabel: () =>
                localeTextFunc('addToValues', `Add ${this.displayName} to values`, [this.displayName!]),
            deactivateLabel: () =>
                localeTextFunc('removeFromValues', `Remove ${this.displayName} from values`, [this.displayName!]),
            activateFunction: () => {
                const valueColumns = this.funcColsService.valueCols;
                this.funcColsService.setValueColumns(this.addColumnsToList(valueColumns), 'toolPanelUi');
            },
            deActivateFunction: () => {
                const valueColumns = this.funcColsService.valueCols;
                this.funcColsService.setValueColumns(this.removeColumnsFromList(valueColumns), 'toolPanelUi');
            },
            addIcon: 'valuePanel',
            removeIcon: 'valuePanel',
        });

        this.menuItemMap.set('pivot', {
            allowedFunction: (col) => this.columnModel.isPivotMode() && col.isPrimary() && col.isAllowPivot(),
            activeFunction: (col) => col.isPivotActive(),
            activateLabel: () =>
                localeTextFunc('addToLabels', `Add ${this.displayName} to labels`, [this.displayName!]),
            deactivateLabel: () =>
                localeTextFunc('removeFromLabels', `Remove ${this.displayName} from labels`, [this.displayName!]),
            activateFunction: () => {
                const pivotColumns = this.funcColsService.pivotCols;
                this.funcColsService.setPivotColumns(this.addColumnsToList(pivotColumns), 'toolPanelUi');
            },
            deActivateFunction: () => {
                const pivotColumns = this.funcColsService.pivotCols;
                this.funcColsService.setPivotColumns(this.removeColumnsFromList(pivotColumns), 'toolPanelUi');
            },
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

        const addPopupRes = this.popupService.addPopup({
            modal: true,
            eChild: eGui,
            closeOnEsc: true,
            afterGuiAttached: () => this.focusService.focusInto(menuList.getGui()),
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

        this.popupService.positionPopupUnderMouseEvent({
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
        for (const val of this.menuItemMap.values()) {
            const isInactive = this.columns.some((col) => val.allowedFunction(col) && !val.activeFunction(col));
            const isActive = this.columns.some((col) => val.allowedFunction(col) && val.activeFunction(col));

            if (isInactive) {
                ret.push({
                    name: val.activateLabel(this.displayName!),
                    icon: _createIconNoSpan(val.addIcon, this.beans, null),
                    action: () => val.activateFunction(),
                });
            }

            if (isActive) {
                ret.push({
                    name: val.deactivateLabel(this.displayName!),
                    icon: _createIconNoSpan(val.removeIcon, this.beans, null),
                    action: () => val.deActivateFunction(),
                });
            }
        }

        return ret;
    }
}
