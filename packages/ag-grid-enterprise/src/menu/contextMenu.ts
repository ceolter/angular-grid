import type {
    AgColumn,
    CellCtrl,
    CellPosition,
    DefaultMenuItem,
    EventShowContextMenuParams,
    IAfterGuiAttachedParams,
    IContextMenuService,
    MenuItemDef,
    MouseShowContextMenuParams,
    NamedBean,
    RowCtrl,
    RowNode,
    TouchShowContextMenuParam,
} from 'ag-grid-community';
import {
    BeanStub,
    Component,
    _anchorElementToMouseMoveEvent,
    _areCellsEqual,
    _createIconNoSpan,
    _exists,
    _focusInto,
    _getPageBody,
    _getRootNode,
    _isIOSUserAgent,
    _isKeyboardMode,
    _isNothingFocused,
    _isPromise,
    _isVisible,
    _warn,
} from 'ag-grid-community';

import type { CloseMenuEvent } from '../widgets/agMenuItemComponent';
import { AgMenuList } from '../widgets/agMenuList';
import type { MenuItemMapper } from './menuItemMapper';
import type { MenuUtils } from './menuUtils';

const CSS_MENU = 'ag-menu';
const CSS_CONTEXT_MENU_OPEN = 'ag-context-menu-open';
const CSS_CONTEXT_MENU_LOADING_ICON = 'ag-context-menu-loading-icon';

export class ContextMenuService extends BeanStub implements NamedBean, IContextMenuService {
    beanName = 'contextMenuSvc' as const;

    private destroyLoadingSpinner: (() => void) | null = null;
    private lastPromise: number = 0;

    private activeMenu: ContextMenu | null;

    public hideActiveMenu(): void {
        this.destroyBean(this.activeMenu);
    }

    private getMenuItems(
        node: RowNode | null,
        column: AgColumn | null,
        value: any,
        mouseEvent: MouseEvent | Touch
    ): (DefaultMenuItem | MenuItemDef<any, any>)[] | Promise<(DefaultMenuItem | MenuItemDef<any, any>)[]> | undefined {
        const defaultMenuOptions: DefaultMenuItem[] = [];

        const { clipboardSvc, chartSvc, csvCreator, excelCreator, colModel, rangeSvc, gos } = this.beans;

        if (_exists(node) && clipboardSvc) {
            if (column) {
                // only makes sense if column exists, could have originated from a row
                if (!gos.get('suppressCutToClipboard')) {
                    defaultMenuOptions.push('cut');
                }
                defaultMenuOptions.push('copy', 'copyWithHeaders', 'copyWithGroupHeaders', 'paste', 'separator');
            }
        }

        if (gos.get('enableCharts') && chartSvc) {
            if (colModel.isPivotMode()) {
                defaultMenuOptions.push('pivotChart');
            }

            if (rangeSvc && !rangeSvc.isEmpty()) {
                defaultMenuOptions.push('chartRange');
            }
        }

        if (_exists(node)) {
            // if user clicks a cell
            const suppressExcel = gos.get('suppressExcelExport') || !excelCreator;
            const suppressCsv = gos.get('suppressCsvExport') || !csvCreator;
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
                gos.addGridCommonParams({
                    column,
                    node,
                    value,
                    defaultItems,
                    event: mouseEvent,
                })
            );
        }

        const userFunc = gos.getCallback('getContextMenuItems');

