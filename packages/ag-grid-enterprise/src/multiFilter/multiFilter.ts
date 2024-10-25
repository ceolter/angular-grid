import type {
    AgColumn,
    BeanCollection,
    ContainerType,
    FilterManager,
    FocusService,
    IAfterGuiAttachedParams,
    IDoesFilterPassParams,
    IFilterComp,
    IFilterDef,
    IFilterParams,
    IMultiFilter,
    IMultiFilterDef,
    IMultiFilterModel,
    MultiFilterParams,
    ProvidedFilterModel,
    RowNode,
    UserComponentFactory,
} from 'ag-grid-community';
import {
    AgPromise,
    KeyCode,
    ProvidedFilter,
    TabGuardComp,
    _getActiveDomElement,
    _getFilterDetails,
    _isNothingFocused,
    _loadTemplate,
    _removeFromArray,
} from 'ag-grid-community';

import { AgGroupComponent } from '../widgets/agGroupComponent';
import type { MenuItemActivatedEvent } from '../widgets/agMenuItemComponent';
import { AgMenuItemComponent } from '../widgets/agMenuItemComponent';
import { AgMenuItemRenderer } from '../widgets/agMenuItemRenderer';

export function getMultiFilterDefs(params: MultiFilterParams): IMultiFilterDef[] {
    const { filters } = params;

    return filters && filters.length > 0
        ? filters
        : [{ filter: 'agTextColumnFilter' }, { filter: 'agSetColumnFilter' }];
}

function _forEachReverse<T>(list: T[] | null | undefined, action: (value: T, index: number) => void): void {
    if (list == null) {
        return;
    }

    for (let i = list.length - 1; i >= 0; i--) {
        action(list[i], i);
    }
}

export class MultiFilter extends TabGuardComp implements IFilterComp, IMultiFilter {
    private filterManager?: FilterManager;
    private userCompFactory: UserComponentFactory;
    private focusSvc: FocusService;

    public wireBeans(beans: BeanCollection) {
        this.filterManager = beans.filterManager;
        this.userCompFactory = beans.userCompFactory;
        this.focusSvc = beans.focusSvc;
    }

    private params: MultiFilterParams;
    private filterDefs: IMultiFilterDef[] = [];
    private filters: IFilterComp[] | null = [];
    private guiDestroyFuncs: (() => void)[] = [];
    // this could be the accordion/sub menu element depending on the display type
    private filterGuis: HTMLElement[] = [];
    private column: AgColumn;
    private filterChangedCallback: ((additionalEventAttributes?: any) => void) | null;
    private lastOpenedInContainer?: ContainerType;
    private activeFilterIndices: number[] = [];
    private lastActivatedMenuItem: AgMenuItemComponent | null = null;
    private hidePopup?: () => void;

    private afterFiltersReadyFuncs: (() => void)[] = [];

    constructor() {
        super(/* html */ `<div class="ag-multi-filter ag-menu-list-compact"></div>`);
    }

    public postConstruct() {
        this.initialiseTabGuard({
            onFocusIn: (e) => this.onFocusIn(e),
        });
    }

    public init(params: MultiFilterParams): AgPromise<void> {
        this.params = params;
        this.filterDefs = getMultiFilterDefs(params);

        const { column, filterChangedCallback } = params;

        this.column = column as AgColumn;
        this.filterChangedCallback = filterChangedCallback;

        const filterPromises: AgPromise<IFilterComp>[] = [];

        this.filterDefs.forEach((filterDef, index) => {
            const filterPromise = this.createFilter(filterDef, index);

            if (filterPromise != null) {
                filterPromises.push(filterPromise);
            }
        });

        // we have to refresh the GUI here to ensure that Angular components are not rendered in odd places
        return new AgPromise<void>((resolve) => {
            AgPromise.all(filterPromises).then((filters) => {
                this.filters = filters as IFilterComp[];
                this.refreshGui('columnMenu').then(() => {
                    resolve();
                });
            });
        }).then(() => {
            this.afterFiltersReadyFuncs.forEach((f) => f());
            this.afterFiltersReadyFuncs.length = 0;
        });
    }

