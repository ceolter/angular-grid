import type {
    AgColumn,
    BeanCollection,
    CellCtrl,
    CellPosition,
    ColumnModel,
    CtrlsService,
    EventShowContextMenuParams,
    FocusService,
    IAfterGuiAttachedParams,
    IContextMenuService,
    IRangeService,
    MenuItemDef,
    MouseShowContextMenuParams,
    NamedBean,
    PopupService,
    RowCtrl,
    RowNode,
    RowRenderer,
    TouchShowContextMenuParam,
    ValueService,
} from 'ag-grid-community';
import { BeanStub, Component, _areCellsEqual, _exists, _isIOSUserAgent, _isNothingFocused } from 'ag-grid-community';

import type { CloseMenuEvent } from '../widgets/agMenuItemComponent';
import { AgMenuList } from '../widgets/agMenuList';
import type { MenuItemMapper } from './menuItemMapper';
import type { MenuUtils } from './menuUtils';

const CSS_MENU = 'ag-menu';
const CSS_CONTEXT_MENU_OPEN = 'ag-context-menu-open';

export class ContextMenuService extends BeanStub implements NamedBean, IContextMenuService {
    beanName = 'contextMenuSvc' as const;

    private popupSvc: PopupService;
    private ctrlsSvc: CtrlsService;
    private colModel: ColumnModel;
    private menuUtils: MenuUtils;
    private rangeSvc?: IRangeService;
    private focusSvc: FocusService;
    private valueSvc: ValueService;
    private rowRenderer: RowRenderer;

    public wireBeans(beans: BeanCollection): void {
        this.popupSvc = beans.popupSvc!;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.colModel = beans.colModel;
        this.menuUtils = beans.menuUtils as MenuUtils;
        this.rangeSvc = beans.rangeSvc;
        this.focusSvc = beans.focusSvc;
        this.valueSvc = beans.valueSvc;
        this.rowRenderer = beans.rowRenderer;
    }

    private activeMenu: ContextMenu | null;

    public hideActiveMenu(): void {
        this.destroyBean(this.activeMenu);
    }

    private getMenuItems(
        node: RowNode | null,
        column: AgColumn | null,
        value: any
    ): (MenuItemDef | string)[] | undefined {
        const defaultMenuOptions: string[] = [];

        if (_exists(node) && this.gos.isModuleRegistered('ClipboardCoreModule')) {
            if (column) {
                // only makes sense if column exists, could have originated from a row
                if (!this.gos.get('suppressCutToClipboard')) {
                    defaultMenuOptions.push('cut');
                }
                defaultMenuOptions.push('copy', 'copyWithHeaders', 'copyWithGroupHeaders', 'paste', 'separator');
            }
        }

        if (this.gos.get('enableCharts') && this.gos.isModuleRegistered('GridChartsCoreModule')) {
            if (this.colModel.isPivotMode()) {
                defaultMenuOptions.push('pivotChart');
            }

            if (this.rangeSvc && !this.rangeSvc.isEmpty()) {
                defaultMenuOptions.push('chartRange');
            }
        }

        if (_exists(node)) {
            // if user clicks a cell
            const csvModuleMissing = !this.gos.isModuleRegistered('CsvExportCoreModule');
            const excelModuleMissing = !this.gos.isModuleRegistered('ExcelExportCoreModule');
            const suppressExcel = this.gos.get('suppressExcelExport') || excelModuleMissing;
            const suppressCsv = this.gos.get('suppressCsvExport') || csvModuleMissing;
            const onIPad = _isIOSUserAgent();
            const anyExport: boolean = !onIPad && (!suppressExcel || !suppressCsv);
            if (anyExport) {
                defaultMenuOptions.push('export');
            }
        }

        const defaultItems = defaultMenuOptions.length ? defaultMenuOptions : undefined;
        const columnContextMenuItems = column?.getColDef().contextMenuItems;

        if (Array.isArray(columnContextMenuItems)) {
            return columnContextMenuItems;
        }

        if (typeof columnContextMenuItems === 'function') {
            return columnContextMenuItems(
                this.gos.addGridCommonParams({
                    column,
                    node,
                    value,
                    defaultItems,
                })
            );
        }

        const userFunc = this.gos.getCallback('getContextMenuItems');
        if (userFunc) {
            return userFunc({ column, node, value, defaultItems });
        }

        return defaultMenuOptions;
    }

    public getContextMenuPosition(rowNode?: RowNode | null, column?: AgColumn | null): { x: number; y: number } {
        const rowCtrl = this.getRowCtrl(rowNode);
        const eGui = this.getCellGui(rowCtrl, column);

        if (!eGui) {
            if (rowCtrl) {
                return { x: 0, y: rowCtrl.getRowYPosition() };
            }
            return { x: 0, y: 0 };
        }

        const rect = eGui.getBoundingClientRect();

        return {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
        };
    }

