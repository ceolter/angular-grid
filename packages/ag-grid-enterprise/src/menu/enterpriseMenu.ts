import type {
    AgColumn,
    AgEvent,
    AgProvidedColumnGroup,
    Bean,
    ColumnMenuTab,
    ComponentEvent,
    ContainerType,
    DefaultMenuItem,
    IAfterGuiAttachedParams,
    IMenuFactory,
    MenuItemDef,
    NamedBean,
    PopupEventParams,
} from 'ag-grid-community';
import {
    AgPromise,
    BeanStub,
    Component,
    FilterWrapperComp,
    RefPlaceholder,
    _createIconNoSpan,
    _error,
    _focusInto,
    _isColumnMenuAnchoringEnabled,
    _isLegacyMenuEnabled,
    _setColMenuVisible,
    _warn,
    isColumn,
} from 'ag-grid-community';

import type { CloseMenuEvent } from '../widgets/agMenuItemComponent';
import type { AgMenuList } from '../widgets/agMenuList';
import type { TabbedItem } from '../widgets/iTabbedLayout';
import { TabbedLayout } from '../widgets/tabbedLayout';
import type { ColumnChooserFactory } from './columnChooserFactory';
import type { ColumnMenuFactory } from './columnMenuFactory';
import type { MenuRestoreFocusParams, MenuUtils } from './menuUtils';

export interface TabSelectedEvent extends AgEvent<'tabSelected'> {
    key: string;
}

interface EnterpriseColumnMenu extends Bean {
    getGui(): HTMLElement;
    showTab?(tab: string): void;
    afterGuiAttached(params?: IAfterGuiAttachedParams): void;
    showTabBasedOnPreviousSelection?(): void;
}

const TAB_FILTER = 'filterMenuTab' as const;
const TAB_GENERAL = 'generalMenuTab' as const;
const TAB_COLUMNS = 'columnsMenuTab' as const;
const TABS_DEFAULT: ColumnMenuTab[] = [TAB_GENERAL, TAB_FILTER, TAB_COLUMNS];

export class EnterpriseMenuFactory extends BeanStub implements NamedBean, IMenuFactory {
    beanName = 'enterpriseMenuFactory' as const;

    private lastSelectedTab: string;
    private activeMenu: EnterpriseColumnMenu | null;

    public hideActiveMenu(): void {
        this.destroyBean(this.activeMenu);
    }

    public showMenuAfterMouseEvent(
        columnOrGroup: AgColumn | AgProvidedColumnGroup | undefined,
        mouseEvent: MouseEvent | Touch,
        containerType: ContainerType,
        onClosedCallback?: () => void,
        filtersOnly?: boolean
    ): void {
        const { column, columnGroup } = this.splitColumnOrGroup(columnOrGroup);
        const defaultTab = filtersOnly ? 'filterMenuTab' : undefined;
        this.showMenu(
            column,
            columnGroup,
            (menu: EnterpriseColumnMenu) => {
                const ePopup = menu.getGui();

                this.beans.popupSvc!.positionPopupUnderMouseEvent({
                    type: containerType,
                    column,
                    mouseEvent,
                    ePopup,
                });

                if (defaultTab) {
                    menu.showTab?.(defaultTab);
                }
                this.dispatchVisibleChangedEvent(true, false, column, columnGroup, defaultTab);
            },
            containerType,
            defaultTab,
            undefined,
            mouseEvent.target as HTMLElement,
            onClosedCallback
        );
    }

    private splitColumnOrGroup(columnOrGroup: AgColumn | AgProvidedColumnGroup | undefined): {
        column: AgColumn | undefined;
        columnGroup: AgProvidedColumnGroup | undefined;
    } {
        const colIsColumn = columnOrGroup && isColumn(columnOrGroup);
        const column = colIsColumn ? columnOrGroup : undefined;
        const columnGroup = colIsColumn ? undefined : columnOrGroup;
        return { column, columnGroup };
    }

