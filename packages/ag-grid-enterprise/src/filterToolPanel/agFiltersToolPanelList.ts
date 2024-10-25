import type {
    AbstractColDef,
    AgColumn,
    AgProvidedColumnGroup,
    BeanCollection,
    ColumnModel,
    ComponentSelector,
    FiltersToolPanelState,
} from 'ag-grid-community';
import {
    Component,
    _clearElement,
    _exists,
    _getActiveDomElement,
    _mergeDeep,
    _setAriaLabel,
    _warn,
    isProvidedColumnGroup,
} from 'ag-grid-community';

import type { ToolPanelColDefService } from '../sideBar/common/toolPanelColDefService';
import { EXPAND_STATE } from './agFiltersToolPanelHeader';
import type { ToolPanelFiltersCompParams } from './filtersToolPanel';
import { ToolPanelFilterComp } from './toolPanelFilterComp';
import type { ToolPanelFilterItem } from './toolPanelFilterGroupComp';
import { ToolPanelFilterGroupComp } from './toolPanelFilterGroupComp';

export type AgFiltersToolPanelListEvent = 'filterExpanded' | 'groupExpanded';
export class AgFiltersToolPanelList extends Component<AgFiltersToolPanelListEvent> {
    private toolPanelColDefService: ToolPanelColDefService;
    private colModel: ColumnModel;

    public wireBeans(beans: BeanCollection) {
        this.toolPanelColDefService = beans.toolPanelColDefService as ToolPanelColDefService;
        this.colModel = beans.colModel;
    }

    private initialised = false;
    private hasLoadedInitialState = false;
    private isInitialState = false;

    private params: ToolPanelFiltersCompParams;
    private filterGroupComps: ToolPanelFilterGroupComp[] = [];

    // null is used to check if we should search filters when new cols are loaded
    private searchFilterText: string | null;

    // If a column drag is happening, we suppress handling the event until it has completed
    private suppressOnColumnsChanged: boolean = false;
    private onColumnsChangedPending: boolean = false;

    constructor() {
        super(/* html */ `<div class="ag-filter-list-panel"></div>`);
    }

    public init(params: ToolPanelFiltersCompParams): void {
        this.initialised = true;

        const defaultParams: Partial<ToolPanelFiltersCompParams> = this.gos.addGridCommonParams({
            suppressExpandAll: false,
            suppressFilterSearch: false,
            suppressSyncLayoutWithGrid: false,
        });
        _mergeDeep(defaultParams, params);
        this.params = defaultParams as ToolPanelFiltersCompParams;

        if (!this.params.suppressSyncLayoutWithGrid) {
            this.addManagedEventListeners({ columnMoved: () => this.onColumnsChanged() });
        }

        this.addManagedEventListeners({
            newColumnsLoaded: () => this.onColumnsChanged(),
            toolPanelVisibleChanged: (event) => {
                // when re-entering the filters tool panel we need to refresh the virtual lists in the set filters in case
                // filters have been changed elsewhere, i.e. via an api call.
                if (event.key === 'filters') {
                    this.refreshFilters(event.visible);
                }
            },
            dragStarted: () => {
                this.suppressOnColumnsChanged = true;
            },
            dragStopped: () => {
                this.suppressOnColumnsChanged = false;
                if (this.onColumnsChangedPending) {
                    this.onColumnsChangedPending = false;
                    this.onColumnsChanged();
                }
            },
        });

        if (this.colModel.ready) {
            this.onColumnsChanged();
        }
    }

    public onColumnsChanged(): void {
        if (this.suppressOnColumnsChanged) {
            this.onColumnsChangedPending = true;
            return;
        }
        const pivotModeActive = this.colModel.isPivotMode();
        const shouldSyncColumnLayoutWithGrid = !this.params.suppressSyncLayoutWithGrid && !pivotModeActive;
        shouldSyncColumnLayoutWithGrid ? this.syncFilterLayout() : this.buildTreeFromProvidedColumnDefs();
        this.refreshAriaLabel();
    }

