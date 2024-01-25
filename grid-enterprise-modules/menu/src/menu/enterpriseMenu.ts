import {
    _,
    AgEvent,
    Autowired,
    Bean,
    BeanStub,
    Column,
    ColumnModel,
    ColumnMenuTab,
    FilterManager,
    FilterWrapper,
    IMenuFactory,
    ModuleNames,
    ModuleRegistry,
    PopupService,
    PostConstruct,
    RefSelector,
    AgPromise,
    TabbedItem,
    TabbedLayout,
    FocusService,
    IAfterGuiAttachedParams,
    ContainerType,
    CtrlsService,
    AgMenuList,
    AgMenuItemComponent,
    MenuItemSelectedEvent,
    PopupEventParams,
    Component
} from '@ag-grid-community/core';
import { ColumnChooserFactory } from './columnChooserFactory';
import { ColumnMenuFactory } from './columnMenuFactory';
import { MenuUtils } from './menuUtils';

export interface TabSelectedEvent extends AgEvent {
    key: string;
}

interface EnterpriseColumnMenu {
    getGui(): HTMLElement;
    showTab?(tab: string): void;
    afterGuiAttached(params?: IAfterGuiAttachedParams): void;
    showTabBasedOnPreviousSelection?(): void;
}

@Bean('enterpriseMenuFactory')
export class EnterpriseMenuFactory extends BeanStub implements IMenuFactory {
    @Autowired('popupService') private readonly popupService: PopupService;
    @Autowired('focusService') private readonly focusService: FocusService;
    @Autowired('ctrlsService') private readonly ctrlsService: CtrlsService;
    @Autowired('columnModel') private readonly columnModel: ColumnModel;
    @Autowired('filterManager') private readonly filterManager: FilterManager;
    @Autowired('menuUtils') private readonly menuUtils: MenuUtils;

    private lastSelectedTab: string;
    private activeMenu: EnterpriseColumnMenu | null;

    public hideActiveMenu(): void {
        this.destroyBean(this.activeMenu);
    }

    public showMenuAfterMouseEvent(column: Column, mouseEvent: MouseEvent | Touch, containerType: ContainerType, filtersOnly?: boolean): void {
        const defaultTab = filtersOnly ? 'filterMenuTab' : undefined;
        this.showMenu(column, (menu: EnterpriseColumnMenu) => {
            const ePopup = menu.getGui();

            this.popupService.positionPopupUnderMouseEvent({
                type: containerType,
                column,
                mouseEvent,
                ePopup
            });

            if (defaultTab) {
                menu.showTab?.(defaultTab);
            }
        }, containerType, defaultTab, undefined, mouseEvent.target as HTMLElement);
    }

    public showMenuAfterButtonClick(column: Column, eventSource: HTMLElement, containerType: ContainerType, filtersOnly?: boolean): void {
        let multiplier = -1;
        let alignSide: 'left' | 'right' = 'left';

        if (this.gridOptionsService.get('enableRtl')) {
            multiplier = 1;
            alignSide = 'right';
        }

        const defaultTab: ColumnMenuTab | undefined = filtersOnly ? 'filterMenuTab' : undefined;
        const restrictToTabs = defaultTab ? [defaultTab] : undefined;

        this.showMenu(column, (menu: EnterpriseColumnMenu) => {
            const ePopup = menu.getGui();

            this.popupService.positionPopupByComponent({
                type: containerType,
                column,
                eventSource,
                ePopup,
                alignSide,
                nudgeX: 9 * multiplier,
                nudgeY: -23,
                position: 'under',
                keepWithinBounds: true,
            });

            if (defaultTab) {
                menu.showTab?.(defaultTab);
            }
        }, containerType, defaultTab, restrictToTabs, eventSource);
    }