    public showContextMenu(params: EventShowContextMenuParams & { anchorToElement?: HTMLElement }): void {
        const rowNode = params.rowNode as RowNode | null | undefined;
        const column = params.column as AgColumn | null | undefined;
        let { anchorToElement, value } = params;

        if (rowNode && column && value == null) {
            value = this.valueSvc.getValueForDisplay(column, rowNode);
        }

        if (anchorToElement == null) {
            anchorToElement = this.getContextMenuAnchorElement(rowNode, column);
        }

        this.onContextMenu(
            (params as MouseShowContextMenuParams).mouseEvent ?? null,
            (params as TouchShowContextMenuParam).touchEvent ?? null,
            rowNode ?? null,
            column ?? null,
            value,
            anchorToElement
        );
    }

    public handleContextMenuMouseEvent(
        mouseEvent: MouseEvent | undefined,
        touchEvent: TouchEvent | undefined,
        rowComp: RowCtrl | null,
        cellCtrl: CellCtrl
    ): void {
        const rowNode = rowComp ? rowComp.getRowNode() : null;
        const column = cellCtrl ? cellCtrl.getColumn() : null;
        let value = null;

        if (column) {
            const event = mouseEvent ? mouseEvent : touchEvent;
            cellCtrl.dispatchCellContextMenuEvent(event ?? null);
            value = this.valueSvc.getValue(column, rowNode);
        }

        // if user clicked on a cell, anchor to that cell, otherwise anchor to the grid panel
        const gridBodyCon = this.ctrlsSvc.getGridBodyCtrl();
        const anchorToElement = cellCtrl ? cellCtrl.getGui() : gridBodyCon.getGridBodyElement();

        this.showContextMenu({
            mouseEvent,
            touchEvent,
            rowNode,
            column,
            value,
            anchorToElement,
        } as EventShowContextMenuParams);
    }

    private onContextMenu(
        mouseEvent: MouseEvent | null,
        touchEvent: TouchEvent | null,
        rowNode: RowNode | null,
        column: AgColumn | null,
        value: any,
        anchorToElement: HTMLElement
    ): void {
        this.menuUtils.onContextMenu(mouseEvent, touchEvent, (eventOrTouch) =>
            this.showMenu(rowNode, column, value, eventOrTouch, anchorToElement)
        );
    }

    private showMenu(
        node: RowNode | null,
        column: AgColumn | null,
        value: any,
        mouseEvent: MouseEvent | Touch,
        anchorToElement: HTMLElement
    ): boolean {
        const menuItems = this.getMenuItems(node, column, value);
        const eGridBodyGui = this.ctrlsSvc.getGridBodyCtrl().getGui();

        if (menuItems === undefined || !menuItems?.length) {
            return false;
        }

        const menu = new ContextMenu(menuItems, column, node, value);
        this.createBean(menu);

        const eMenuGui = menu.getGui();

        if (!column) {
            // the context menu has been opened not on a cell, therefore we don't want to
            // display the previous cell as focused, or return focus there after
            this.focusSvc.clearFocusedCell();
        }

        const positionParams = {
            column: column,
            rowNode: node,
            type: 'contextMenu',
            mouseEvent: mouseEvent,
            ePopup: eMenuGui,
            // move one pixel away so that accidentally double clicking
            // won't show the browser's contextmenu
            nudgeY: 1,
        };

        const translate = this.getLocaleTextFunc();

        const addPopupRes = this.popupSvc.addPopup({
            modal: true,
            eChild: eMenuGui,
            closeOnEsc: true,
            closedCallback: (e) => {
                eGridBodyGui.classList.remove(CSS_CONTEXT_MENU_OPEN);
                this.destroyBean(menu);
                this.dispatchVisibleChangedEvent(false, e === undefined ? 'api' : 'ui');
            },
            click: mouseEvent,
            positionCallback: () => {
                const isRtl = this.gos.get('enableRtl');
                this.popupSvc.positionPopupUnderMouseEvent({
                    ...positionParams,
                    nudgeX: isRtl ? (eMenuGui.offsetWidth + 1) * -1 : 1,
                });
            },
            // so when browser is scrolled down, or grid is scrolled, context menu stays with cell
            anchorToElement: anchorToElement,
            ariaLabel: translate('ariaLabelContextMenu', 'Context Menu'),
        });

        if (addPopupRes) {
            eGridBodyGui.classList.add(CSS_CONTEXT_MENU_OPEN);
            menu.afterGuiAttached({ container: 'contextMenu', hidePopup: addPopupRes.hideFunc });
        }

        // there should never be an active menu at this point, however it was found
        // that you could right click a second time just 1 or 2 pixels from the first
        // click, and another menu would pop up. so somehow the logic for closing the
        // first menu (clicking outside should close it) was glitchy somehow. an easy
        // way to avoid this is just remove the old context menu here if it exists.
        if (this.activeMenu) {
            this.hideActiveMenu();
        }

        this.activeMenu = menu;

        menu.addEventListener('destroyed', () => {
            if (this.activeMenu === menu) {
                this.activeMenu = null;
            }
        });

        // hide the popup if something gets selected
        if (addPopupRes) {
            menu.addEventListener('closeMenu', (e: CloseMenuEvent) =>
                addPopupRes.hideFunc({
                    mouseEvent: e.mouseEvent ?? undefined,
                    keyboardEvent: e.keyboardEvent ?? undefined,
                    forceHide: true,
                })
            );
        }

        // we check for a mousedown event because `gridApi.showContextMenu`
        // generates a `mousedown` event to display the context menu.
        const isApi = mouseEvent && mouseEvent instanceof MouseEvent && mouseEvent.type === 'mousedown';
        this.dispatchVisibleChangedEvent(true, isApi ? 'api' : 'ui');

        return true;
    }

