import type { ICellEditorComp, ICellEditorParams } from '../../interfaces/iCellEditor';
import { _getAriaCheckboxStateName } from '../../utils/aria';
import type { AgCheckbox } from '../../widgets/agCheckbox';
import { AgCheckboxSelector } from '../../widgets/agCheckbox';
import { RefPlaceholder } from '../../widgets/component';
import { PopupComponent } from '../../widgets/popupComponent';

export class CheckboxCellEditor extends PopupComponent implements ICellEditorComp {
    constructor() {
        super(
            /* html */ `
            <div class="ag-cell-wrapper ag-cell-edit-wrapper ag-checkbox-edit">
                <ag-checkbox role="presentation" data-ref="eCheckbox"></ag-checkbox>
            </div>`,
            [AgCheckboxSelector]
        );
    }

    private readonly eCheckbox: AgCheckbox = RefPlaceholder;
    private params: ICellEditorParams<any, boolean>;

    public init(params: ICellEditorParams<any, boolean>): void {
        this.params = params;
        const isSelected = params.value ?? undefined;

        const eCheckbox = this.eCheckbox;
        eCheckbox.setValue(isSelected);

        const inputEl = eCheckbox.getInputElement();
        inputEl.setAttribute('tabindex', '-1');

        this.setAriaLabel(isSelected);

        this.addManagedListeners(eCheckbox, {
            fieldValueChanged: (event: { selected?: boolean }) => this.setAriaLabel(event.selected),
        });
    }

    public getValue(): boolean | undefined {
        return this.eCheckbox.getValue();
    }

    public focusIn(): void {
        this.eCheckbox.getFocusableElement().focus();
    }

    public afterGuiAttached(): void {
        if (this.params.cellStartedEdit) {
            this.focusIn();
        }
    }

    public override isPopup() {
        return false;
    }

    private setAriaLabel(isSelected?: boolean): void {
        const translate = this.getLocaleTextFunc();
        const stateName = _getAriaCheckboxStateName(translate, isSelected);
        const ariaLabel = translate('ariaToggleCellValue', 'Press SPACE to toggle cell value');
        this.eCheckbox.setInputAriaLabel(`${ariaLabel} (${stateName})`);
    }
}