    public showMenuAfterButtonClick(
        columnOrGroup: AgColumn | AgProvidedColumnGroup | undefined,
        eventSource: HTMLElement,
        containerType: ContainerType,
        onClosedCallback?: () => void,
        filtersOnly?: boolean
    ): void {
        let multiplier = -1;
        let alignSide: 'left' | 'right' = 'left';

        if (this.gos.get('enableRtl')) {
            multiplier = 1;
            alignSide = 'right';
        }

        const defaultTab: ColumnMenuTab | undefined = filtersOnly ? 'filterMenuTab' : undefined;
        const restrictToTabs = defaultTab ? [defaultTab] : undefined;

        const isLegacyMenuEnabled = _isLegacyMenuEnabled(this.gos);
        const nudgeX = (isLegacyMenuEnabled ? 9 : 4) * multiplier;
        const nudgeY = isLegacyMenuEnabled ? -23 : 4;

        const { column, columnGroup } = this.splitColumnOrGroup(columnOrGroup);

        this.showMenu(
            column,
            columnGroup,
            (menu: EnterpriseColumnMenu) => {
                const ePopup = menu.getGui();

                this.beans.popupSvc!.positionPopupByComponent({
                    type: containerType,
                    column,
                    eventSource,
                    ePopup,
                    alignSide,
                    nudgeX,
                    nudgeY,
                    position: 'under',
                    keepWithinBounds: true,
                });

                if (defaultTab) {
                    menu.showTab?.(defaultTab);
                }
                this.dispatchVisibleChangedEvent(true, false, column, columnGroup, defaultTab);
            },
            containerType,
            defaultTab,
            restrictToTabs,
            eventSource,
            onClosedCallback
        );
    }

    private showMenu(
        column: AgColumn | undefined,
        columnGroup: AgProvidedColumnGroup | undefined,
        positionCallback: (menu: EnterpriseColumnMenu) => void,
        containerType: ContainerType,
        defaultTab?: string,
        restrictToTabs?: ColumnMenuTab[],
        eventSource?: HTMLElement,
        onClosedCallback?: () => void
    ): void {
        const menuParams = this.getMenuParams(column, columnGroup, restrictToTabs, eventSource);
        if (!menuParams) {
            // can't create menu
            return;
        }
        const { menu, eMenuGui, anchorToElement, restoreFocusParams } = menuParams;
        const closedFuncs: ((e?: Event) => void)[] = [];
        const { menuUtils, popupSvc } = this.beans;

        closedFuncs.push((e) => {
            const eComp = menu.getGui();
            this.destroyBean(menu);
            if (column) {
                _setColMenuVisible(column, false, 'contextMenu');
                // if we don't have a column, then the menu wasn't launched via keyboard navigation
                (menuUtils as MenuUtils).restoreFocusOnClose(restoreFocusParams, eComp, e);
            }
            onClosedCallback?.();
        });

        const translate = this.getLocaleTextFunc();

        // need to show filter before positioning, as only after filter
        // is visible can we find out what the width of it is
        popupSvc!.addPopup({
            modal: true,
            eChild: eMenuGui,
            closeOnEsc: true,
            closedCallback: (e?: Event) => {
                // menu closed callback
                closedFuncs.forEach((f) => f(e));
                this.dispatchVisibleChangedEvent(false, false, column, columnGroup, defaultTab);
            },
            afterGuiAttached: (params) =>
                menu.afterGuiAttached(Object.assign({}, { container: containerType }, params)),
            // if defaultTab is not present, positionCallback will be called
            // after `showTabBasedOnPreviousSelection` is called.
            positionCallback: defaultTab ? () => positionCallback(menu) : undefined,
            ariaLabel: translate('ariaLabelColumnMenu', 'Column Menu'),
        });

        if (!defaultTab) {
            menu.showTabBasedOnPreviousSelection?.();
            // reposition the menu because the method above could load
            // an element that is bigger than enterpriseMenu header.
            positionCallback(menu);
        }

        if (_isColumnMenuAnchoringEnabled(this.gos)) {
            // if user starts showing / hiding columns, or otherwise move the underlying column
            // for this menu, we want to stop tracking the menu with the column position. otherwise
            // the menu would move as the user is using the columns tab inside the menu.
            const stopAnchoringPromise = popupSvc!.setPopupPositionRelatedToElement(eMenuGui, anchorToElement);

            if (stopAnchoringPromise && column) {
                this.addStopAnchoring(stopAnchoringPromise, column, closedFuncs);
            }
        }

        menu.addEventListener('tabSelected', (event: any) => {
            this.dispatchVisibleChangedEvent(false, true, column);
            this.lastSelectedTab = event.key;
            this.dispatchVisibleChangedEvent(true, true, column);
        });

        if (column) {
            _setColMenuVisible(column, true, 'contextMenu');
        }

        this.activeMenu = menu;

        menu.addEventListener('destroyed', () => {
            if (this.activeMenu === menu) {
                this.activeMenu = null;
            }
        });
    }