        if (userFunc) {
            return userFunc({ column, node, value, defaultItems, event: mouseEvent });
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
            value = this.beans.valueSvc.getValueForDisplay(column, rowNode);
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
        const rowNode = rowComp?.rowNode ?? null;
        const column = cellCtrl?.column ?? null;
        let value = null;
        const { valueSvc, ctrlsSvc } = this.beans;

        if (column) {
            const event = mouseEvent ? mouseEvent : touchEvent;
            cellCtrl.dispatchCellContextMenuEvent(event ?? null);
            value = valueSvc.getValue(column, rowNode);
        }

        // if user clicked on a cell, anchor to that cell, otherwise anchor to the grid panel
        const gridBodyCon = ctrlsSvc.getGridBodyCtrl();
        const anchorToElement = cellCtrl ? cellCtrl.eGui : gridBodyCon.eGridBody;

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
        (this.beans.menuUtils as MenuUtils).onContextMenu(mouseEvent, touchEvent, (eventOrTouch) =>
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
        const menuItems = this.getMenuItems(node, column, value, mouseEvent);

        if (_isPromise<(DefaultMenuItem | MenuItemDef)[]>(menuItems)) {
            const currentPromise = this.lastPromise + 1;
            this.lastPromise = currentPromise;
            if (!this.destroyLoadingSpinner) {
                this.createLoadingIcon(mouseEvent);
            }

            menuItems.then((menuItems) => {
                if (this.lastPromise !== currentPromise) {
                    return;
                }

                const shouldShowMenu =
                    // check if there are actual menu items to be displayed
                    menuItems &&
                    menuItems.length &&
                    // check if the element that triggered the context menu was removed from the DOM
                    _isVisible(mouseEvent.target as HTMLElement) &&
                    // overlay was displayed
                    !this.beans.overlays?.isExclusive();

                if (shouldShowMenu) {
                    this.createContextMenu({ menuItems, node, column, value, mouseEvent, anchorToElement });
                }

                if (this.destroyLoadingSpinner) {
                    this.destroyLoadingSpinner();
                }
            });
            return true;
        }

        if (menuItems === undefined || !menuItems?.length) {
            return false;
        }

        this.createContextMenu({ menuItems, node, column, value, mouseEvent, anchorToElement });

        return true;
    }

    private createLoadingIcon(mouseEvent: MouseEvent | Touch) {
        const { beans } = this;
        const translate = this.getLocaleTextFunc();
        const loadingIcon = _createIconNoSpan('loadingMenuItems', beans) as HTMLElement;
        const wrapperEl = document.createElement('div');
        wrapperEl.classList.add(CSS_CONTEXT_MENU_LOADING_ICON);
        wrapperEl.appendChild(loadingIcon);

        const rootNode = _getRootNode(beans);
        const targetEl = _getPageBody(beans);

        if (!targetEl) {
            _warn(54);
            return;
        }

        targetEl.appendChild(wrapperEl);
        beans.ariaAnnounce?.announceValue(
            translate('ariaLabelLoadingContextMenu', 'Loading Context Menu'),
            'contextmenu'
        );
        beans.environment.applyThemeClasses(wrapperEl);
        _anchorElementToMouseMoveEvent(wrapperEl, mouseEvent, beans);

        const mouseMoveCallback = (e: MouseEvent) => {
            _anchorElementToMouseMoveEvent(wrapperEl, e, beans);
        };

        rootNode.addEventListener('mousemove', mouseMoveCallback);

        this.destroyLoadingSpinner = () => {
            rootNode.removeEventListener('mousemove', mouseMoveCallback);
            targetEl.removeChild(wrapperEl);
            this.destroyLoadingSpinner = null;
        };
    }

    private createContextMenu(params: {
        menuItems: (DefaultMenuItem | MenuItemDef<any, any>)[];
        node: RowNode | null;
        column: AgColumn | null;
        value: any;
        mouseEvent: MouseEvent | Touch;
        anchorToElement: HTMLElement;
    }): void {
        const { menuItems, node, column, value, mouseEvent, anchorToElement } = params;
        const { ctrlsSvc, focusSvc, popupSvc } = this.beans;

        const eGridBodyGui = ctrlsSvc.getGridBodyCtrl().eGridBody;
        const menu = new ContextMenu(menuItems, column, node, value);
        this.createBean(menu);

        const eMenuGui = menu.getGui();

        if (!column) {
            // the context menu has been opened not on a cell, therefore we don't want to
            // display the previous cell as focused, or return focus there after
            focusSvc.clearFocusedCell();
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

        const addPopupRes = popupSvc!.addPopup({
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
                popupSvc!.positionPopupUnderMouseEvent({
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

        return this.beans.rowRenderer.getRowByPosition({ rowIndex, rowPinned }) || undefined;
    }

    private getCellGui(rowCtrl?: RowCtrl, column?: AgColumn | null): HTMLElement | undefined {
        if (!rowCtrl || !column) {
            return;
        }

        const cellCtrl = rowCtrl.getCellCtrl(column);

        return cellCtrl?.eGui || undefined;
    }

    private getContextMenuAnchorElement(rowNode?: RowNode | null, column?: AgColumn | null): HTMLElement {
        const gridBodyEl = this.beans.ctrlsSvc.getGridBodyCtrl().eGridBody;
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

    public override destroy(): void {
        this.destroyLoadingSpinner?.();
        super.destroy();
    }
}

export type ContextMenuEvent = 'closeMenu';

class ContextMenu extends Component<ContextMenuEvent> {
    private menuList: AgMenuList | null = null;
    private focusedCell: CellPosition | null = null;

    constructor(
        private readonly menuItems: (MenuItemDef | DefaultMenuItem)[],
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
        const menuItemsMapped = (this.beans.menuItemMapper as MenuItemMapper).mapWithStockItems(
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

        this.focusedCell = this.beans.focusSvc.getFocusedCell();

        const menuList = this.menuList;
        if (menuList) {
            _focusInto(menuList.getGui());
        }
    }

    private restoreFocusedCell(): void {
        const { beans, focusedCell } = this;
        const focusSvc = beans.focusSvc;
        const currentFocusedCell = focusSvc.getFocusedCell();

        if (currentFocusedCell && focusedCell && _areCellsEqual(currentFocusedCell, focusedCell)) {
            const { rowIndex, rowPinned, column } = focusedCell;

            if (_isNothingFocused(beans)) {
                focusSvc.setFocusedCell({
                    rowIndex,
                    column,
                    rowPinned,
                    forceBrowserFocus: true,
                    preventScrollOnBrowserFocus: !_isKeyboardMode(),
                });
            }
        }
    }

    public override destroy(): void {
        this.restoreFocusedCell();
        super.destroy();
    }
}
