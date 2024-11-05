import { _getActiveDomElement } from '../gridOptionsUtils';
import { _isBrowserSafari } from '../utils/browser';
import { _parseDateTimeFromString, _serialiseDate } from '../utils/date';
import { _addOrRemoveAttribute } from '../utils/dom';
import type { AgInputTextFieldParams } from './agInputTextField';
import { AgInputTextField } from './agInputTextField';
import type { ComponentSelector } from './component';

export class AgInputDateField extends AgInputTextField {
    private min?: string;
    private max?: string;
    private step?: number;

    constructor(config?: AgInputTextFieldParams) {
        super(config, 'ag-date-field', 'date');
    }

    public override postConstruct() {
        super.postConstruct();

        // ensures that the input element is focussed when a clear button is clicked,
        // unless using safari as there is no clear button and focus does not work properly
        const usingSafari = _isBrowserSafari();
        this.addManagedListeners(this.eInput, {
            wheel: this.onWheel.bind(this),
            mousedown: () => {
                if (this.isDisabled() || usingSafari) {
                    return;
                }
                this.eInput.focus();
            },
        });
        this.eInput.step = 'any';
    }

    private onWheel(e: WheelEvent) {
        // Prevent default scroll events from incrementing / decrementing the input, since its inconsistent between browsers
        if (_getActiveDomElement(this.beans) === this.eInput) {
            e.preventDefault();
        }
    }

    public setMin(minDate: Date | string | undefined): this {
        const min = minDate instanceof Date ? _serialiseDate(minDate ?? null, false) ?? undefined : minDate;
        if (this.min === min) {
            return this;
        }

        this.min = min;

        _addOrRemoveAttribute(this.eInput, 'min', min);

        return this;
    }

    public setMax(maxDate: Date | string | undefined): this {
        const max = maxDate instanceof Date ? _serialiseDate(maxDate ?? null, false) ?? undefined : maxDate;
        if (this.max === max) {
            return this;
        }

        this.max = max;

        _addOrRemoveAttribute(this.eInput, 'max', max);

        return this;
    }

    public setStep(step?: number): this {
        if (this.step === step) {
            return this;
        }

        this.step = step;

        _addOrRemoveAttribute(this.eInput, 'step', step);

        return this;
    }

    public getDate(): Date | undefined {
        if (!this.eInput.validity.valid) {
            return undefined;
        }
        return _parseDateTimeFromString(this.getValue()) ?? undefined;
    }

    public setDate(date: Date | undefined, silent?: boolean): void {
        this.setValue(_serialiseDate(date ?? null, false), silent);
    }
}

export const AgInputDateFieldSelector: ComponentSelector = {
    selector: 'AG-INPUT-DATE-FIELD',
    component: AgInputDateField,
};