    private addStopAnchoring(
        stopAnchoringPromise: AgPromise<() => void>,
        column: AgColumn,
        closedFuncsArr: (() => void)[]
    ) {
        stopAnchoringPromise.then((stopAnchoringFunc: () => void) => {
            column.addEventListener('leftChanged', stopAnchoringFunc);
            column.addEventListener('visibleChanged', stopAnchoringFunc);

            closedFuncsArr.push(() => {
                column.removeEventListener('leftChanged', stopAnchoringFunc);
                column.removeEventListener('visibleChanged', stopAnchoringFunc);
            });
        });
    }

    private getMenuParams(
        column?: AgColumn,
        columnGroup?: AgProvidedColumnGroup,
        restrictToTabs?: ColumnMenuTab[],
        eventSource?: HTMLElement
    ) {
        const { focusSvc, visibleCols, ctrlsSvc } = this.beans;
        const restoreFocusParams = {
            column,
            headerPosition: focusSvc.focusedHeader,
            columnIndex: visibleCols.allCols.indexOf(column as AgColumn),
            eventSource,
        };
        const menu = this.createMenu(column, columnGroup, restoreFocusParams, restrictToTabs, eventSource);
        return menu
            ? {
                  menu,
                  eMenuGui: menu.getGui(),
                  anchorToElement: eventSource || ctrlsSvc.getGridBodyCtrl().eGridBody,
                  restoreFocusParams,
              }
            : undefined;
    }

    private createMenu(
        column: AgColumn | undefined,
        columnGroup: AgProvidedColumnGroup | undefined,
        restoreFocusParams: MenuRestoreFocusParams,
        restrictToTabs?: ColumnMenuTab[],
        eventSource?: HTMLElement
    ): (EnterpriseColumnMenu & BeanStub<TabbedColumnMenuEvent | ComponentEvent>) | undefined {
        if (_isLegacyMenuEnabled(this.gos)) {
            return this.createBean(
                new TabbedColumnMenu(column, restoreFocusParams, this.lastSelectedTab, restrictToTabs, eventSource)
            );
        } else {
            const menuItems = (this.beans.colMenuFactory as ColumnMenuFactory).getMenuItems(column, columnGroup);
            return menuItems.length
                ? this.createBean(new ColumnContextMenu(menuItems, column, restoreFocusParams, eventSource))
                : undefined;
        }
    }

    private dispatchVisibleChangedEvent(
        visible: boolean,
        switchingTab: boolean,
        column?: AgColumn,
        columnGroup?: AgProvidedColumnGroup,
        defaultTab?: string
    ): void {
        this.eventSvc.dispatchEvent({
            type: 'columnMenuVisibleChanged',
            visible,
            switchingTab,
            key: (this.lastSelectedTab ??
                defaultTab ??
                (_isLegacyMenuEnabled(this.gos) ? TAB_GENERAL : 'columnMenu')) as any,
            column: column ?? null,
            columnGroup: columnGroup ?? null,
        });
    }

    public isMenuEnabled(column: AgColumn): boolean {
        if (!_isLegacyMenuEnabled(this.gos)) {
            return true;
        }
        // Determine whether there are any tabs to show in the menu, given that the filter tab may be hidden
        const isFilterDisabled = !this.beans.filterManager?.isFilterAllowed(column);
        const tabs = column.getColDef().menuTabs ?? TABS_DEFAULT;
        const numActiveTabs = isFilterDisabled && tabs.includes(TAB_FILTER) ? tabs.length - 1 : tabs.length;
        return numActiveTabs > 0;
    }

    public showMenuAfterContextMenuEvent(
        column: AgColumn | AgProvidedColumnGroup | undefined,
        mouseEvent?: MouseEvent | null,
        touchEvent?: TouchEvent | null
    ): void {
        (this.beans.menuUtils as MenuUtils).onContextMenu(mouseEvent, touchEvent, (eventOrTouch) => {
            this.showMenuAfterMouseEvent(column, eventOrTouch, 'columnMenu');
            return true;
        });
    }
}

type TabbedColumnMenuEvent = 'tabSelected' | 'and';
class TabbedColumnMenu extends BeanStub<TabbedColumnMenuEvent> implements EnterpriseColumnMenu {
    private tabbedLayout: TabbedLayout;
    private hidePopupFunc: (popupParams?: PopupEventParams) => void;
    private mainMenuList: AgMenuList;

    private tabItemFilter: TabbedItem;
    private tabItemGeneral: TabbedItem;
    private tabItemColumns: TabbedItem;

    private tabFactories: { [p: string]: () => TabbedItem } = {};
    private includeChecks: { [p: string]: () => boolean } = {};

    private filterComp?: FilterWrapperComp | null;

