import type { CheckboxChangedEvent } from '../events';
import type { AgCheckboxParams } from '../interfaces/agFieldParams';
import { AgCheckbox } from './agCheckbox';

export interface AgRadioButtonParams extends AgCheckboxParams {}

export class AgRadioButton extends AgCheckbox<AgRadioButtonParams> {
    constructor(config?: AgRadioButtonParams) {
        super(config, 'ag-radio-button', 'radio');
    }

    protected override isSelected(): boolean {
        return this.eInput.checked;
    }

    public override toggle(): void {
        if (this.eInput.disabled) {
            return;
        }

        // do not allow an active radio button to be deselected
        if (!this.isSelected()) {
            this.setValue(true);
        }
    }

    protected override addInputListeners() {
        super.addInputListeners();

        this.addManagedEventListeners({ checkboxChanged: this.onChange.bind(this) });
    }

    /**
     * This ensures that if another radio button in the same named group is selected, we deselect this radio button.
     * By default the browser does this for you, but we are managing classes ourselves in order to ensure input
     * elements are styled correctly in IE11, and the DOM 'changed' event is only fired when a button is selected,
     * not deselected, so we need to use our own event.
     */
    private onChange(event: CheckboxChangedEvent) {
        const eInput = this.eInput;
        if (
            event.selected &&
            event.name &&
            eInput.name &&
            eInput.name === event.name &&
            event.id &&
            eInput.id !== event.id
        ) {
            this.setValue(false, true);
        }
    }
}