    private showMenu(
        column: Column,
        positionCallback: (menu: EnterpriseColumnMenu) => void,
        containerType: ContainerType,
        defaultTab?: string,
        restrictToTabs?: ColumnMenuTab[],
        eventSource?: HTMLElement
    ): void {
        const { menu, eMenuGui, currentHeaderPosition, currentColumnIndex, anchorToElement } = this.getMenuParams(column, restrictToTabs, eventSource);
        const closedFuncs: ((e?: Event) => void)[] = [];

        closedFuncs.push(
            (e) => this.menuUtils.restoreFocusOnClose(column, menu, currentHeaderPosition, currentColumnIndex, eventSource, e)
        );

        const translate = this.localeService.getLocaleTextFunc();

        // need to show filter before positioning, as only after filter
        // is visible can we find out what the width of it is
        const addPopupRes = this.popupService.addPopup({
            modal: true,
            eChild: eMenuGui,
            closeOnEsc: true,
            closedCallback: (e?: Event) => { // menu closed callback
                closedFuncs.forEach(f => f(e));
            },
            afterGuiAttached: params => menu.afterGuiAttached(Object.assign({}, { container: containerType }, params)),
            // if defaultTab is not present, positionCallback will be called
            // after `showTabBasedOnPreviousSelection` is called.
            positionCallback: !!defaultTab ? () => positionCallback(menu) : undefined,
            ariaLabel: translate('ariaLabelColumnMenu', 'Column Menu')
        });

        if (!defaultTab) {
            menu.showTabBasedOnPreviousSelection?.();
            // reposition the menu because the method above could load
            // an element that is bigger than enterpriseMenu header.
            positionCallback(menu);
        }

        // if user starts showing / hiding columns, or otherwise move the underlying column
        // for this menu, we want to stop tracking the menu with the column position. otherwise
        // the menu would move as the user is using the columns tab inside the menu.
        const stopAnchoringPromise = this.popupService.setPopupPositionRelatedToElement(eMenuGui, anchorToElement);

        if (stopAnchoringPromise && column) {
            this.addStopAnchoring(stopAnchoringPromise, column, closedFuncs);
        }

        menu.addEventListener(TabbedColumnMenu.EVENT_TAB_SELECTED, (event: any) => {
            this.lastSelectedTab = event.key;
        });

        column?.setMenuVisible(true, 'contextMenu');

        this.activeMenu = menu;

        menu.addEventListener(BeanStub.EVENT_DESTROYED, () => {
            if (this.activeMenu === menu) {
                this.activeMenu = null;
            }
        });
    }

    private addStopAnchoring(
        stopAnchoringPromise: AgPromise<() => void>,
        column: Column,
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
        column: Column,
        restrictToTabs?: ColumnMenuTab[],
        eventSource?: HTMLElement
    ) {
        const menu = this.createMenu(column, restrictToTabs, eventSource);
        return {
            menu,
            eMenuGui: menu.getGui(),
            currentHeaderPosition: this.focusService.getFocusedHeader(),
            currentColumnIndex: this.columnModel.getAllDisplayedColumns().indexOf(column),
            anchorToElement: eventSource || this.ctrlsService.getGridBodyCtrl().getGui()
        }
    }

    private createMenu(
        column: Column,
        restrictToTabs?: ColumnMenuTab[],
        eventSource?: HTMLElement
    ): (EnterpriseColumnMenu & BeanStub) {
        const menuParams = column ? column.getMenuParams() : this.gridOptionsService.get('defaultColDef')?.menuParams;
        if (menuParams?.enableNewFormat) {
            return this.createBean(new ColumnContextMenu(column, eventSource));
        } else {
            return this.createBean(new TabbedColumnMenu(column, this.lastSelectedTab, restrictToTabs, eventSource));
        }
    }

    public isMenuEnabled(column: Column): boolean {
        if (column?.getMenuParams()?.enableNewFormat) {
            return true;
        }
        // Determine whether there are any tabs to show in the menu, given that the filter tab may be hidden
        const isFilterDisabled = !this.filterManager.isFilterAllowed(column);
        const tabs = column.getColDef().menuTabs ?? TabbedColumnMenu.TABS_DEFAULT;
        const numActiveTabs = isFilterDisabled && tabs.includes(TabbedColumnMenu.TAB_FILTER)
            ? tabs.length - 1
            : tabs.length;
        return numActiveTabs > 0;
    }

    public showMenuAfterContextMenuEvent(column: Column<any>, mouseEvent?: MouseEvent | null, touchEvent?: TouchEvent | null): void {
        this.menuUtils.onContextMenu(mouseEvent, touchEvent, (eventOrTouch) => {
            this.showMenuAfterMouseEvent(column, eventOrTouch, 'columnMenu');
            return true;
        })
    }
}

class TabbedColumnMenu extends BeanStub implements EnterpriseColumnMenu {

    public static EVENT_TAB_SELECTED = 'tabSelected';
    public static TAB_FILTER: 'filterMenuTab' = 'filterMenuTab';
    public static TAB_GENERAL: 'generalMenuTab' = 'generalMenuTab';
    public static TAB_COLUMNS: 'columnsMenuTab' = 'columnsMenuTab';
    public static TABS_DEFAULT: ColumnMenuTab[] = [TabbedColumnMenu.TAB_GENERAL, TabbedColumnMenu.TAB_FILTER, TabbedColumnMenu.TAB_COLUMNS];

    @Autowired('filterManager') private readonly filterManager: FilterManager;
    @Autowired('columnChooserFactory') private readonly columnChooserFactory: ColumnChooserFactory;
    @Autowired('columnMenuFactory') private readonly columnMenuFactory: ColumnMenuFactory;
    @Autowired('menuUtils') private readonly menuUtils: MenuUtils;

    private tabbedLayout: TabbedLayout;
    private hidePopupFunc: (popupParams?: PopupEventParams) => void;
    private column: Column;
    private mainMenuList: AgMenuList;