    private dispatchVisibleChangedEvent(visible: boolean, source: 'api' | 'ui' = 'ui'): void {
        this.eventSvc.dispatchEvent({
            type: 'contextMenuVisibleChanged',
            visible,
            source,
        });
    }

    private getRowCtrl(rowNode?: RowNode | null): RowCtrl | undefined {
        const { rowIndex, rowPinned } = rowNode || {};

        if (rowIndex == null) {
            return;
        }

        return this.rowRenderer.getRowByPosition({ rowIndex, rowPinned }) || undefined;
    }

    private getCellGui(rowCtrl?: RowCtrl, column?: AgColumn | null): HTMLElement | undefined {
        if (!rowCtrl || !column) {
            return;
        }

        const cellCtrl = rowCtrl.getCellCtrl(column);

        return cellCtrl?.getGui() || undefined;
    }

    private getContextMenuAnchorElement(rowNode?: RowNode | null, column?: AgColumn | null): HTMLElement {
        const gridBodyEl = this.ctrlsSvc.getGridBodyCtrl().getGridBodyElement();
        const rowCtrl = this.getRowCtrl(rowNode);

        if (!rowCtrl) {
            return gridBodyEl;
        }

        const cellGui = this.getCellGui(rowCtrl, column);

        if (cellGui) {
            return cellGui;
        }

        if (rowCtrl.isFullWidth()) {
            return rowCtrl.getFullWidthElement() as HTMLElement;
        }

        return gridBodyEl;
    }
}

export type ContextMenuEvent = 'closeMenu';

class ContextMenu extends Component<ContextMenuEvent> {
    private focusSvc: FocusService;
    private menuItemMapper: MenuItemMapper;

    public wireBeans(beans: BeanCollection): void {
        this.focusSvc = beans.focusSvc;
        this.menuItemMapper = beans.menuItemMapper as MenuItemMapper;
    }

    private menuList: AgMenuList | null = null;
    private focusedCell: CellPosition | null = null;

    constructor(
        private readonly menuItems: (MenuItemDef | string)[],
        private readonly column: AgColumn | null,
        private readonly node: RowNode | null,
        private readonly value: any
    ) {
        super(/* html */ `<div class="${CSS_MENU}" role="presentation"></div>`);
    }

    public postConstruct(): void {
        const menuList = this.createManagedBean(
            new AgMenuList(0, {
                column: this.column,
                node: this.node,
                value: this.value,
            })
        );
        const menuItemsMapped = this.menuItemMapper.mapWithStockItems(
            this.menuItems,
            null,
            () => this.getGui(),
            'contextMenu'
        );

        menuList.addMenuItems(menuItemsMapped);

        this.appendChild(menuList);
        this.menuList = menuList;

        menuList.addEventListener('closeMenu', (e) => this.dispatchLocalEvent(e));
    }

    public afterGuiAttached(params: IAfterGuiAttachedParams): void {
        if (params.hidePopup) {
            this.addDestroyFunc(params.hidePopup);
        }

        this.focusedCell = this.focusSvc.getFocusedCell();

        if (this.menuList) {
            this.focusSvc.focusInto(this.menuList.getGui());
        }
    }

    private restoreFocusedCell(): void {
        const currentFocusedCell = this.focusSvc.getFocusedCell();

        if (currentFocusedCell && this.focusedCell && _areCellsEqual(currentFocusedCell, this.focusedCell)) {
            const { rowIndex, rowPinned, column } = this.focusedCell;

            if (_isNothingFocused(this.gos)) {
                this.focusSvc.setFocusedCell({
                    rowIndex,
                    column,
                    rowPinned,
                    forceBrowserFocus: true,
                    preventScrollOnBrowserFocus: !this.focusSvc.isKeyboardMode(),
                });
            }
        }
    }

    public override destroy(): void {
        this.restoreFocusedCell();
        super.destroy();
    }
}
