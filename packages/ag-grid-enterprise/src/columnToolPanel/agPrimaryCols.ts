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
        const { primaryColsHeaderPanel, primaryColsListPanel } = this;

        primaryColsHeaderPanel.init(params);

        const hideFilter = params.suppressColumnFilter;
        const hideSelect = params.suppressColumnSelectAll;
        const hideExpand = params.suppressColumnExpandAll;

        if (hideExpand && hideFilter && hideSelect) {
            primaryColsHeaderPanel.setDisplayed(false);
        }

        this.addManagedListeners(primaryColsListPanel, {
            groupExpanded: (event) => {
                primaryColsHeaderPanel.setExpandState(event.state);
                params.onStateUpdated();
            },
            selectionChanged: (event) => primaryColsHeaderPanel.setSelectionState(event.state),
        });

        primaryColsListPanel.init(params, allowDragging, eventType);

        this.addManagedListeners(primaryColsHeaderPanel, {
            expandAll: primaryColsListPanel.doSetExpandedAll.bind(primaryColsListPanel, true),
            collapseAll: primaryColsListPanel.doSetExpandedAll.bind(primaryColsListPanel, false),
            selectAll: primaryColsListPanel.doSetSelectedAll.bind(primaryColsListPanel, true),
            unselectAll: primaryColsListPanel.doSetSelectedAll.bind(primaryColsListPanel, false),
            filterChanged: (event) => primaryColsListPanel.setFilterText(event.filterText),
        });

        this.positionableFeature = this.createManagedBean(new PositionableFeature(this.getGui(), { minHeight: 100 }));
    }

    public toggleResizable(resizable: boolean) {
        this.positionableFeature.setResizable(resizable ? { bottom: true } : false);
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

    public syncLayoutWithGrid(): void {
        this.primaryColsListPanel.onColumnsChanged();
    }

    public getExpandedGroups(): string[] {
        return this.primaryColsListPanel.getExpandedGroups();
    }
}

export const AgPrimaryColsSelector: ComponentSelector = {
    selector: 'AG-PRIMARY-COLS',
    component: AgPrimaryCols,
};