    private refreshGui(container: ContainerType): AgPromise<void> {
        if (container === this.lastOpenedInContainer) {
            return AgPromise.resolve();
        }

        this.tabGuardFeature.removeAllChildrenExceptTabGuards();
        this.destroyChildren();

        return AgPromise.all(
            this.filters!.map((filter, index) => {
                const filterDef = this.filterDefs[index];
                const filterTitle = this.getFilterTitle(filter, filterDef);
                let filterGuiPromise: AgPromise<HTMLElement>;

                if (filterDef.display === 'subMenu' && container !== 'toolPanel') {
                    // prevent sub-menu being used in tool panel
                    filterGuiPromise = this.insertFilterMenu(filter, filterTitle).then((menuItem) =>
                        menuItem!.getGui()
                    );
                } else if (filterDef.display === 'subMenu' || filterDef.display === 'accordion') {
                    // sub-menus should appear as groups in the tool panel
                    const group = this.insertFilterGroup(filter, filterTitle);

                    filterGuiPromise = AgPromise.resolve(group.getGui());
                } else {
                    // display inline
                    filterGuiPromise = AgPromise.resolve(filter.getGui());
                }

                return filterGuiPromise;
            })
        ).then((filterGuis) => {
            filterGuis!.forEach((filterGui, index) => {
                if (index > 0) {
                    this.appendChild(_loadTemplate(/* html */ `<div class="ag-filter-separator"></div>`));
                }
                this.appendChild(filterGui!);
            });
            this.filterGuis = filterGuis as HTMLElement[];
            this.lastOpenedInContainer = container;
        });
    }

    private getFilterTitle(filter: IFilterComp, filterDef: IMultiFilterDef): string {
        if (filterDef.title != null) {
            return filterDef.title;
        }

        return filter instanceof ProvidedFilter ? filter.getFilterTitle() : 'Filter';
    }

    private destroyChildren() {
        this.guiDestroyFuncs.forEach((func) => func());
        this.guiDestroyFuncs.length = 0;
        this.filterGuis.length = 0;
    }

    private insertFilterMenu(filter: IFilterComp, name: string): AgPromise<AgMenuItemComponent> {
        const menuItem = this.createBean(new AgMenuItemComponent());
        return menuItem
            .init({
                menuItemDef: {
                    name,
                    subMenu: [],
                    cssClasses: ['ag-multi-filter-menu-item'],
                    menuItem: AgMenuItemRenderer,
                    menuItemParams: {
                        cssClassPrefix: 'ag-compact-menu-option',
                        isCompact: true,
                    },
                },
                level: 0,
                isAnotherSubMenuOpen: () => false,
                childComponent: filter,
                contextParams: {
                    column: null,
                    node: null,
                    value: null,
                },
            })
            .then(() => {
                menuItem.setParentComponent(this);

                this.guiDestroyFuncs.push(() => this.destroyBean(menuItem));

                this.addManagedListeners(menuItem, {
                    menuItemActivated: (event: MenuItemActivatedEvent) => {
                        if (this.lastActivatedMenuItem && this.lastActivatedMenuItem !== event.menuItem) {
                            this.lastActivatedMenuItem.deactivate();
                        }

                        this.lastActivatedMenuItem = event.menuItem;
                    },
                });

                const menuItemGui = menuItem.getGui();
                menuItem.addManagedElementListeners(menuItemGui, {
                    // `AgMenuList` normally handles keyboard navigation, so need to do here
                    keydown: (e: KeyboardEvent) => {
                        const { key } = e;
                        switch (key) {
                            case KeyCode.UP:
                            case KeyCode.RIGHT:
                            case KeyCode.DOWN:
                            case KeyCode.LEFT:
                                e.preventDefault();
                                if (key === KeyCode.RIGHT) {
                                    menuItem.openSubMenu(true);
                                }
                                break;
                        }
                    },
                    focusin: () => menuItem.activate(),
                    focusout: () => {
                        if (!menuItem.isSubMenuOpen() && !menuItem.isSubMenuOpening()) {
                            menuItem.deactivate();
                        }
                    },
                });

                return menuItem;
            });
    }

    private insertFilterGroup(filter: IFilterComp, title: string): AgGroupComponent {
        const group = this.createBean(
            new AgGroupComponent({
                title,
                cssIdentifier: 'multi-filter',
            })
        );

        this.guiDestroyFuncs.push(() => this.destroyBean(group));

        group.addItem(filter.getGui());
        group.toggleGroupExpand(false);

        if (filter.afterGuiAttached) {
            group.addManagedListeners(group, {
                expanded: () =>
                    filter.afterGuiAttached!({
                        container: this.lastOpenedInContainer!,
                        suppressFocus: true,
                        hidePopup: this.hidePopup,
                    }),
            });
        }

        return group;
    }

