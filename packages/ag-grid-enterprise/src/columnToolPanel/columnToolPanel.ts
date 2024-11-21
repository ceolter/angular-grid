import type {
    BeanCollection,
    ColDef,
    ColGroupDef,
    ColumnToolPanelState,
    IColumnToolPanel,
    IToolPanelColumnCompParams,
    IToolPanelComp,
    IToolPanelParams,
} from 'ag-grid-community';
import { Component, _clearElement, _last } from 'ag-grid-community';

import type { PivotDropZonePanel } from '../rowGrouping/columnDropZones/pivotDropZonePanel';
import type { RowGroupDropZonePanel } from '../rowGrouping/columnDropZones/rowGroupDropZonePanel';
import type { ValuesDropZonePanel } from '../rowGrouping/columnDropZones/valueDropZonePanel';
import { AgPrimaryCols } from './agPrimaryCols';
import { columnToolPanelCSS } from './columnToolPanel.css-GENERATED';
import type { ColumnToolPanelFactory } from './columnToolPanelFactory';
import type { PivotModePanel } from './pivotModePanel';

export interface ToolPanelColumnCompParams<TData = any, TContext = any>
    extends IToolPanelParams<TData, TContext, ColumnToolPanelState>,
        IToolPanelColumnCompParams {}

export class ColumnToolPanel extends Component implements IColumnToolPanel, IToolPanelComp {
    private initialised = false;
    private params: ToolPanelColumnCompParams;

    private childDestroyFuncs: (() => void)[] = [];

    private pivotModePanel?: PivotModePanel;
    private primaryColsPanel: AgPrimaryCols;
    private rowGroupDropZonePanel?: RowGroupDropZonePanel;
    private valuesDropZonePanel?: ValuesDropZonePanel;
    private pivotDropZonePanel?: PivotDropZonePanel;
    private colToolPanelFactory?: ColumnToolPanelFactory;

    constructor() {
        super(/* html */ `<div class="ag-column-panel"></div>`);
        this.registerCSS(columnToolPanelCSS);
    }

    public wireBeans(beans: BeanCollection): void {
        this.colToolPanelFactory = beans.colToolPanelFactory as ColumnToolPanelFactory;
    }

    // lazy initialise the panel
    public override setVisible(visible: boolean): void {
        super.setDisplayed(visible);
        if (visible && !this.initialised) {
            this.init(this.params);
        }
    }

    public init(params: ToolPanelColumnCompParams): void {
        const defaultParams: Partial<ToolPanelColumnCompParams> = this.gos.addGridCommonParams({
            suppressColumnMove: false,
            suppressColumnSelectAll: false,
            suppressColumnFilter: false,
            suppressColumnExpandAll: false,
            contractColumnSelection: false,
            suppressPivotMode: false,
            suppressRowGroups: false,
            suppressValues: false,
            suppressPivots: false,
            suppressSyncLayoutWithGrid: false,
        });
        const mergedParams = {
            ...defaultParams,
            ...params,
        };
        this.params = mergedParams;

        const { childDestroyFuncs, colToolPanelFactory } = this;

        if (!mergedParams.suppressPivotMode && colToolPanelFactory) {
            this.pivotModePanel = colToolPanelFactory.createPivotModePanel(this, childDestroyFuncs);
        }

        // DO NOT CHANGE TO createManagedBean
        const primaryColsPanel = this.createBean(new AgPrimaryCols());
        this.primaryColsPanel = primaryColsPanel;
        childDestroyFuncs.push(() => this.destroyBean(this.primaryColsPanel));

        primaryColsPanel.init(true, mergedParams, 'toolPanelUi');
        primaryColsPanel.addCssClass('ag-column-panel-column-select');
        this.appendChild(primaryColsPanel);

        if (colToolPanelFactory) {
            if (!mergedParams.suppressRowGroups) {
                this.rowGroupDropZonePanel = colToolPanelFactory.createRowGroupPanel(this, childDestroyFuncs);
            }

            if (!mergedParams.suppressValues) {
                this.valuesDropZonePanel = colToolPanelFactory.createValuesPanel(this, childDestroyFuncs);
            }

            if (!mergedParams.suppressPivots) {
                this.pivotDropZonePanel = colToolPanelFactory.createPivotPanel(this, childDestroyFuncs);
            }

            this.setLastVisible();
            const [pivotModeListener] = this.addManagedEventListeners({
                columnPivotModeChanged: () => {
                    this.resetChildrenHeight();
                    this.setLastVisible();
                },
            });
            childDestroyFuncs.push(() => pivotModeListener!());
        }

        this.initialised = true;
    }