    public syncFilterLayout(): void {
        this.toolPanelColDefService.syncLayoutWithGrid(this.setFiltersLayout.bind(this));
        this.refreshAriaLabel();
    }

    private buildTreeFromProvidedColumnDefs(): void {
        const columnTree = this.colModel.getColDefColTree();
        this.recreateFilters(columnTree);
    }

    public setFiltersLayout(colDefs: AbstractColDef[]): void {
        const columnTree = this.toolPanelColDefService.createColumnTree(colDefs);
        this.recreateFilters(columnTree);
    }

    private recreateFilters(columnTree: (AgColumn | AgProvidedColumnGroup)[]): void {
        // Underlying filter comp/element won't get recreated if the column still exists (the element just gets detached/re-attached).
        // We can therefore restore focus if an element in the filter tool panel was focused.
        const activeElement = _getActiveDomElement(this.gos) as HTMLElement;

        if (!this.hasLoadedInitialState) {
            this.hasLoadedInitialState = true;
            this.isInitialState = !!this.params.initialState;
        }

        // Want to restore the expansion state where possible.
        const expansionState = this.getExpansionState();

        this.destroyFilters();

        this.filterGroupComps = this.recursivelyAddComps(columnTree, 0, expansionState) as ToolPanelFilterGroupComp[];

        const len = this.filterGroupComps.length;

        if (len) {
            // skip the destroy function because this will be managed
            // by the `destroyFilters` function
            this.filterGroupComps.forEach((comp) => this.appendChild(comp));
            this.setFirstAndLastVisible(0, len - 1);
        }

        // perform search if searchFilterText exists
        if (_exists(this.searchFilterText)) {
            this.searchFilters(this.searchFilterText);
        }

        // notify header of expand
        this.fireExpandedEvent();

        // We only care about restoring focus if the originally focused element was in the filter tool panel.
        if (this.getGui().contains(activeElement)) {
            activeElement.focus();
        }

        this.isInitialState = false;
        this.refreshAriaLabel();
    }

    private recursivelyAddComps(
        tree: (AgColumn | AgProvidedColumnGroup)[],
        depth: number,
        expansionState: Map<string, boolean>
    ): (ToolPanelFilterGroupComp | ToolPanelFilterComp)[] {
        return tree
            .map((child) => {
                if (isProvidedColumnGroup(child)) {
                    return this.recursivelyAddFilterGroupComps(child, depth, expansionState)?.flatMap((a) => a) ?? [];
                }

                const column = child;

                if (!this.shouldDisplayFilter(column)) {
                    return [];
                }

                const hideFilterCompHeader = depth === 0;
                const filterComp = new ToolPanelFilterComp(hideFilterCompHeader, () => this.onFilterExpanded());
                this.createBean(filterComp);

                filterComp.setColumn(column);
                if (expansionState.get(column.getId())) {
                    // Default state on creation and desired state are both collapsed. Expand if expanded before.
                    filterComp.expand();
                }

                if (depth > 0) {
                    return filterComp;
                }

                const filterGroupComp = this.createBean(
                    new ToolPanelFilterGroupComp(column, [filterComp], this.onGroupExpanded.bind(this), depth, true)
                );
                filterGroupComp.addCssClassToTitleBar('ag-filter-toolpanel-header');
                if (!expansionState.get(filterGroupComp.getFilterGroupId())) {
                    // Default state on creation is expanded. Desired initial state is collapsed. Always collapse unless expanded before.
                    filterGroupComp.collapse();
                }
                return filterGroupComp;
            })
            .flatMap((a) => a);
    }

    private refreshAriaLabel(): void {
        const translate = this.getLocaleTextFunc();
        const filterListName = translate('ariaFilterPanelList', 'Filter List');
        const localeFilters = translate('filters', 'Filters');

        const eGui = this.getGui();
        const groupSelector = '.ag-filter-toolpanel-group-wrapper';
        const itemSelector = '.ag-filter-toolpanel-group-item';
        const hiddenSelector = '.ag-hidden';
        const visibleItems = eGui.querySelectorAll(`${itemSelector}:not(${groupSelector}, ${hiddenSelector})`);

        const totalVisibleItems = visibleItems.length;

        _setAriaLabel(this.getAriaElement(), `${filterListName} ${totalVisibleItems} ${localeFilters}`);
    }

