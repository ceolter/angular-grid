import type { ComponentSelector } from 'ag-grid-community';
import { Component, _setAriaRole } from 'ag-grid-community';

import { PivotDropZonePanel } from './pivotDropZonePanel';
import { RowGroupDropZonePanel } from './rowGroupDropZonePanel';

export class AgGridHeaderDropZones extends Component {
    private rowGroupComp: Component;
    private pivotComp: Component;

    constructor() {
        super();
    }

    public postConstruct(): void {
        this.setGui(this.createNorthPanel());
        const onRowGroupChanged = this.onRowGroupChanged.bind(this);
        this.addManagedEventListeners({
            columnRowGroupChanged: onRowGroupChanged,
            newColumnsLoaded: onRowGroupChanged,
        });
        this.addManagedPropertyListener('rowGroupPanelShow', onRowGroupChanged);
        this.addManagedPropertyListener('pivotPanelShow', () => this.onPivotPanelShow());

        this.onRowGroupChanged();
    }

    private createNorthPanel(): HTMLElement {
        const topPanelGui = document.createElement('div');

        topPanelGui.classList.add('ag-column-drop-wrapper');
        _setAriaRole(topPanelGui, 'presentation');

        const rowGroupComp = new RowGroupDropZonePanel(true);
        this.rowGroupComp = this.createManagedBean(rowGroupComp);

        const pivotComp = new PivotDropZonePanel(true);
        this.pivotComp = this.createManagedBean(pivotComp);

        topPanelGui.appendChild(rowGroupComp.getGui());
        topPanelGui.appendChild(pivotComp.getGui());

        const listener = this.onDropPanelVisible.bind(this);
        this.addManagedListeners(rowGroupComp, {
            displayChanged: listener,
        });
        this.addManagedListeners(pivotComp, {
            displayChanged: listener,
        });

        this.onDropPanelVisible();

        return topPanelGui;
    }

    private onDropPanelVisible(): void {
        const { rowGroupComp, pivotComp } = this;
        const bothDisplayed = rowGroupComp.isDisplayed() && pivotComp.isDisplayed();
        const classStr = 'ag-column-drop-horizontal-half-width';
        rowGroupComp.addOrRemoveCssClass(classStr, bothDisplayed);
        pivotComp.addOrRemoveCssClass(classStr, bothDisplayed);
    }

    private onRowGroupChanged(): void {
        const rowGroupComp = this.rowGroupComp;
        if (!rowGroupComp) {
            return;
        }

        const rowGroupPanelShow = this.gos.get('rowGroupPanelShow');

        if (rowGroupPanelShow === 'always') {
            rowGroupComp.setDisplayed(true);
        } else if (rowGroupPanelShow === 'onlyWhenGrouping') {
            const grouping = this.beans.rowGroupColsSvc?.columns?.length !== 0;
            rowGroupComp.setDisplayed(grouping);
        } else {
            rowGroupComp.setDisplayed(false);
        }
    }

    private onPivotPanelShow() {
        const pivotComp = this.pivotComp;
        if (!pivotComp) {
            return;
        }

        const pivotPanelShow = this.gos.get('pivotPanelShow');

        if (pivotPanelShow === 'always') {
            pivotComp.setDisplayed(true);
        } else if (pivotPanelShow === 'onlyWhenPivoting') {
            const pivoting = this.beans.colModel.isPivotActive();
            pivotComp.setDisplayed(pivoting);
        } else {
            pivotComp.setDisplayed(false);
        }
    }
}

export const AgGridHeaderDropZonesSelector: ComponentSelector = {
    selector: 'AG-GRID-HEADER-DROP-ZONES',
    component: AgGridHeaderDropZones,
};
