import type { ColDef, ColGroupDef, ColumnEventType, ComponentSelector } from 'ag-grid-community';
import { Component, PositionableFeature, RefPlaceholder } from 'ag-grid-community';

import { agPrimaryColsCSS } from './agPrimaryCols.css-GENERATED';
import type { AgPrimaryColsHeader } from './agPrimaryColsHeader';
import { AgPrimaryColsHeaderSelector } from './agPrimaryColsHeader';
import type { AgPrimaryColsList } from './agPrimaryColsList';
import { AgPrimaryColsListSelector } from './agPrimaryColsList';
import type { ToolPanelColumnCompParams } from './columnToolPanel';

export class AgPrimaryCols extends Component {
    private readonly primaryColsHeaderPanel: AgPrimaryColsHeader = RefPlaceholder;
    private readonly primaryColsListPanel: AgPrimaryColsList = RefPlaceholder;

    private allowDragging: boolean;
    private params: ToolPanelColumnCompParams;
    private eventType: ColumnEventType;
    private positionableFeature: PositionableFeature;

    constructor() {
        super(
            /* html */ `<div class="ag-column-select">
            <ag-primary-cols-header data-ref="primaryColsHeaderPanel"></ag-primary-cols-header>
            <ag-primary-cols-list data-ref="primaryColsListPanel"></ag-primary-cols-list>
        </div>`,
            [AgPrimaryColsHeaderSelector, AgPrimaryColsListSelector]
        );
        this.registerCSS(agPrimaryColsCSS);
    }

    // we allow dragging in the toolPanel, but not when this component appears in the column menu
    public init(allowDragging: boolean, params: ToolPanelColumnCompParams, eventType: ColumnEventType): void {
        this.allowDragging = allowDragging;
        this.params = params;
        this.eventType = eventType;

        this.primaryColsHeaderPanel.init(this.params);

        const hideFilter = this.params.suppressColumnFilter;
        const hideSelect = this.params.suppressColumnSelectAll;
        const hideExpand = this.params.suppressColumnExpandAll;

        if (hideExpand && hideFilter && hideSelect) {
            this.primaryColsHeaderPanel.setDisplayed(false);
        }

        this.addManagedListeners(this.primaryColsListPanel, {
            groupExpanded: this.onGroupExpanded.bind(this),
            selectionChanged: this.onSelectionChange.bind(this),
        });

        this.primaryColsListPanel.init(this.params, this.allowDragging, this.eventType);

        this.addManagedListeners(this.primaryColsHeaderPanel, {
            expandAll: this.onExpandAll.bind(this),
            collapseAll: this.onCollapseAll.bind(this),
            selectAll: this.onSelectAll.bind(this),
            unselectAll: this.onUnselectAll.bind(this),
            filterChanged: this.onFilterChanged.bind(this),
        });

        this.positionableFeature = new PositionableFeature(this.getGui(), { minHeight: 100 });
        this.createManagedBean(this.positionableFeature);
    }

    public toggleResizable(resizable: boolean) {
        this.positionableFeature.setResizable(resizable ? { bottom: true } : false);
    }

    public onExpandAll(): void {
        this.primaryColsListPanel.doSetExpandedAll(true);
    }

    public onCollapseAll(): void {
        this.primaryColsListPanel.doSetExpandedAll(false);
    }

    public expandGroups(groupIds?: string[]): void {
        this.primaryColsListPanel.setGroupsExpanded(true, groupIds);
    }

    public collapseGroups(groupIds?: string[]): void {
        this.primaryColsListPanel.setGroupsExpanded(false, groupIds);
    }

    public setColumnLayout(colDefs: (ColDef | ColGroupDef)[]): void {
        this.primaryColsListPanel.setColumnLayout(colDefs);
    }

    private onFilterChanged(event: any): void {
        this.primaryColsListPanel.setFilterText(event.filterText);
    }

    public syncLayoutWithGrid(): void {
        this.primaryColsListPanel.onColumnsChanged();
    }

    private onSelectAll(): void {
        this.primaryColsListPanel.doSetSelectedAll(true);
    }

    private onUnselectAll(): void {
        this.primaryColsListPanel.doSetSelectedAll(false);
    }

    private onGroupExpanded(event: any): void {
        this.primaryColsHeaderPanel.setExpandState(event.state);
        this.params.onStateUpdated();
    }

    private onSelectionChange(event: any): void {
        this.primaryColsHeaderPanel.setSelectionState(event.state);
    }

    public getExpandedGroups(): string[] {
        return this.primaryColsListPanel.getExpandedGroups();
    }
}

export const AgPrimaryColsSelector: ComponentSelector = {
    selector: 'AG-PRIMARY-COLS',
    component: AgPrimaryCols,
};
