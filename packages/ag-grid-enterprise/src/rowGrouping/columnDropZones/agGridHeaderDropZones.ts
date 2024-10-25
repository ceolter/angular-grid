import type { BeanCollection, ColumnModel, ComponentSelector, FuncColsService } from 'ag-grid-community';
import { Component, _setAriaRole } from 'ag-grid-community';

import { PivotDropZonePanel } from './pivotDropZonePanel';
import { RowGroupDropZonePanel } from './rowGroupDropZonePanel';

export class AgGridHeaderDropZones extends Component {
    private columnModel: ColumnModel;
    private funcColsService: FuncColsService;

    public wireBeans(beans: BeanCollection) {
        this.columnModel = beans.columnModel;
        this.funcColsService = beans.funcColsService;
    }

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

        this.rowGroupComp = new RowGroupDropZonePanel(true);
        this.createManagedBean(this.rowGroupComp);

        this.pivotComp = new PivotDropZonePanel(true);
        this.createManagedBean(this.pivotComp);

        topPanelGui.appendChild(this.rowGroupComp.getGui());
        topPanelGui.appendChild(this.pivotComp.getGui());

        const listener = this.onDropPanelVisible.bind(this);
        this.addManagedListeners(this.rowGroupComp, {
            displayChanged: listener,
        });
        this.addManagedListeners(this.pivotComp, {
            displayChanged: listener,
        });

        this.onDropPanelVisible();

        return topPanelGui;
    }

    private onDropPanelVisible(): void {
        const bothDisplayed = this.rowGroupComp.isDisplayed() && this.pivotComp.isDisplayed();
        const classStr = 'ag-column-drop-horizontal-half-width';
        this.rowGroupComp.addOrRemoveCssClass(classStr, bothDisplayed);
        this.pivotComp.addOrRemoveCssClass(classStr, bothDisplayed);
    }

    private onRowGroupChanged(): void {
        if (!this.rowGroupComp) {
            return;
        }

        const rowGroupPanelShow = this.gos.get('rowGroupPanelShow');

        if (rowGroupPanelShow === 'always') {
            this.rowGroupComp.setDisplayed(true);
        } else if (rowGroupPanelShow === 'onlyWhenGrouping') {
            const grouping = !this.funcColsService.isRowGroupEmpty();
            this.rowGroupComp.setDisplayed(grouping);
        } else {
            this.rowGroupComp.setDisplayed(false);
        }
    }

    private onPivotPanelShow() {
        if (!this.pivotComp) {
            return;
        }

        const pivotPanelShow = this.gos.get('pivotPanelShow');

        if (pivotPanelShow === 'always') {
            this.pivotComp.setDisplayed(true);
        } else if (pivotPanelShow === 'onlyWhenPivoting') {
            const pivoting = this.columnModel.isPivotActive();
            this.pivotComp.setDisplayed(pivoting);
        } else {
            this.pivotComp.setDisplayed(false);
        }
    }
}

export const AgGridHeaderDropZonesSelector: ComponentSelector = {
    selector: 'AG-GRID-HEADER-DROP-ZONES',
    component: AgGridHeaderDropZones,
};
