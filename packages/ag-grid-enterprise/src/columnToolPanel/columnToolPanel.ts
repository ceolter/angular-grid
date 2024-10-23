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
    private columnToolPanelFactory?: ColumnToolPanelFactory;

    constructor() {
        super(/* html */ `<div class="ag-column-panel"></div>`);
        this.registerCSS(columnToolPanelCSS);
    }

    public wireBeans(beans: BeanCollection): void {
        this.columnToolPanelFactory = beans.columnToolPanelFactory as ColumnToolPanelFactory;
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
        this.params = {
            ...defaultParams,
            ...params,
        };

        if (!this.params.suppressPivotMode && this.columnToolPanelFactory) {
            this.pivotModePanel = this.columnToolPanelFactory.createPivotModePanel(this, this.childDestroyFuncs);
        }

        // DO NOT CHANGE TO createManagedBean
        this.primaryColsPanel = this.createBean(new AgPrimaryCols());
        this.childDestroyFuncs.push(() => this.destroyBean(this.primaryColsPanel));

        this.primaryColsPanel.init(true, this.params, 'toolPanelUi');
        this.primaryColsPanel.addCssClass('ag-column-panel-column-select');
        this.appendChild(this.primaryColsPanel);

        if (this.columnToolPanelFactory) {
            if (!this.params.suppressRowGroups) {
                this.rowGroupDropZonePanel = this.columnToolPanelFactory.createRowGroupPanel(
                    this,
                    this.childDestroyFuncs
                );
            }

            if (!this.params.suppressValues) {
                this.valuesDropZonePanel = this.columnToolPanelFactory.createValuesPanel(this, this.childDestroyFuncs);
            }

            if (!this.params.suppressPivots) {
                this.pivotDropZonePanel = this.columnToolPanelFactory.createPivotPanel(this, this.childDestroyFuncs);
            }

            this.setLastVisible();
            const [pivotModeListener] = this.addManagedEventListeners({
                columnPivotModeChanged: () => {
                    this.resetChildrenHeight();
                    this.setLastVisible();
                },
            });
            this.childDestroyFuncs.push(() => pivotModeListener!());
        }

        this.initialised = true;
    }

    public setPivotModeSectionVisible(visible: boolean): void {
        if (!this.columnToolPanelFactory) {
            return;
        }

        this.pivotModePanel = this.columnToolPanelFactory.setPanelVisible(
            this.pivotModePanel,
            visible,
            this.columnToolPanelFactory.createPivotModePanel.bind(this, this, this.childDestroyFuncs, true)
        );
        this.setLastVisible();
    }

    public setRowGroupsSectionVisible(visible: boolean): void {
        if (!this.columnToolPanelFactory) {
            return;
        }

        this.rowGroupDropZonePanel = this.columnToolPanelFactory.setPanelVisible(
            this.rowGroupDropZonePanel,
            visible,
            this.columnToolPanelFactory.createRowGroupPanel.bind(this, this, this.childDestroyFuncs)
        );
        this.setLastVisible();
    }

    public setValuesSectionVisible(visible: boolean): void {
        if (!this.columnToolPanelFactory) {
            return;
        }

        this.valuesDropZonePanel = this.columnToolPanelFactory.setPanelVisible(
            this.valuesDropZonePanel,
            visible,
            this.columnToolPanelFactory.createValuesPanel.bind(this, this, this.childDestroyFuncs)
        );
        this.setLastVisible();
    }

    public setPivotSectionVisible(visible: boolean): void {
        if (!this.columnToolPanelFactory) {
            return;
        }

        this.pivotDropZonePanel = this.columnToolPanelFactory.setPanelVisible(
            this.pivotDropZonePanel,
            visible,
            this.columnToolPanelFactory.createPivotPanel.bind(this, this, this.childDestroyFuncs)
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
            const child = children[i] as HTMLElement;
            child.style.removeProperty('height');
            child.style.removeProperty('flex');
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
        this.childDestroyFuncs.forEach((func) => func());
        this.childDestroyFuncs.length = 0;
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

    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so this must be public.
    public override destroy(): void {
        this.destroyChildren();
        super.destroy();
    }
}