    private recursivelyAddFilterGroupComps(
        columnGroup: AgProvidedColumnGroup,
        depth: number,
        expansionState: Map<string, boolean>
    ): (ToolPanelFilterGroupComp | ToolPanelFilterComp)[] | undefined {
        if (!this.filtersExistInChildren(columnGroup.getChildren())) {
            return;
        }

        const colGroupDef = columnGroup.getColGroupDef();
        if (colGroupDef && colGroupDef.suppressFiltersToolPanel) {
            return [];
        }

        const newDepth = columnGroup.isPadding() ? depth : depth + 1;
        const childFilterComps = this.recursivelyAddComps(columnGroup.getChildren(), newDepth, expansionState).flatMap(
            (a) => a
        );

        if (columnGroup.isPadding()) {
            return childFilterComps;
        }

        const filterGroupComp = new ToolPanelFilterGroupComp(
            columnGroup,
            childFilterComps,
            this.onGroupExpanded.bind(this),
            depth,
            false
        );

        this.createBean(filterGroupComp);
        filterGroupComp.addCssClassToTitleBar('ag-filter-toolpanel-header');
        const expansionStateValue = expansionState.get(filterGroupComp.getFilterGroupId());
        if ((this.isInitialState && !expansionStateValue) || expansionStateValue === false) {
            // Default state on creation is expanded. Desired initial state is expanded. Only collapse if collapsed before or using initial state.
            filterGroupComp.collapse();
        }
        return [filterGroupComp];
    }

    private filtersExistInChildren(tree: (AgColumn | AgProvidedColumnGroup)[]): boolean {
        return tree.some((child) => {
            if (isProvidedColumnGroup(child)) {
                return this.filtersExistInChildren(child.getChildren());
            }

            return this.shouldDisplayFilter(child);
        });
    }

    private shouldDisplayFilter(column: AgColumn) {
        const suppressFiltersToolPanel = column.getColDef() && column.getColDef().suppressFiltersToolPanel;
        return column.isFilterAllowed() && !suppressFiltersToolPanel;
    }

    private getExpansionState(): Map<string, boolean> {
        const expansionState: Map<string, boolean> = new Map();

        if (this.isInitialState) {
            const { expandedColIds, expandedGroupIds } = this.params.initialState as FiltersToolPanelState;
            expandedColIds.forEach((id) => expansionState.set(id, true));
            expandedGroupIds.forEach((id) => expansionState.set(id, true));
            return expansionState;
        }

        const recursiveGetExpansionState = (filterGroupComp: ToolPanelFilterGroupComp) => {
            expansionState.set(filterGroupComp.getFilterGroupId(), filterGroupComp.isExpanded());
            filterGroupComp.getChildren().forEach((child) => {
                if (child instanceof ToolPanelFilterGroupComp) {
                    recursiveGetExpansionState(child);
                } else {
                    expansionState.set(child.getColumn().getId(), child.isExpanded());
                }
            });
        };

        this.filterGroupComps.forEach(recursiveGetExpansionState);

        return expansionState;
    }

    // we don't support refreshing, but must implement because it's on the tool panel interface
    public refresh(): void {}

    // lazy initialise the panel
    public override setVisible(visible: boolean): void {
        super.setDisplayed(visible);
        if (visible && !this.initialised) {
            this.init(this.params);
        }
    }

