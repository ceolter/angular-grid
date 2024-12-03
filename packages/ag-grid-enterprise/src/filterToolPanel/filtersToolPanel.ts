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
        const newParams = {
            ...defaultParams,
            ...params,
        };
        this.params = newParams;

        const { filtersToolPanelHeaderPanel, filtersToolPanelListPanel } = this;
        filtersToolPanelHeaderPanel.init(newParams);
        filtersToolPanelListPanel.init(newParams);

        const hideExpand = newParams.suppressExpandAll;
        const hideSearch = newParams.suppressFilterSearch;

        if (hideExpand && hideSearch) {
            filtersToolPanelHeaderPanel.setDisplayed(false);
        }

        // this is necessary to prevent a memory leak while refreshing the tool panel
        this.listenerDestroyFuncs.push(
            ...this.addManagedListeners(filtersToolPanelHeaderPanel, {
                expandAll: () => filtersToolPanelListPanel.expandFilterGroups(true),
                collapseAll: () => filtersToolPanelListPanel.expandFilterGroups(false),
                searchChanged: (event) => filtersToolPanelListPanel.performFilterSearch(event.searchText),
            }),
            ...this.addManagedListeners(filtersToolPanelListPanel, {
                filterExpanded: newParams.onStateUpdated,
                groupExpanded: (event) => {
                    filtersToolPanelHeaderPanel.setExpandState(event.state);
                    newParams.onStateUpdated();
                },
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

    public setFilterLayout(colDefs: (ColDef | ColGroupDef)[]): void {
        this.filtersToolPanelListPanel.setFiltersLayout(colDefs);
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
}