    public isFilterActive(): boolean {
        return this.filters!.some((filter) => filter.isFilterActive());
    }

    public getLastActiveFilterIndex(): number | null {
        return this.activeFilterIndices.length > 0
            ? this.activeFilterIndices[this.activeFilterIndices.length - 1]
            : null;
    }

    public doesFilterPass(params: IDoesFilterPassParams, filterToSkip?: IFilterComp): boolean {
        let rowPasses = true;

        this.filters!.forEach((filter) => {
            if (!rowPasses || filter === filterToSkip || !filter.isFilterActive()) {
                return;
            }

            rowPasses = filter.doesFilterPass(params);
        });

        return rowPasses;
    }

    private getFilterType(): 'multi' {
        return 'multi';
    }

    public getModelFromUi(): IMultiFilterModel | null {
        const model: IMultiFilterModel = {
            filterType: this.getFilterType(),
            filterModels: this.filters!.map((filter) => {
                const providedFilter = filter as ProvidedFilter<IMultiFilterModel, unknown>;

                if (typeof providedFilter.getModelFromUi === 'function') {
                    return providedFilter.getModelFromUi();
                }

                return null;
            }),
        };

        return model;
    }

    public getModel(): ProvidedFilterModel | null {
        if (!this.isFilterActive()) {
            return null;
        }

        const model: IMultiFilterModel = {
            filterType: this.getFilterType(),
            filterModels: this.filters!.map((filter) => {
                if (filter.isFilterActive()) {
                    return filter.getModel();
                }

                return null;
            }),
        };

        return model;
    }

    public setModel(model: IMultiFilterModel | null): AgPromise<void> {
        const setFilterModel = (filter: IFilterComp, filterModel: any) => {
            return new AgPromise<void>((resolve) => {
                const promise = filter.setModel(filterModel);
                promise ? promise.then(() => resolve()) : resolve();
            });
        };

        let promises: AgPromise<void>[] = [];

        if (model == null) {
            promises = this.filters!.map((filter: IFilterComp, index: number) => {
                const res = setFilterModel(filter, null).then(() => {
                    this.updateActiveList(index);
                });
                return res;
            })!;
        } else {
            this.filters!.forEach((filter, index) => {
                const filterModel = model.filterModels!.length > index ? model.filterModels![index] : null;
                const res = setFilterModel(filter, filterModel).then(() => {
                    this.updateActiveList(index);
                });
                promises.push(res);
            });
        }

        return AgPromise.all(promises).then(() => {});
    }

    public applyModel(source: 'api' | 'ui' | 'rowDataUpdated' = 'api'): boolean {
        let result = false;

        this.filters!.forEach((filter) => {
            if (filter instanceof ProvidedFilter) {
                result = filter.applyModel(source) || result;
            }
        });

        return result;
    }

    public getChildFilterInstance(index: number): IFilterComp | undefined {
        return this.filters![index];
    }

    public afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        let refreshPromise: AgPromise<void>;
        if (params) {
            this.hidePopup = params.hidePopup;
            refreshPromise = this.refreshGui(params.container!);
        } else {
            this.hidePopup = undefined;
            refreshPromise = AgPromise.resolve();
        }

        const suppressFocus = params?.suppressFocus;

