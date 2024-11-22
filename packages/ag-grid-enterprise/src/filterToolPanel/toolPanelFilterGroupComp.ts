import type {
    AgColumn,
    AgProvidedColumnGroup,
    FilterOpenedEvent,
    ITooltipCtrl,
    IconName,
    TooltipFeature,
} from 'ag-grid-community';
import {
    Component,
    RefPlaceholder,
    _clearElement,
    _createIconNoSpan,
    _getShouldDisplayTooltip,
    isProvidedColumnGroup,
} from 'ag-grid-community';

import type { AgGroupComponent, AgGroupComponentParams } from '../widgets/agGroupComponent';
import { AgGroupComponentSelector } from '../widgets/agGroupComponent';
import { ToolPanelFilterComp } from './toolPanelFilterComp';

export type ToolPanelFilterItem = ToolPanelFilterGroupComp | ToolPanelFilterComp;

export class ToolPanelFilterGroupComp extends Component {
    private filterGroupComp: AgGroupComponent = RefPlaceholder;

    private filterGroupName: string | null;
    private tooltipFeature?: TooltipFeature;

    constructor(
        private readonly columnGroup: AgColumn | AgProvidedColumnGroup,
        private childFilterComps: (ToolPanelFilterGroupComp | ToolPanelFilterComp)[],
        private readonly expandedCallback: () => void,
        private readonly depth: number,
        private readonly showingColumn: boolean
    ) {
        super();
    }

    public postConstruct(): void {
        const groupParams: AgGroupComponentParams = {
            cssIdentifier: 'filter-toolpanel',
            direction: 'vertical',
        };
        this.setTemplate(
            /* html */ `<div class="ag-filter-toolpanel-group-wrapper">
            <ag-group-component data-ref="filterGroupComp"></ag-group-component>
        </div>`,
            [AgGroupComponentSelector],
            { filterGroupComp: groupParams }
        );

        this.setGroupTitle();
        const { filterGroupComp, depth, childFilterComps, gos } = this;
        filterGroupComp.setAlignItems('stretch');

        filterGroupComp.addCssClass(`ag-filter-toolpanel-group-level-${depth}`);
        filterGroupComp.getGui().style.setProperty('--ag-indentation-level', String(depth));
        filterGroupComp.addCssClassToTitleBar(`ag-filter-toolpanel-group-level-${depth}-header`);

        childFilterComps.forEach((filterComp) => {
            filterGroupComp.addItem(filterComp as Component);
            filterComp.addCssClassToTitleBar(`ag-filter-toolpanel-group-level-${depth + 1}-header`);
            filterComp.getGui().style.setProperty('--ag-indentation-level', String(depth + 1));
        });

        this.tooltipFeature = this.createOptionalManagedBean(
            this.beans.registry.createDynamicBean<TooltipFeature>('tooltipFeature', false, {
                getGui: () => this.getGui(),
                getLocation: () => 'filterToolPanelColumnGroup',
                shouldDisplayTooltip: _getShouldDisplayTooltip(
                    gos,
                    () => filterGroupComp.getGui().querySelector('.ag-group-title') as HTMLElement | undefined
                ),
            } as ITooltipCtrl)
        );

        this.refreshFilterClass();
        this.addExpandCollapseListeners();
        this.addFilterChangedListeners();
        this.setupTooltip();
        this.addInIcon('filterActive');
    }

    private setupTooltip(): void {
        // we don't show tooltips for groups, as when the group expands, it's div contains the columns which also
        // have tooltips, so the tooltips would clash. Eg mouse over group, tooltip shows, mouse over column, another
        // tooltip shows but cos we didn't leave the group the group tooltip remains. this should be fixed in the future,
        // maybe the group shouldn't contain the children form a DOM perspective.
        if (!this.showingColumn) {
            return;
        }

        const refresh = () => {
            this.tooltipFeature?.setTooltipAndRefresh((this.columnGroup as AgColumn).getColDef().headerTooltip);
        };

        refresh();

        this.addManagedEventListeners({ newColumnsLoaded: refresh });
    }

    public addCssClassToTitleBar(cssClass: string) {
        this.filterGroupComp.addCssClassToTitleBar(cssClass);
    }

