import type { AgCheckbox, BeanCollection, ColumnModel, CtrlsService } from 'ag-grid-community';
import { AgToggleButtonSelector, Component, RefPlaceholder } from 'ag-grid-community';

export class PivotModePanel extends Component {
    private colModel: ColumnModel;
    private ctrlsSvc: CtrlsService;

    public wireBeans(beans: BeanCollection) {
        this.colModel = beans.colModel;
        this.ctrlsSvc = beans.ctrlsSvc;
    }

    private readonly cbPivotMode: AgCheckbox = RefPlaceholder;

    private createTemplate(): string {
        return /* html */ `<div class="ag-pivot-mode-panel">
                <ag-toggle-button data-ref="cbPivotMode" class="ag-pivot-mode-select"></ag-toggle-button>
            </div>`;
    }

    public postConstruct(): void {
        this.setTemplate(this.createTemplate(), [AgToggleButtonSelector]);

        this.cbPivotMode.setValue(this.colModel.isPivotMode());
        const localeTextFunc = this.getLocaleTextFunc();
        this.cbPivotMode.setLabel(localeTextFunc('pivotMode', 'Pivot Mode'));

        this.addManagedListeners(this.cbPivotMode, { fieldValueChanged: this.onBtPivotMode.bind(this) });
        const listener = this.onPivotModeChanged.bind(this);
        this.addManagedEventListeners({
            newColumnsLoaded: listener,
            columnPivotModeChanged: listener,
        });
    }

    private onBtPivotMode(): void {
        const newValue = !!this.cbPivotMode.getValue();
        if (newValue !== this.colModel.isPivotMode()) {
            this.gos.updateGridOptions({ options: { pivotMode: newValue }, source: 'toolPanelUi' as any });
            this.ctrlsSvc.getHeaderRowContainerCtrls().forEach((c) => c.refresh());
        }
    }

    private onPivotModeChanged(): void {
        const pivotModeActive = this.colModel.isPivotMode();
        this.cbPivotMode.setValue(pivotModeActive);
    }
}
