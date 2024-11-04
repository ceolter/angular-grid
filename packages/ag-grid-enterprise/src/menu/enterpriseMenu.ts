import type {
    AgColumn,
    AgEvent,
    AgProvidedColumnGroup,
    Bean,
    BeanCollection,
    ColumnMenuTab,
    ComponentEvent,
    ContainerType,
    CtrlsService,
    FilterManager,
    FocusService,
    IAfterGuiAttachedParams,
    IMenuFactory,
    MenuItemDef,
    MenuService,
    NamedBean,
    PopupEventParams,
    PopupService,
    VisibleColsService,
} from 'ag-grid-community';
import {
    AgPromise,
    BeanStub,
    Component,
    FilterWrapperComp,
    RefPlaceholder,
    _createIconNoSpan,
    _isColumnMenuAnchoringEnabled,
    _isLegacyMenuEnabled,
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

    private popupSvc: PopupService;
    private focusSvc: FocusService;
    private ctrlsSvc: CtrlsService;
    private visibleCols: VisibleColsService;
    private filterManager?: FilterManager;
    private menuUtils: MenuUtils;
    private menuSvc: MenuService;
    private colMenuFactory: ColumnMenuFactory;

    public wireBeans(beans: BeanCollection) {
        this.popupSvc = beans.popupSvc!;
        this.focusSvc = beans.focusSvc;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.visibleCols = beans.visibleCols;
        this.filterManager = beans.filterManager;
        this.menuUtils = beans.menuUtils as MenuUtils;
        this.menuSvc = beans.menuSvc!;
        this.colMenuFactory = beans.colMenuFactory as ColumnMenuFactory;
    }

    private lastSelectedTab: string;
    private activeMenu: EnterpriseColumnMenu | null;

    public hideActiveMenu(): void {
        this.destroyBean(this.activeMenu);
    }

    public showMenuAfterMouseEvent(
        columnOrGroup: AgColumn | AgProvidedColumnGroup | undefined,
        mouseEvent: MouseEvent | Touch,
        containerType: ContainerType,
        filtersOnly?: boolean
    ): void {
        const { column, columnGroup } = this.splitColumnOrGroup(columnOrGroup);
        const defaultTab = filtersOnly ? 'filterMenuTab' : undefined;
        this.showMenu(
            column,
            columnGroup,
            (menu: EnterpriseColumnMenu) => {
                const ePopup = menu.getGui();

                this.popupSvc.positionPopupUnderMouseEvent({
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
            mouseEvent.target as HTMLElement
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

                this.popupSvc.positionPopupByComponent({
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
            eventSource
        );
    }

    private showMenu(
        column: AgColumn | undefined,
        columnGroup: AgProvidedColumnGroup | undefined,
        positionCallback: (menu: EnterpriseColumnMenu) => void,
        containerType: ContainerType,
        defaultTab?: string,
        restrictToTabs?: ColumnMenuTab[],
        eventSource?: HTMLElement
    ): void {
        const menuParams = this.getMenuParams(column, columnGroup, restrictToTabs, eventSource);
        if (!menuParams) {
            // can't create menu
            return;
        }
        const { menu, eMenuGui, anchorToElement, restoreFocusParams } = menuParams;
        const closedFuncs: ((e?: Event) => void)[] = [];

        closedFuncs.push((e) => {
            const eComp = menu.getGui();
            this.destroyBean(menu);
            if (column) {
                column.setMenuVisible(false, 'contextMenu');
                // if we don't have a column, then the menu wasn't launched via keyboard navigation
                this.menuUtils.restoreFocusOnClose(restoreFocusParams, eComp, e);
            }
        });

        const translate = this.getLocaleTextFunc();

        // need to show filter before positioning, as only after filter
        // is visible can we find out what the width of it is
        this.popupSvc.addPopup({
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
            const stopAnchoringPromise = this.popupSvc.setPopupPositionRelatedToElement(eMenuGui, anchorToElement);

            if (stopAnchoringPromise && column) {
                this.addStopAnchoring(stopAnchoringPromise, column, closedFuncs);
            }
        }

        menu.addEventListener('tabSelected', (event: any) => {
            this.dispatchVisibleChangedEvent(false, true, column);
            this.lastSelectedTab = event.key;
            this.dispatchVisibleChangedEvent(true, true, column);
        });

        column?.setMenuVisible(true, 'contextMenu');

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
        const restoreFocusParams = {
            column,
            headerPosition: this.focusSvc.getFocusedHeader(),
            columnIndex: this.visibleCols.allCols.indexOf(column as AgColumn),
            eventSource,
        };
        const menu = this.createMenu(column, columnGroup, restoreFocusParams, restrictToTabs, eventSource);
        return menu
            ? {
                  menu,
                  eMenuGui: menu.getGui(),
                  anchorToElement: eventSource || this.ctrlsSvc.getGridBodyCtrl().getGui(),
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
            const menuItems = this.colMenuFactory.getMenuItems(column, columnGroup);
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
        const isFilterDisabled = !this.filterManager?.isFilterAllowed(column);
        const tabs = column.getColDef().menuTabs ?? TABS_DEFAULT;
        const numActiveTabs = isFilterDisabled && tabs.includes(TAB_FILTER) ? tabs.length - 1 : tabs.length;
        return numActiveTabs > 0;
    }

    public showMenuAfterContextMenuEvent(
        column: AgColumn | AgProvidedColumnGroup | undefined,
        mouseEvent?: MouseEvent | null,
        touchEvent?: TouchEvent | null
    ): void {
        this.menuUtils.onContextMenu(mouseEvent, touchEvent, (eventOrTouch) => {
            this.showMenuAfterMouseEvent(column, eventOrTouch, 'columnMenu');
            return true;
        });
    }
}

type TabbedColumnMenuEvent = 'tabSelected' | 'and';
class TabbedColumnMenu extends BeanStub<TabbedColumnMenuEvent> implements EnterpriseColumnMenu {
    private filterManager?: FilterManager;
    private colChooserFactory: ColumnChooserFactory;
    private colMenuFactory: ColumnMenuFactory;
    private menuUtils: MenuUtils;

    public wireBeans(beans: BeanCollection): void {
        this.filterManager = beans.filterManager;
        this.colChooserFactory = beans.colChooserFactory as ColumnChooserFactory;
        this.colMenuFactory = beans.colMenuFactory as ColumnMenuFactory;
        this.menuUtils = beans.menuUtils as MenuUtils;
    }

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
        this.tabFactories[TAB_GENERAL] = this.createMainPanel.bind(this);
        this.tabFactories[TAB_FILTER] = this.createFilterPanel.bind(this);
        this.tabFactories[TAB_COLUMNS] = this.createColumnsPanel.bind(this);

        this.includeChecks[TAB_GENERAL] = () => true;
        this.includeChecks[TAB_FILTER] = () => (column ? !!this.filterManager?.isFilterAllowed(column) : false);
        this.includeChecks[TAB_COLUMNS] = () => true;
    }

    public postConstruct(): void {
        const tabs = this.getTabsToCreate().map((name) => this.createTab(name));

        this.tabbedLayout = new TabbedLayout({
            items: tabs,
            cssClass: 'ag-menu',
            onActiveItemClicked: this.onHidePopup.bind(this),
            onItemClicked: this.onTabItemClicked.bind(this),
        });

        this.createBean(this.tabbedLayout);

        if (this.mainMenuList) {
            this.mainMenuList.setParentComponent(this.tabbedLayout);
        }

        this.addDestroyFunc(() => this.destroyBean(this.tabbedLayout));
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
        if (this.tabItemColumns && toShow === TAB_COLUMNS) {
            this.tabbedLayout.showItem(this.tabItemColumns);
        } else if (this.tabItemFilter && toShow === TAB_FILTER) {
            this.tabbedLayout.showItem(this.tabItemFilter);
        } else if (this.tabItemGeneral && toShow === TAB_GENERAL) {
            this.tabbedLayout.showItem(this.tabItemGeneral);
        } else {
            this.tabbedLayout.showFirstItem();
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
        this.mainMenuList = this.colMenuFactory.createMenu(
            this,
            this.colMenuFactory.getMenuItems(this.column),
            this.column,
            () => this.sourceElement ?? this.getGui()
        );
        this.mainMenuList.addEventListener('closeMenu', this.onHidePopup.bind(this));

        this.tabItemGeneral = {
            title: _createIconNoSpan('legacyMenu', this.beans, this.column)!,
            titleLabel: TAB_GENERAL.replace('MenuTab', ''),
            bodyPromise: AgPromise.resolve(this.mainMenuList.getGui()),
            name: TAB_GENERAL,
        };

        return this.tabItemGeneral;
    }

    private onHidePopup(event?: CloseMenuEvent): void {
        this.menuUtils.closePopupAndRestoreFocusOnSelect(this.hidePopupFunc, this.restoreFocusParams, event);
    }

    private createFilterPanel(): TabbedItem {
        const comp = this.column ? this.createBean(new FilterWrapperComp(this.column, 'COLUMN_MENU')) : null;
        this.filterComp = comp;
        if (!comp?.hasFilter()) {
            throw new Error('AG Grid - Unable to instantiate filter');
        }

        const afterAttachedCallback = (params: IAfterGuiAttachedParams) => comp.afterGuiAttached(params);

        const afterDetachedCallback = () => comp.afterGuiDetached();

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

        const columnSelectPanel = this.colChooserFactory.createColumnSelectPanel(this, this.column);

        const columnSelectPanelGui = columnSelectPanel.getGui();
        columnSelectPanelGui.classList.add('ag-menu-column-select');
        eWrapperDiv.appendChild(columnSelectPanelGui);

        this.tabItemColumns = {
            title: _createIconNoSpan('columns', this.beans, this.column)!, //createColumnsIcon(),
            titleLabel: TAB_COLUMNS.replace('MenuTab', ''),
            bodyPromise: AgPromise.resolve(eWrapperDiv),
            name: TAB_COLUMNS,
        };

        return this.tabItemColumns;
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
    private colMenuFactory: ColumnMenuFactory;
    private menuUtils: MenuUtils;
    private focusSvc: FocusService;

    public wireBeans(beans: BeanCollection) {
        this.colMenuFactory = beans.colMenuFactory as ColumnMenuFactory;
        this.menuUtils = beans.menuUtils as MenuUtils;
        this.focusSvc = beans.focusSvc;
    }

    private readonly eColumnMenu: HTMLElement = RefPlaceholder;

    private hidePopupFunc: (popupParams?: PopupEventParams) => void;
    private mainMenuList: AgMenuList;

    constructor(
        private readonly menuItems: (string | MenuItemDef)[],
        private readonly column: AgColumn | undefined,
        private readonly restoreFocusParams: MenuRestoreFocusParams,
        private readonly sourceElement?: HTMLElement
    ) {
        super(/* html */ `
            <div data-ref="eColumnMenu" role="presentation" class="ag-menu ag-column-menu"></div>
        `);
    }

    public postConstruct(): void {
        this.mainMenuList = this.colMenuFactory.createMenu(
            this,
            this.menuItems,
            this.column,
            () => this.sourceElement ?? this.getGui()
        );
        this.mainMenuList.addEventListener('closeMenu', this.onHidePopup.bind(this));
        this.eColumnMenu.appendChild(this.mainMenuList.getGui());
    }

    private onHidePopup(event?: CloseMenuEvent): void {
        this.menuUtils.closePopupAndRestoreFocusOnSelect(this.hidePopupFunc, this.restoreFocusParams, event);
    }

    public afterGuiAttached({ hidePopup }: IAfterGuiAttachedParams): void {
        if (hidePopup) {
            this.hidePopupFunc = hidePopup;
            this.addDestroyFunc(hidePopup);
        }
        this.focusSvc.focusInto(this.mainMenuList.getGui());
    }
}