    public expandFilterGroups(expand: boolean, groupIds?: string[]): void {
        const updatedGroupIds: string[] = [];

        const updateGroupExpandState = (filterGroup: ToolPanelFilterGroupComp) => {
            const groupId = filterGroup.getFilterGroupId();
            const shouldExpandOrCollapse = !groupIds || groupIds.includes(groupId);
            if (shouldExpandOrCollapse) {
                // don't expand 'column groups', i.e. top level columns wrapped in a group
                if (expand && filterGroup.isColumnGroup()) {
                    filterGroup.expand();
                } else {
                    filterGroup.collapse();
                }
                updatedGroupIds.push(groupId);
            }

            // recursively look for more groups to expand / collapse
            filterGroup.getChildren().forEach((child) => {
                if (child instanceof ToolPanelFilterGroupComp) {
                    updateGroupExpandState(child);
                }
            });
        };

        this.filterGroupComps.forEach(updateGroupExpandState);

        // update header expand / collapse icon
        this.onGroupExpanded();

        if (groupIds) {
            const unrecognisedGroupIds = groupIds.filter((groupId) => updatedGroupIds.indexOf(groupId) < 0);
            if (unrecognisedGroupIds.length > 0) {
                _warn(166, { unrecognisedGroupIds });
            }
        }
    }

    public expandFilters(expand: boolean, colIds?: string[]): void {
        const updatedColIds: string[] = [];

        const updateGroupExpandState = (filterComp: ToolPanelFilterGroupComp | ToolPanelFilterComp): boolean => {
            if (filterComp instanceof ToolPanelFilterGroupComp) {
                let anyChildrenChanged = false;
                filterComp.getChildren().forEach((child) => {
                    const childUpdated = updateGroupExpandState(child);
                    if (childUpdated) {
                        if (expand) {
                            filterComp.expand();
                            anyChildrenChanged = true;
                        } else if (!filterComp.isColumnGroup()) {
                            // we only collapse columns wrapped in groups
                            filterComp.collapse();
                        }
                    }
                });
                return anyChildrenChanged;
            }

            const colId = filterComp.getColumn().getColId();
            const updateFilterExpandState = !colIds || colIds.includes(colId);

            if (updateFilterExpandState) {
                expand ? filterComp.expand() : filterComp.collapse();
                updatedColIds.push(colId);
            }

            return updateFilterExpandState;
        };

        this.filterGroupComps.forEach(updateGroupExpandState);

        // update header expand / collapse icon
        this.onGroupExpanded();

        if (colIds) {
            const unrecognisedColIds = colIds.filter((colId) => updatedColIds.indexOf(colId) < 0);
            if (unrecognisedColIds.length > 0) {
                _warn(167, { unrecognisedColIds });
            }
        }
    }

    private onGroupExpanded(): void {
        this.fireExpandedEvent();
    }

    private onFilterExpanded(): void {
        this.dispatchLocalEvent({ type: 'filterExpanded' });
    }

    private fireExpandedEvent(): void {
        let expandedCount = 0;
        let notExpandedCount = 0;

        const updateExpandCounts = (filterGroup: ToolPanelFilterGroupComp) => {
            if (!filterGroup.isColumnGroup()) {
                return;
            }

            filterGroup.isExpanded() ? expandedCount++ : notExpandedCount++;

            filterGroup.getChildren().forEach((child) => {
                if (child instanceof ToolPanelFilterGroupComp) {
                    updateExpandCounts(child);
                }
            });
        };

        this.filterGroupComps.forEach(updateExpandCounts);

        let state: EXPAND_STATE;
        if (expandedCount > 0 && notExpandedCount > 0) {
            state = EXPAND_STATE.INDETERMINATE;
        } else if (notExpandedCount > 0) {
            state = EXPAND_STATE.COLLAPSED;
        } else {
            state = EXPAND_STATE.EXPANDED;
        }

        this.dispatchLocalEvent({ type: 'groupExpanded', state: state });
    }

    public performFilterSearch(searchText: string) {
        this.searchFilterText = _exists(searchText) ? searchText.toLowerCase() : null;
        this.searchFilters(this.searchFilterText);
    }