    public setPivotModeSectionVisible(visible: boolean): void {
        const colToolPanelFactory = this.colToolPanelFactory;
        if (!colToolPanelFactory) {
            return;
        }

        this.pivotModePanel = colToolPanelFactory.setPanelVisible(
            this.pivotModePanel,
            visible,
            colToolPanelFactory.createPivotModePanel.bind(colToolPanelFactory, this, this.childDestroyFuncs, true)
        );
        this.setLastVisible();
    }

    public setRowGroupsSectionVisible(visible: boolean): void {
        const colToolPanelFactory = this.colToolPanelFactory;
        if (!colToolPanelFactory) {
            return;
        }

        this.rowGroupDropZonePanel = colToolPanelFactory.setPanelVisible(
            this.rowGroupDropZonePanel,
            visible,
            colToolPanelFactory.createRowGroupPanel.bind(colToolPanelFactory, this, this.childDestroyFuncs)
        );
        this.setLastVisible();
    }

    public setValuesSectionVisible(visible: boolean): void {
        const colToolPanelFactory = this.colToolPanelFactory;
        if (!colToolPanelFactory) {
            return;
        }

        this.valuesDropZonePanel = colToolPanelFactory.setPanelVisible(
            this.valuesDropZonePanel,
            visible,
            colToolPanelFactory.createValuesPanel.bind(colToolPanelFactory, this, this.childDestroyFuncs)
        );
        this.setLastVisible();
    }

    public setPivotSectionVisible(visible: boolean): void {
        const colToolPanelFactory = this.colToolPanelFactory;
        if (!colToolPanelFactory) {
            return;
        }

        this.pivotDropZonePanel = colToolPanelFactory.setPanelVisible(
            this.pivotDropZonePanel,
            visible,
            colToolPanelFactory.createPivotPanel.bind(colToolPanelFactory, this, this.childDestroyFuncs)
        );
        this.setLastVisible();
    }

    private setResizers(): void {
        [this.primaryColsPanel, this.rowGroupDropZonePanel, this.valuesDropZonePanel, this.pivotDropZonePanel].forEach(
            (panel) => {
                if (!panel) {
                    return;
                }
                const eGui = panel.getGui();
                panel.toggleResizable(
                    !eGui.classList.contains('ag-last-column-drop') && !eGui.classList.contains('ag-hidden')
                );
            }
        );
    }

    private setLastVisible(): void {
        const eGui = this.getGui();

        const columnDrops: HTMLElement[] = Array.prototype.slice.call(eGui.querySelectorAll('.ag-column-drop'));

        columnDrops.forEach((columnDrop) => columnDrop.classList.remove('ag-last-column-drop'));

        const columnDropEls = eGui.querySelectorAll('.ag-column-drop:not(.ag-hidden)');
        const lastVisible = _last(columnDropEls) as HTMLElement;

        if (lastVisible) {
            lastVisible.classList.add('ag-last-column-drop');
        }

        this.setResizers();
    }

    private resetChildrenHeight(): void {
        const eGui = this.getGui();
        const children = eGui.children;

        for (let i = 0; i < children.length; i++) {
            const { style } = children[i] as HTMLElement;
            style.removeProperty('height');
            style.removeProperty('flex');
        }
    }

    public expandColumnGroups(groupIds?: string[]): void {
        this.primaryColsPanel.expandGroups(groupIds);
    }

    public collapseColumnGroups(groupIds?: string[]): void {
        this.primaryColsPanel.collapseGroups(groupIds);
    }

    public setColumnLayout(colDefs: (ColDef | ColGroupDef)[]): void {
        this.primaryColsPanel.setColumnLayout(colDefs);
    }

    public syncLayoutWithGrid(): void {
        this.primaryColsPanel.syncLayoutWithGrid();
    }

    public destroyChildren(): void {
        const childDestroyFuncs = this.childDestroyFuncs;
        childDestroyFuncs.forEach((func) => func());
        childDestroyFuncs.length = 0;
        _clearElement(this.getGui());
    }

    public refresh(params: ToolPanelColumnCompParams): boolean {
        this.destroyChildren();
        this.init(params);
        return true;
    }

    public getState(): ColumnToolPanelState {
        return {
            expandedGroupIds: this.primaryColsPanel.getExpandedGroups(),
        };
    }

    public override destroy(): void {
        this.destroyChildren();
        super.destroy();
    }
}