    public refreshFilters(isDisplayed: boolean) {
        this.childFilterComps.forEach((filterComp) => {
            if (filterComp instanceof ToolPanelFilterGroupComp) {
                filterComp.refreshFilters(isDisplayed);
            } else {
                filterComp.refreshFilter(isDisplayed);
            }
        });
    }

    public isColumnGroup(): boolean {
        return isProvidedColumnGroup(this.columnGroup);
    }

    public isExpanded(): boolean {
        return this.filterGroupComp.isExpanded();
    }

    public getChildren(): ToolPanelFilterItem[] {
        return this.childFilterComps;
    }

    public getFilterGroupName(): string {
        return this.filterGroupName ?? '';
    }

    public getFilterGroupId(): string {
        return this.columnGroup.getId();
    }

    public hideGroupItem(hide: boolean, index: number) {
        this.filterGroupComp.hideItem(hide, index);
    }

    public hideGroup(hide: boolean) {
        this.setDisplayed(!hide);
    }

    private addInIcon(iconName: IconName): void {
        const eIcon = _createIconNoSpan(iconName, this.beans)!;
        if (eIcon) {
            eIcon.classList.add('ag-filter-toolpanel-group-instance-header-icon');
        }
        this.filterGroupComp.addTitleBarWidget(eIcon);
    }

    private forEachToolPanelFilterChild(action: (filterComp: ToolPanelFilterItem) => void) {
        this.childFilterComps.forEach((filterComp) => {
            if (filterComp instanceof ToolPanelFilterComp) {
                action(filterComp);
            }
        });
    }

    private addExpandCollapseListeners() {
        const expandListener = this.isColumnGroup()
            ? () => this.expandedCallback()
            : () => this.forEachToolPanelFilterChild((filterComp) => filterComp.expand());

        const collapseListener = this.isColumnGroup()
            ? () => this.expandedCallback()
            : () => this.forEachToolPanelFilterChild((filterComp) => filterComp.collapse());

        this.addManagedListeners(this.filterGroupComp, {
            expanded: expandListener,
            collapsed: collapseListener,
        });
    }

    private getColumns(): AgColumn[] {
        if (isProvidedColumnGroup(this.columnGroup)) {
            return this.columnGroup.getLeafColumns();
        }

        return [this.columnGroup];
    }

    private addFilterChangedListeners() {
        this.getColumns().forEach((column) => {
            this.addManagedListeners(column, { filterChanged: () => this.refreshFilterClass() });
        });

        if (!isProvidedColumnGroup(this.columnGroup)) {
            this.addManagedEventListeners({ filterOpened: this.onFilterOpened.bind(this) });
        }
    }

    private refreshFilterClass(): void {
        const columns = this.getColumns();

        const anyChildFiltersActive = () => columns.some((col) => col.isFilterActive());
        this.filterGroupComp.addOrRemoveCssClass('ag-has-filter', anyChildFiltersActive());
    }

    private onFilterOpened(event: FilterOpenedEvent): void {
        // when a filter is opened elsewhere, i.e. column menu we close the filter comp so we also need to collapse
        // the column group. This approach means we don't need to try and sync filter models on the same column.

        if (event.source !== 'COLUMN_MENU') {
            return;
        }
        if (event.column !== this.columnGroup) {
            return;
        }
        if (!this.isExpanded()) {
            return;
        }

        this.collapse();
    }

    public expand() {
        this.filterGroupComp.toggleGroupExpand(true);
    }

    public collapse() {
        this.filterGroupComp.toggleGroupExpand(false);
    }

    private setGroupTitle() {
        const columnGroup = this.columnGroup;
        const filterGroupName = isProvidedColumnGroup(columnGroup)
            ? this.getColumnGroupName(columnGroup)
            : this.getColumnName(columnGroup);
        this.filterGroupName = filterGroupName;

        this.filterGroupComp.setTitle(filterGroupName || '');
    }

    private getColumnGroupName(columnGroup: AgProvidedColumnGroup): string | null {
        return this.beans.colNames.getDisplayNameForProvidedColumnGroup(null, columnGroup, 'filterToolPanel');
    }

    private getColumnName(column: AgColumn): string | null {
        return this.beans.colNames.getDisplayNameForColumn(column, 'filterToolPanel', false);
    }

    private destroyFilters() {
        this.childFilterComps = this.destroyBeans(this.childFilterComps);
        _clearElement(this.getGui());
    }

    public override destroy() {
        this.destroyFilters();
        super.destroy();
    }
}