    private searchFilters(searchFilter: string | null) {
        const passesFilter = (groupName: string) => {
            return !_exists(searchFilter) || groupName.toLowerCase().indexOf(searchFilter) !== -1;
        };

        const recursivelySearch = (filterItem: ToolPanelFilterItem, parentPasses: boolean): boolean => {
            if (!(filterItem instanceof ToolPanelFilterGroupComp)) {
                return passesFilter(filterItem.getColumnFilterName() || '');
            }

            const children = filterItem.getChildren();
            const groupNamePasses = passesFilter(filterItem.getFilterGroupName());

            // if group or parent already passed - ensure this group and all children are visible
            const alreadyPassed = parentPasses || groupNamePasses;
            if (alreadyPassed) {
                // ensure group visible
                filterItem.hideGroup(false);

                // ensure all children are visible
                for (let i = 0; i < children.length; i++) {
                    recursivelySearch(children[i], alreadyPassed);
                    filterItem.hideGroupItem(false, i);
                }
                return true;
            }

            // hide group item filters
            let anyChildPasses = false;
            children.forEach((child: ToolPanelFilterItem, index: number) => {
                const childPasses = recursivelySearch(child, parentPasses);
                filterItem.hideGroupItem(!childPasses, index);
                if (childPasses) {
                    anyChildPasses = true;
                }
            });

            // hide group if no children pass
            filterItem.hideGroup(!anyChildPasses);

            return anyChildPasses;
        };

        let firstVisible: number | undefined;
        let lastVisible: number | undefined;

        this.filterGroupComps.forEach((filterGroup, idx) => {
            recursivelySearch(filterGroup, false);

            if (firstVisible === undefined) {
                if (!filterGroup.containsCssClass('ag-hidden')) {
                    firstVisible = idx;
                    lastVisible = idx;
                }
            } else if (!filterGroup.containsCssClass('ag-hidden') && lastVisible !== idx) {
                lastVisible = idx;
            }
        });

        this.setFirstAndLastVisible(firstVisible, lastVisible);
        this.refreshAriaLabel();
    }

    private setFirstAndLastVisible(firstIdx?: number, lastIdx?: number) {
        this.filterGroupComps.forEach((filterGroup, idx) => {
            filterGroup.removeCssClass('ag-first-group-visible');
            filterGroup.removeCssClass('ag-last-group-visible');

            if (idx === firstIdx) {
                filterGroup.addCssClass('ag-first-group-visible');
            }
            if (idx === lastIdx) {
                filterGroup.addCssClass('ag-last-group-visible');
            }
        });
    }

    private refreshFilters(isDisplayed: boolean) {
        this.filterGroupComps.forEach((filterGroupComp) => filterGroupComp.refreshFilters(isDisplayed));
    }

    public getExpandedFiltersAndGroups(): { expandedGroupIds: string[]; expandedColIds: string[] } {
        const expandedGroupIds: string[] = [];
        const expandedColIds: Set<string> = new Set();

        const getExpandedFiltersAndGroups = (filterComp: ToolPanelFilterGroupComp | ToolPanelFilterComp) => {
            if (filterComp instanceof ToolPanelFilterGroupComp) {
                filterComp.getChildren().forEach((child) => getExpandedFiltersAndGroups(child));
                const groupId = filterComp.getFilterGroupId();
                if (filterComp.isExpanded() && !expandedColIds.has(groupId)) {
                    expandedGroupIds.push(groupId);
                }
            } else {
                if (filterComp.isExpanded()) {
                    expandedColIds.add(filterComp.getColumn().getColId());
                }
            }
        };

        this.filterGroupComps.forEach(getExpandedFiltersAndGroups);

        return { expandedGroupIds, expandedColIds: Array.from(expandedColIds) };
    }

    private destroyFilters() {
        this.filterGroupComps = this.destroyBeans(this.filterGroupComps);
        _clearElement(this.getGui());
    }

    public override destroy() {
        this.destroyFilters();
        super.destroy();
    }
}

export const AgFiltersToolPanelListSelector: ComponentSelector = {
    selector: 'AG-FILTERS-TOOL-PANEL-LIST',
    component: AgFiltersToolPanelList,
};