        refreshPromise.then(() => {
            const { filterDefs } = this;
            // don't want to focus later if focus suppressed
            let hasFocused = !!suppressFocus;
            if (filterDefs) {
                _forEachReverse(filterDefs, (filterDef, index) => {
                    const isFirst = index === 0;
                    const notInlineDisplayType = filterDef.display && filterDef.display !== 'inline';
                    const suppressFocusForFilter = suppressFocus || !isFirst || notInlineDisplayType;
                    const afterGuiAttachedParams = { ...(params ?? {}), suppressFocus: suppressFocusForFilter };
                    const filter = this.filters?.[index];
                    if (filter) {
                        this.executeFunctionIfExistsOnFilter(filter, 'afterGuiAttached', afterGuiAttachedParams);
                        if (isFirst && !suppressFocusForFilter) {
                            hasFocused = true;
                        }
                    }
                    if (!suppressFocus && isFirst && notInlineDisplayType) {
                        // focus the first filter container instead (accordion/sub menu)
                        const filterGui = this.filterGuis[index];
                        if (filterGui) {
                            if (!this.focusSvc.focusInto(filterGui)) {
                                // menu item contains no focusable elements but is focusable itself
                                filterGui.focus();
                            }
                            hasFocused = true;
                        }
                    }
                });
            }

            const activeEl = _getActiveDomElement(this.gos);

            // if we haven't focused the first item in the filter, we might run into two scenarios:
            // 1 - we are loading the filter for the first time and the component isn't ready,
            //     which means the document will have focus.
            // 2 - The focus will be somewhere inside the component due to auto focus
            // In both cases we need to force the focus somewhere valid but outside the filter.
            if (!hasFocused && (_isNothingFocused(this.gos) || this.getGui().contains(activeEl))) {
                // reset focus to the top of the container, and blur
                this.forceFocusOutOfContainer(true);
            }
        });
    }

    public afterGuiDetached(): void {
        this.executeFunctionIfExists('afterGuiDetached');
    }

    public onAnyFilterChanged(): void {
        this.executeFunctionIfExists('onAnyFilterChanged');
    }

    public onNewRowsLoaded(): void {
        this.executeFunctionIfExists('onNewRowsLoaded');
    }

    public override destroy(): void {
        this.filters!.forEach((filter) => this.destroyBean(filter));

        this.filters!.length = 0;
        this.destroyChildren();
        this.hidePopup = undefined;

        super.destroy();
    }

    private executeFunctionIfExists<T extends IFilterComp>(name: keyof T, ...params: any[]): void {
        // The first filter is always the "dominant" one. By iterating in reverse order we ensure the first filter
        // always gets the last say
        _forEachReverse(this.filters, (filter) => {
            this.executeFunctionIfExistsOnFilter(filter as T, name, params);
        });
    }

    private executeFunctionIfExistsOnFilter<T extends IFilterComp>(filter: T, name: keyof T, ...params: any[]): void {
        const func = filter[name];

        if (typeof func === 'function') {
            func.apply(filter, params);
        }
    }

    private createFilter(filterDef: IFilterDef, index: number): AgPromise<IFilterComp> | null {
        const { filterModifiedCallback, doesRowPassOtherFilter } = this.params;

        let filterInstance: IFilterComp;

        const filterParams: IFilterParams = {
            ...this.filterManager!.createFilterParams(this.column, this.column.getColDef()),
            filterModifiedCallback,
            filterChangedCallback: (additionalEventAttributes) => {
                this.executeWhenAllFiltersReady(() => this.filterChanged(index, additionalEventAttributes));
            },
            doesRowPassOtherFilter: (node: RowNode) =>
                doesRowPassOtherFilter(node) && this.doesFilterPass({ node, data: node.data }, filterInstance),
        };

        const compDetails = _getFilterDetails(this.userCompFactory, filterDef, filterParams, 'agTextColumnFilter');
        if (!compDetails) {
            return null;
        }
        const filterPromise = compDetails.newAgStackInstance();

        if (filterPromise) {
            filterPromise.then((filter) => (filterInstance = filter!));
        }

        return filterPromise;
    }

    private executeWhenAllFiltersReady(action: () => void): void {
        if (this.filters && this.filters.length > 0) {
            action();
        } else {
            this.afterFiltersReadyFuncs.push(action);
        }
    }

    private updateActiveList(index: number): void {
        const changedFilter = this.filters![index];

        _removeFromArray(this.activeFilterIndices, index);

        if (changedFilter.isFilterActive()) {
            this.activeFilterIndices.push(index);
        }
    }

    private filterChanged(index: number, additionalEventAttributes: any): void {
        this.updateActiveList(index);

        this.filterChangedCallback!(additionalEventAttributes);
        const changedFilter = this.filters![index];

        this.filters!.forEach((filter) => {
            if (filter === changedFilter) {
                return;
            }

            if (typeof filter.onAnyFilterChanged === 'function') {
                filter.onAnyFilterChanged();
            }
        });
    }

    protected onFocusIn(e: FocusEvent): void {
        if (
            this.lastActivatedMenuItem != null &&
            !this.lastActivatedMenuItem.getGui().contains(e.target as HTMLElement)
        ) {
            this.lastActivatedMenuItem.deactivate();
            this.lastActivatedMenuItem = null;
        }
    }

    getModelAsString(model: IMultiFilterModel): string {
        if (!this.filters || !model?.filterModels?.length) {
            return '';
        }
        const lastActiveIndex = this.getLastActiveFilterIndex() ?? 0;
        const activeFilter = this.filters[lastActiveIndex];
        return activeFilter.getModelAsString?.(model.filterModels[lastActiveIndex]) ?? '';
    }
}