    constructor(
        private readonly column: AgColumn | undefined,
        private readonly restoreFocusParams: MenuRestoreFocusParams,
        private readonly initialSelection: string,
        private readonly restrictTo?: ColumnMenuTab[],
        private readonly sourceElement?: HTMLElement
    ) {
        super();
        const { tabFactories, includeChecks } = this;
        tabFactories[TAB_GENERAL] = this.createMainPanel.bind(this);
        tabFactories[TAB_FILTER] = this.createFilterPanel.bind(this);
        tabFactories[TAB_COLUMNS] = this.createColumnsPanel.bind(this);

        includeChecks[TAB_GENERAL] = () => true;
        includeChecks[TAB_FILTER] = () => (column ? !!this.beans.filterManager?.isFilterAllowed(column) : false);
        includeChecks[TAB_COLUMNS] = () => true;
    }

    public postConstruct(): void {
        const tabs = this.getTabsToCreate().map((name) => this.createTab(name));

        const tabbedLayout = new TabbedLayout({
            items: tabs,
            cssClass: 'ag-menu',
            onActiveItemClicked: this.onHidePopup.bind(this),
            onItemClicked: this.onTabItemClicked.bind(this),
        });
        this.tabbedLayout = this.createBean(tabbedLayout);

        this.mainMenuList?.setParentComponent(tabbedLayout);

        this.addDestroyFunc(() => this.destroyBean(tabbedLayout));
    }

    private getTabsToCreate() {
        if (this.restrictTo) {
            return this.restrictTo;
        }

        return (this.column?.getColDef().menuTabs ?? TABS_DEFAULT).filter(
            (tabName) => this.isValidMenuTabItem(tabName) && this.isNotSuppressed(tabName)
        );
    }

    private isValidMenuTabItem(menuTabName: ColumnMenuTab): boolean {
        let isValid: boolean = true;
        let itemsToConsider = TABS_DEFAULT;

        if (this.restrictTo != null) {
            isValid = this.restrictTo.indexOf(menuTabName) > -1;
            itemsToConsider = this.restrictTo;
        }

        isValid = isValid && TABS_DEFAULT.indexOf(menuTabName) > -1;

        if (!isValid) {
            _warn(175, { menuTabName, itemsToConsider });
        }

        return isValid;
    }

    private isNotSuppressed(menuTabName: string): boolean {
        return this.includeChecks[menuTabName]();
    }

    private createTab(name: string): TabbedItem {
        return this.tabFactories[name]();
    }

    public showTabBasedOnPreviousSelection(): void {
        // show the tab the user was on last time they had a menu open
        this.showTab(this.initialSelection);
    }

    public showTab(toShow: string) {
        const { tabItemColumns, tabbedLayout, tabItemFilter, tabItemGeneral } = this;
        if (tabItemColumns && toShow === TAB_COLUMNS) {
            tabbedLayout.showItem(tabItemColumns);
        } else if (tabItemFilter && toShow === TAB_FILTER) {
            tabbedLayout.showItem(tabItemFilter);
        } else if (tabItemGeneral && toShow === TAB_GENERAL) {
            tabbedLayout.showItem(tabItemGeneral);
        } else {
            tabbedLayout.showFirstItem();
        }
    }

    private onTabItemClicked(event: { item: TabbedItem }): void {
        let key: string | null = null;

        switch (event.item) {
            case this.tabItemColumns:
                key = TAB_COLUMNS;
                break;
            case this.tabItemFilter:
                key = TAB_FILTER;
                break;
            case this.tabItemGeneral:
                key = TAB_GENERAL;
                break;
        }

        if (key) {
            this.activateTab(key);
        }
    }

    private activateTab(tab: string): void {
        const ev: TabSelectedEvent = {
            type: 'tabSelected',
            key: tab,
        };
        this.dispatchLocalEvent(ev);
    }

    private createMainPanel(): TabbedItem {
        const { beans, column } = this;
        const colMenuFactory = beans.colMenuFactory as ColumnMenuFactory;
        const mainMenuList = colMenuFactory.createMenu(
            this,
            colMenuFactory.getMenuItems(column),
            this.column,
            () => this.sourceElement ?? this.getGui()
        );
        this.mainMenuList = mainMenuList;
        mainMenuList.addEventListener('closeMenu', this.onHidePopup.bind(this));

        const tabItemGeneral = {
            title: _createIconNoSpan('legacyMenu', beans, column)!,
            titleLabel: TAB_GENERAL.replace('MenuTab', ''),
            bodyPromise: AgPromise.resolve(mainMenuList.getGui()),
            name: TAB_GENERAL,
        };
        this.tabItemGeneral = tabItemGeneral;

        return tabItemGeneral;
    }

