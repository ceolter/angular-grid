import { _getActiveDomElement } from '../gridOptionsUtils';
import { _addOrRemoveAttribute } from '../utils/dom';
import { _exists } from '../utils/generic';
import type { AgInputTextFieldParams } from './agInputTextField';
import { AgInputTextField } from './agInputTextField';
import type { ComponentSelector } from './component';

export interface AgInputNumberFieldParams extends AgInputTextFieldParams {
    precision?: number;
    step?: number;
    min?: number;
    max?: number;
}

export class AgInputNumberField extends AgInputTextField<AgInputNumberFieldParams> {
    private precision?: number;
    private step?: number;
    private min?: number;
    private max?: number;

    constructor(config?: AgInputNumberFieldParams) {
        super(config, 'ag-number-field', 'number');
    }

    public override postConstruct() {
        super.postConstruct();
        this.addManagedListeners(this.eInput, {
            blur: () => {
                const floatedValue = parseFloat(this.eInput.value);
                const value = isNaN(floatedValue) ? '' : this.normalizeValue(floatedValue.toString());

                if (this.value !== value) {
                    this.setValue(value);
                }
            },
            wheel: this.onWheel.bind(this),
        });

        this.eInput.step = 'any';

        const { precision, min, max, step } = this.config;
        if (typeof precision === 'number') this.setPrecision(precision);
        if (typeof min === 'number') this.setMin(min);
        if (typeof max === 'number') this.setMax(max);
        if (typeof step === 'number') this.setStep(step);
    }

    private onWheel(e: WheelEvent) {
        // Prevent default scroll events from incrementing / decrementing the input, since its inconsistent between browsers
        if (_getActiveDomElement(this.beans) === this.eInput) {
            e.preventDefault();
        }
    }

    public normalizeValue(value: string): string {
        if (value === '') {
            return '';
        }

        if (this.precision != null) {
            value = this.adjustPrecision(value);
        }

        const val = parseFloat(value);

        if (this.min != null && val < this.min) {
            value = this.min.toString();
        } else if (this.max != null && val > this.max) {
            value = this.max.toString();
        }

        return value;
    }

    private adjustPrecision(value: string, isScientificNotation?: boolean): string {
        if (this.precision == null) {
            return value;
        }
        if (isScientificNotation) {
            const floatString = parseFloat(value).toFixed(this.precision);
            return parseFloat(floatString).toString();
        }

        // can't use toFixed here because we don't want to round up
        const parts = String(value).split('.');
        if (parts.length > 1) {
            if (parts[1].length <= this.precision) {
                return value;
            } else if (this.precision > 0) {
                return `${parts[0]}.${parts[1].slice(0, this.precision)}`;
            }
        }
        return parts[0];
    }

    public setMin(min: number | undefined): this {
        if (this.min === min) {
            return this;
        }

        this.min = min;

        _addOrRemoveAttribute(this.eInput, 'min', min);

        return this;
    }

    public setMax(max: number | undefined): this {
        if (this.max === max) {
            return this;
        }

        this.max = max;

        _addOrRemoveAttribute(this.eInput, 'max', max);

        return this;
    }

    public setPrecision(precision: number): this {
        this.precision = precision;

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

    public override setValue(value?: string | null, silent?: boolean): this {
        return this.setValueOrInputValue(
            (v) => super.setValue(v, silent),
            () => this,
            value
        );
    }

    public override setStartValue(value?: string | null): void {
        return this.setValueOrInputValue<void>(
            (v) => super.setValue(v, true),
            (v) => {
                this.eInput.value = v;
            },
            value
        );
    }

    private setValueOrInputValue<T>(
        setValueFunc: (value?: string | null) => T,
        setInputValueOnlyFunc: (value: string) => T,
        value?: string | null
    ): T {
        if (_exists(value)) {
            // need to maintain the scientific notation format whilst typing (e.g. 1e10)
            let setInputValueOnly = this.isScientificNotation(value);
            if (setInputValueOnly && this.eInput.validity.valid) {
                return setValueFunc(value);
            }
            if (!setInputValueOnly) {
                value = this.adjustPrecision(value);
                const normalizedValue = this.normalizeValue(value);
                // outside of valid range
                setInputValueOnly = value != normalizedValue;
            }

            if (setInputValueOnly) {
                return setInputValueOnlyFunc(value);
            }
        }

        return setValueFunc(value);
    }

    public override getValue(): string | null | undefined {
        if (!this.eInput.validity.valid) {
            return undefined;
        }
        const inputValue = this.eInput.value;
        if (this.isScientificNotation(inputValue)) {
            return this.adjustPrecision(inputValue, true);
        }
        return super.getValue();
    }

    private isScientificNotation(value: string): boolean {
        return typeof value === 'string' && value.includes('e');
    }
}

export const AgInputNumberFieldSelector: ComponentSelector = {
    selector: 'AG-INPUT-NUMBER-FIELD',
    component: AgInputNumberField,
};
