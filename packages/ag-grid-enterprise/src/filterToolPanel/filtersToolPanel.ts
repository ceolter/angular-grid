import type {
    ColDef,
    ColGroupDef,
    FiltersToolPanelState,
    IFiltersToolPanel,
    IToolPanelComp,
    IToolPanelFiltersCompParams,
    IToolPanelParams,
} from 'ag-grid-community';
import { Component, RefPlaceholder } from 'ag-grid-community';

import type { AgFiltersToolPanelHeader } from './agFiltersToolPanelHeader';
import { AgFiltersToolPanelHeaderSelector } from './agFiltersToolPanelHeader';
import type { AgFiltersToolPanelList } from './agFiltersToolPanelList';
import { AgFiltersToolPanelListSelector } from './agFiltersToolPanelList';
import { filtersToolPanelCSS } from './filtersToolPanel.css-GENERATED';

export interface ToolPanelFiltersCompParams<TData = any, TContext = any>
    extends IToolPanelParams<TData, TContext, FiltersToolPanelState>,
        IToolPanelFiltersCompParams {}

export class FiltersToolPanel extends Component implements IFiltersToolPanel, IToolPanelComp {
    private readonly filtersToolPanelHeaderPanel: AgFiltersToolPanelHeader = RefPlaceholder;
    private readonly filtersToolPanelListPanel: AgFiltersToolPanelList = RefPlaceholder;

    private initialised = false;
    private params: ToolPanelFiltersCompParams;
    private listenerDestroyFuncs: (() => void)[] = [];

    constructor() {
        super(
            /* html */ `<div class="ag-filter-toolpanel">
            <ag-filters-tool-panel-header data-ref="filtersToolPanelHeaderPanel"></ag-filters-tool-panel-header>
            <ag-filters-tool-panel-list data-ref="filtersToolPanelListPanel"></ag-filters-tool-panel-list>
         </div>`,
            [AgFiltersToolPanelHeaderSelector, AgFiltersToolPanelListSelector]
        );
        this.registerCSS(filtersToolPanelCSS);
    }

    public init(params: ToolPanelFiltersCompParams): void {
        // if initialised is true, means this is a refresh
        if (this.initialised) {
            this.listenerDestroyFuncs.forEach((func) => func());
            this.listenerDestroyFuncs = [];
        }

        this.initialised = true;

        const defaultParams: Partial<ToolPanelFiltersCompParams> = this.gos.addGridCommonParams({
            suppressExpandAll: false,
            suppressFilterSearch: false,
            suppressSyncLayoutWithGrid: false,
        });
        this.params = {
            ...defaultParams,
            ...params,
        };

        this.filtersToolPanelHeaderPanel.init(this.params);
        this.filtersToolPanelListPanel.init(this.params);

        const hideExpand = this.params.suppressExpandAll;
        const hideSearch = this.params.suppressFilterSearch;

        if (hideExpand && hideSearch) {
            this.filtersToolPanelHeaderPanel.setDisplayed(false);
        }

        // this is necessary to prevent a memory leak while refreshing the tool panel
        this.listenerDestroyFuncs.push(
            ...this.addManagedListeners(this.filtersToolPanelHeaderPanel, {
                expandAll: this.onExpandAll.bind(this),
                collapseAll: this.onCollapseAll.bind(this),
                searchChanged: this.onSearchChanged.bind(this),
            }),
            ...this.addManagedListeners(this.filtersToolPanelListPanel, {
                filterExpanded: this.onFilterExpanded.bind(this),
                groupExpanded: this.onGroupExpanded.bind(this),
            })
        );
    }

    // lazy initialise the panel
    public override setVisible(visible: boolean): void {
        super.setDisplayed(visible);
        if (visible && !this.initialised) {
            this.init(this.params);
        }
    }

    public onExpandAll(): void {
        this.filtersToolPanelListPanel.expandFilterGroups(true);
    }

    public onCollapseAll(): void {
        this.filtersToolPanelListPanel.expandFilterGroups(false);
    }

    private onSearchChanged(event: any): void {
        this.filtersToolPanelListPanel.performFilterSearch(event.searchText);
    }

    public setFilterLayout(colDefs: (ColDef | ColGroupDef)[]): void {
        this.filtersToolPanelListPanel.setFiltersLayout(colDefs);
    }

    private onFilterExpanded(): void {
        this.params.onStateUpdated();
    }

    private onGroupExpanded(event: any): void {
        this.filtersToolPanelHeaderPanel.setExpandState(event.state);
        this.params.onStateUpdated();
    }

    public expandFilterGroups(groupIds?: string[]): void {
        this.filtersToolPanelListPanel.expandFilterGroups(true, groupIds);
    }

    public collapseFilterGroups(groupIds?: string[]): void {
        this.filtersToolPanelListPanel.expandFilterGroups(false, groupIds);
    }

    public expandFilters(colIds?: string[]): void {
        this.filtersToolPanelListPanel.expandFilters(true, colIds);
    }

    public collapseFilters(colIds?: string[]): void {
        this.filtersToolPanelListPanel.expandFilters(false, colIds);
    }

    public syncLayoutWithGrid(): void {
        this.filtersToolPanelListPanel.syncFilterLayout();
    }

    public refresh(params: ToolPanelFiltersCompParams): boolean {
        this.init(params);
        return true;
    }

    public getState(): FiltersToolPanelState {
        return this.filtersToolPanelListPanel.getExpandedFiltersAndGroups();
    }

    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so we need to override destroy() just to make the method public.
    public override destroy(): void {
        super.destroy();
    }
}