    private onHidePopup(event?: CloseMenuEvent): void {
        (this.beans.menuUtils as MenuUtils).closePopupAndRestoreFocusOnSelect(
            this.hidePopupFunc,
            this.restoreFocusParams,
            event
        );
    }

    private createFilterPanel(): TabbedItem {
        const comp = this.column ? this.createBean(new FilterWrapperComp(this.column, 'COLUMN_MENU')) : null;
        this.filterComp = comp;
        if (!comp?.hasFilter()) {
            _error(119);
        }

        const afterAttachedCallback = (params: IAfterGuiAttachedParams) => comp?.afterGuiAttached(params);

        const afterDetachedCallback = () => comp?.afterGuiDetached();

        this.tabItemFilter = {
            title: _createIconNoSpan('filterTab', this.beans, this.column)!,
            titleLabel: TAB_FILTER.replace('MenuTab', ''),
            bodyPromise: AgPromise.resolve(comp?.getGui()) as AgPromise<HTMLElement>,
            afterAttachedCallback,
            afterDetachedCallback,
            name: TAB_FILTER,
        };

        return this.tabItemFilter;
    }

    private createColumnsPanel(): TabbedItem {
        const eWrapperDiv = document.createElement('div');
        eWrapperDiv.classList.add('ag-menu-column-select-wrapper');

        const { beans, column } = this;
        const columnSelectPanel = (beans.colChooserFactory as ColumnChooserFactory).createColumnSelectPanel(
            this,
            column
        );

        const columnSelectPanelGui = columnSelectPanel.getGui();
        columnSelectPanelGui.classList.add('ag-menu-column-select');
        eWrapperDiv.appendChild(columnSelectPanelGui);

        const tabItemColumns = {
            title: _createIconNoSpan('columns', beans, column)!, //createColumnsIcon(),
            titleLabel: TAB_COLUMNS.replace('MenuTab', ''),
            bodyPromise: AgPromise.resolve(eWrapperDiv),
            name: TAB_COLUMNS,
        };
        this.tabItemColumns = tabItemColumns;

        return tabItemColumns;
    }

    public afterGuiAttached(params: IAfterGuiAttachedParams): void {
        const { container, hidePopup } = params;

        this.tabbedLayout.setAfterAttachedParams({ container, hidePopup });

        if (hidePopup) {
            this.hidePopupFunc = hidePopup;
            this.addDestroyFunc(hidePopup);
        }
    }

    public getGui(): HTMLElement {
        return this.tabbedLayout.getGui();
    }

    public override destroy(): void {
        super.destroy();
        // Needs to be destroyed last to ensure that `afterGuiDetached` runs
        this.destroyBean(this.filterComp);
    }
}

class ColumnContextMenu extends Component implements EnterpriseColumnMenu {
    private readonly eColumnMenu: HTMLElement = RefPlaceholder;

    private hidePopupFunc: (popupParams?: PopupEventParams) => void;
    private mainMenuList: AgMenuList;

    constructor(
        private readonly menuItems: (DefaultMenuItem | MenuItemDef)[],
        private readonly column: AgColumn | undefined,
        private readonly restoreFocusParams: MenuRestoreFocusParams,
        private readonly sourceElement?: HTMLElement
    ) {
        super(/* html */ `
            <div data-ref="eColumnMenu" role="presentation" class="ag-menu ag-column-menu"></div>
        `);
    }

    public postConstruct(): void {
        const mainMenuList = (this.beans.colMenuFactory as ColumnMenuFactory).createMenu(
            this,
            this.menuItems,
            this.column,
            () => this.sourceElement ?? this.getGui()
        );
        this.mainMenuList = mainMenuList;
        mainMenuList.addEventListener('closeMenu', this.onHidePopup.bind(this));
        this.eColumnMenu.appendChild(mainMenuList.getGui());
    }

    private onHidePopup(event?: CloseMenuEvent): void {
        (this.beans.menuUtils as MenuUtils).closePopupAndRestoreFocusOnSelect(
            this.hidePopupFunc,
            this.restoreFocusParams,
            event
        );
    }

    public afterGuiAttached({ hidePopup }: IAfterGuiAttachedParams): void {
        if (hidePopup) {
            this.hidePopupFunc = hidePopup;
            this.addDestroyFunc(hidePopup);
        }
        _focusInto(this.mainMenuList.getGui());
    }
}