    private tabItemFilter: TabbedItem;
    private tabItemGeneral: TabbedItem;
    private tabItemColumns: TabbedItem;

    private initialSelection: string;
    private tabFactories: { [p: string]: () => TabbedItem; } = {};
    private includeChecks: { [p: string]: () => boolean; } = {};
    private restrictTo?: ColumnMenuTab[];

    constructor(column: Column, initialSelection: string, restrictTo?: ColumnMenuTab[], private sourceElement?: HTMLElement) {
        super();
        this.column = column;
        this.initialSelection = initialSelection;
        this.tabFactories[TabbedColumnMenu.TAB_GENERAL] = this.createMainPanel.bind(this);
        this.tabFactories[TabbedColumnMenu.TAB_FILTER] = this.createFilterPanel.bind(this);
        this.tabFactories[TabbedColumnMenu.TAB_COLUMNS] = this.createColumnsPanel.bind(this);

        this.includeChecks[TabbedColumnMenu.TAB_GENERAL] = () => true;
        this.includeChecks[TabbedColumnMenu.TAB_FILTER] = () => column ? this.filterManager.isFilterAllowed(column) : false;
        this.includeChecks[TabbedColumnMenu.TAB_COLUMNS] = () => true;
        this.restrictTo = restrictTo;
    }

    @PostConstruct
    public init(): void {
        const tabs = this.getTabsToCreate().map(name => this.createTab(name));

        this.tabbedLayout = new TabbedLayout({
            items: tabs,
            cssClass: 'ag-menu',
            onActiveItemClicked: this.onHidePopup.bind(this),
            onItemClicked: this.onTabItemClicked.bind(this)
        });

        this.createBean(this.tabbedLayout);

        if (this.mainMenuList) {
            this.mainMenuList.setParentComponent(this.tabbedLayout);
        }

        this.addDestroyFunc(() => this.destroyBean(this.tabbedLayout));
    }

    private getTabsToCreate() {
        if (this.restrictTo) { return this.restrictTo; }

        return (this.column?.getColDef().menuTabs ?? TabbedColumnMenu.TABS_DEFAULT)
            .filter(tabName => this.isValidMenuTabItem(tabName))
            .filter(tabName => this.isNotSuppressed(tabName))
            .filter(tabName => this.isModuleLoaded(tabName));
    }

    private isModuleLoaded(menuTabName: string): boolean {
        if (menuTabName === TabbedColumnMenu.TAB_COLUMNS) {
            return ModuleRegistry.__isRegistered(ModuleNames.ColumnsToolPanelModule, this.context.getGridId());
        }

        return true;
    }

    private isValidMenuTabItem(menuTabName: ColumnMenuTab): boolean {
        let isValid: boolean = true;
        let itemsToConsider = TabbedColumnMenu.TABS_DEFAULT;

        if (this.restrictTo != null) {
            isValid = this.restrictTo.indexOf(menuTabName) > -1;
            itemsToConsider = this.restrictTo;
        }

        isValid = isValid && TabbedColumnMenu.TABS_DEFAULT.indexOf(menuTabName) > -1;

        if (!isValid) { console.warn(`AG Grid: Trying to render an invalid menu item '${menuTabName}'. Check that your 'menuTabs' contains one of [${itemsToConsider}]`); }

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
        if (this.tabItemColumns && toShow === TabbedColumnMenu.TAB_COLUMNS) {
            this.tabbedLayout.showItem(this.tabItemColumns);
        } else if (this.tabItemFilter && toShow === TabbedColumnMenu.TAB_FILTER) {
            this.tabbedLayout.showItem(this.tabItemFilter);
        } else if (this.tabItemGeneral && toShow === TabbedColumnMenu.TAB_GENERAL) {
            this.tabbedLayout.showItem(this.tabItemGeneral);
        } else {
            this.tabbedLayout.showFirstItem();
        }
    }

    private onTabItemClicked(event: { item: TabbedItem }): void {
        let key: string | null = null;

        switch (event.item) {
            case this.tabItemColumns: key = TabbedColumnMenu.TAB_COLUMNS; break;
            case this.tabItemFilter: key = TabbedColumnMenu.TAB_FILTER; break;
            case this.tabItemGeneral: key = TabbedColumnMenu.TAB_GENERAL; break;
        }

        if (key) { this.activateTab(key); }
    }

    private activateTab(tab: string): void {
        const ev: TabSelectedEvent = {
            type: TabbedColumnMenu.EVENT_TAB_SELECTED,
            key: tab
        };
        this.dispatchEvent(ev);
    }

