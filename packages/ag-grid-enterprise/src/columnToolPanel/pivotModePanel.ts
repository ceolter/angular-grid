import type { AgCheckbox } from 'ag-grid-community';
import { AgToggleButtonSelector, Component, RefPlaceholder } from 'ag-grid-community';

export class PivotModePanel extends Component {
    private readonly cbPivotMode: AgCheckbox = RefPlaceholder;

    private createTemplate(): string {
        return /* html */ `<div class="ag-pivot-mode-panel">
                <ag-toggle-button data-ref="cbPivotMode" class="ag-pivot-mode-select"></ag-toggle-button>
            </div>`;
    }

    public postConstruct(): void {
        this.setTemplate(this.createTemplate(), [AgToggleButtonSelector]);

        const cbPivotMode = this.cbPivotMode;
        const { colModel, ctrlsSvc, gos } = this.beans;

        cbPivotMode.setValue(colModel.isPivotMode());
        const localeTextFunc = this.getLocaleTextFunc();
        cbPivotMode.setLabel(localeTextFunc('pivotMode', 'Pivot Mode'));

        const onBtPivotMode = () => {
            const newValue = !!cbPivotMode.getValue();
            if (newValue !== colModel.isPivotMode()) {
                gos.updateGridOptions({ options: { pivotMode: newValue }, source: 'toolPanelUi' as any });
                ctrlsSvc.getHeaderRowContainerCtrls().forEach((c) => c.refresh());
            }
        };

        const onPivotModeChanged = () => {
            const pivotModeActive = colModel.isPivotMode();
            cbPivotMode.setValue(pivotModeActive);
        };

        this.addManagedListeners(cbPivotMode, { fieldValueChanged: onBtPivotMode });
        this.addManagedEventListeners({
            newColumnsLoaded: onPivotModeChanged,
            columnPivotModeChanged: onPivotModeChanged,
        });
    }
}
