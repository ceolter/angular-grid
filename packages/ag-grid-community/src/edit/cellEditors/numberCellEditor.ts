import { KeyCode } from '../../constants/keyCode';
import { _isBrowserSafari } from '../../utils/browser';
import { _exists } from '../../utils/generic';
import type { AgInputNumberField } from '../../widgets/agInputNumberField';
import { AgInputNumberFieldSelector } from '../../widgets/agInputNumberField';
import type { CellEditorInput } from './iCellEditorInput';
import type { INumberCellEditorParams } from './iNumberCellEditor';
import { SimpleCellEditor } from './simpleCellEditor';

class NumberCellEditorInput implements CellEditorInput<number, INumberCellEditorParams, AgInputNumberField> {
    private eInput: AgInputNumberField;
    private params: INumberCellEditorParams;

    public getTemplate() {
        return /* html */ `<ag-input-number-field class="ag-cell-editor" data-ref="eInput"></ag-input-number-field>`;
    }
    public getAgComponents() {
        return [AgInputNumberFieldSelector];
    }

    public init(eInput: AgInputNumberField, params: INumberCellEditorParams): void {
        this.eInput = eInput;
        this.params = params;
        const { max, min, precision, step } = params;
        if (max != null) {
            eInput.setMax(max);
        }
        if (min != null) {
            eInput.setMin(min);
        }
        if (precision != null) {
            eInput.setPrecision(precision);
        }
        if (step != null) {
            eInput.setStep(step);
        }

        const inputEl = eInput.getInputElement();
        if (params.preventStepping) {
            eInput.addManagedElementListeners(inputEl, { keydown: this.preventStepping });
        } else if (params.showStepperButtons) {
            inputEl.classList.add('ag-number-field-input-stepper');
        }
    }

    private preventStepping(e: KeyboardEvent): void {
        if (e.key === KeyCode.UP || e.key === KeyCode.DOWN) {
            e.preventDefault();
        }
    }

    public getValue(): number | null | undefined {
        const { eInput, params } = this;
        const value = eInput.getValue();
        if (!_exists(value) && !_exists(params.value)) {
            return params.value;
        }
        let parsedValue = params.parseValue(value!);
        if (parsedValue == null) {
            return parsedValue;
        }
        if (typeof parsedValue === 'string') {
            if (parsedValue === '') {
                return null;
            }
            parsedValue = Number(parsedValue);
        }
        return isNaN(parsedValue) ? null : parsedValue;
    }

    public getStartValue(): string | null | undefined {
        return this.params.value as any;
    }

    public setCaret(): void {
        if (_isBrowserSafari()) {
            // If not safari, input is already focused.
            // For safari we need to focus only for this use case to avoid AG-3238,
            // but still ensure the input has focus.
            this.eInput.getInputElement().focus({ preventScroll: true });
        }
    }
}

export class NumberCellEditor extends SimpleCellEditor<number, INumberCellEditorParams, AgInputNumberField> {
    constructor() {
        super(new NumberCellEditorInput());
    }
}