    private createMainPanel(): TabbedItem {
        this.mainMenuList = this.columnMenuFactory.createMenu(this, this.column, () => this.sourceElement ?? this.getGui());
        this.mainMenuList.addEventListener(AgMenuItemComponent.EVENT_MENU_ITEM_SELECTED, this.onHidePopup.bind(this));

        this.tabItemGeneral = {
            title: _.createIconNoSpan('menu', this.gridOptionsService, this.column)!,
            titleLabel: TabbedColumnMenu.TAB_GENERAL.replace('MenuTab', ''),
            bodyPromise: AgPromise.resolve(this.mainMenuList.getGui()),
            name: TabbedColumnMenu.TAB_GENERAL
        };

        return this.tabItemGeneral;
    }

    private onHidePopup(event?: MenuItemSelectedEvent): void {
        this.menuUtils.restoreFocusOnSelect(this.hidePopupFunc, event);
    }

    private createFilterPanel(): TabbedItem {
        const filterWrapper: FilterWrapper | null = this.filterManager.getOrCreateFilterWrapper(this.column, 'COLUMN_MENU');
        if (!filterWrapper) {
            throw new Error('AG Grid - Unable to instantiate filter');
        }

        const afterFilterAttachedCallback = (params: IAfterGuiAttachedParams) => {
            if (!filterWrapper?.filterPromise) { return; }

            // slightly odd block this - this promise will always have been resolved by the time it gets here, so won't be
            // async (_unless_ in react or similar, but if so why not encountered before now?).
            // I'd suggest a future improvement would be to remove/replace this promise as this block just wont work if it is
            // async and is confusing if you don't have this context
            filterWrapper.filterPromise.then(filter => {
                if (filter && filter.afterGuiAttached) {
                    filter.afterGuiAttached(params);
                }
            });
        };

        // see comment above
        const afterDetachedCallback = () => filterWrapper?.filterPromise?.then(filter => filter?.afterGuiDetached?.());

        this.tabItemFilter = {
            title: _.createIconNoSpan('filter', this.gridOptionsService, this.column)!,
            titleLabel: TabbedColumnMenu.TAB_FILTER.replace('MenuTab', ''),
            bodyPromise: filterWrapper?.guiPromise as AgPromise<HTMLElement>,
            afterAttachedCallback: afterFilterAttachedCallback,
            afterDetachedCallback,
            name: TabbedColumnMenu.TAB_FILTER
        };

        return this.tabItemFilter;
    }

    private createColumnsPanel(): TabbedItem {
        const eWrapperDiv = document.createElement('div');
        eWrapperDiv.classList.add('ag-menu-column-select-wrapper');

        const columnSelectPanel = this.columnChooserFactory.createColumnSelectPanel(this, this.column);

        const columnSelectPanelGui = columnSelectPanel.getGui();
        columnSelectPanelGui.classList.add('ag-menu-column-select');
        eWrapperDiv.appendChild(columnSelectPanelGui);

        this.tabItemColumns = {
            title: _.createIconNoSpan('columns', this.gridOptionsService, this.column)!, //createColumnsIcon(),
            titleLabel: TabbedColumnMenu.TAB_COLUMNS.replace('MenuTab', ''),
            bodyPromise: AgPromise.resolve(eWrapperDiv),
            // afterAttachedCallback: () => columnSelectPanel.toggleResizable(true),
            // afterDetachedCallback: () => columnSelectPanel.toggleResizable(false),
            name: TabbedColumnMenu.TAB_COLUMNS
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
}

class ColumnContextMenu extends Component implements EnterpriseColumnMenu {
    @Autowired('columnMenuFactory') private readonly columnMenuFactory: ColumnMenuFactory;
    @Autowired('menuUtils') private readonly menuUtils: MenuUtils;

    @RefSelector('eColumnMenu') private readonly eColumnMenu: HTMLElement;

    private hidePopupFunc: (popupParams?: PopupEventParams) => void;
    private mainMenuList: AgMenuList;

    constructor(private readonly column: Column, private readonly sourceElement?: HTMLElement) {
        super(/* html */`
            <div ref="eColumnMenu" role="presentation" class="ag-menu"></div>
        `);
    }

    @PostConstruct
    private init(): void {
        this.mainMenuList = this.columnMenuFactory.createMenu(this, this.column, () => this.sourceElement ?? this.getGui());
        this.mainMenuList.addEventListener(AgMenuItemComponent.EVENT_MENU_ITEM_SELECTED, this.onHidePopup.bind(this));
        this.eColumnMenu.appendChild(this.mainMenuList.getGui());
    }

    private onHidePopup(event?: MenuItemSelectedEvent): void {
        this.menuUtils.restoreFocusOnSelect(this.hidePopupFunc, event);
    }

    public afterGuiAttached({ hidePopup }: IAfterGuiAttachedParams): void {
        if (hidePopup) {
            this.hidePopupFunc = hidePopup;
            this.addDestroyFunc(hidePopup);
        }
    }
}
