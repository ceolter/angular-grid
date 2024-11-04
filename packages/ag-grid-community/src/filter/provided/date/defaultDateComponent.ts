import { _getActiveDomElement } from '../../../gridOptionsUtils';
import type { IDateComp, IDateParams } from '../../../interfaces/dateComponent';
import type { IAfterGuiAttachedParams } from '../../../interfaces/iAfterGuiAttachedParams';
import { _isBrowserSafari } from '../../../utils/browser';
import { _dateToFormattedString, _parseDateTimeFromString, _serialiseDate } from '../../../utils/date';
import { _warn } from '../../../validation/logging';
import type { AgInputTextField } from '../../../widgets/agInputTextField';
import { AgInputTextFieldSelector } from '../../../widgets/agInputTextField';
import { Component, RefPlaceholder } from '../../../widgets/component';

export class DefaultDateComponent extends Component implements IDateComp {
    private readonly eDateInput: AgInputTextField = RefPlaceholder;

    constructor() {
        super(
            /* html */ `
            <div class="ag-filter-filter">
                <ag-input-text-field class="ag-date-filter" data-ref="eDateInput"></ag-input-text-field>
            </div>`,
            [AgInputTextFieldSelector]
        );
    }

    private params: IDateParams;
    private usingSafariDatePicker: boolean;
    private isApply: boolean = false;
    private applyOnFocusOut: boolean = false;

    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so we need to override destroy() just to make the method public.
    public override destroy(): void {
        super.destroy();
    }

    public init(params: IDateParams): void {
        this.params = params;
        this.setParams(params);

        const inputElement = this.eDateInput.getInputElement();

        this.addManagedListeners(inputElement, {
            // ensures that the input element is focussed when a clear button is clicked,
            // unless using safari as there is no clear button and focus does not work properly
            mouseDown: () => {
                if (this.eDateInput.isDisabled() || this.usingSafariDatePicker) {
                    return;
                }
                inputElement.focus({ preventScroll: true });
            },
            input: this.handleInput.bind(this, false),
            change: this.handleInput.bind(this, true),
            focusout: this.handleFocusOut.bind(this),
        });
    }

    private handleInput(isChange: boolean, e: InputEvent): void {
        if (e.target !== _getActiveDomElement(this.gos)) {
            return;
        }
        if (this.eDateInput.isDisabled()) {
            return;
        }

        if (this.isApply) {
            // If it's input event, queue up apply on focus out.
            // If it's change, clear and run.
            this.applyOnFocusOut = !isChange;
            if (isChange) {
                this.params.onDateChanged();
            }
            return;
        }

        if (!isChange) {
            // if not apply, execute on input
            this.params.onDateChanged();
        }
    }

    private handleFocusOut(): void {
        if (this.applyOnFocusOut) {
            this.applyOnFocusOut = false;
            this.params.onDateChanged();
        }
    }

    private setParams(params: IDateParams): void {
        const inputElement = this.eDateInput.getInputElement();

        const shouldUseBrowserDatePicker = this.shouldUseBrowserDatePicker(params);
        this.usingSafariDatePicker = shouldUseBrowserDatePicker && _isBrowserSafari();

        inputElement.type = shouldUseBrowserDatePicker ? 'date' : 'text';

        const { minValidYear, maxValidYear, minValidDate, maxValidDate, buttons } = params.filterParams || {};

        if (minValidDate && minValidYear) {
            _warn(85);
        }

        if (maxValidDate && maxValidYear) {
            _warn(86);
        }

        if (minValidDate && maxValidDate) {
            const [parsedMinValidDate, parsedMaxValidDate] = [minValidDate, maxValidDate].map((v) =>
                v instanceof Date ? v : _parseDateTimeFromString(v)
            );

            if (
                parsedMinValidDate &&
                parsedMaxValidDate &&
                parsedMinValidDate.getTime() > parsedMaxValidDate.getTime()
            ) {
                _warn(87);
            }
        }

        if (minValidDate) {
            if (minValidDate instanceof Date) {
                inputElement.min = _dateToFormattedString(minValidDate);
            } else {
                inputElement.min = minValidDate;
            }
        } else {
            if (minValidYear) {
                inputElement.min = `${minValidYear}-01-01`;
            }
        }

        if (maxValidDate) {
            if (maxValidDate instanceof Date) {
                inputElement.max = _dateToFormattedString(maxValidDate);
            } else {
                inputElement.max = maxValidDate;
            }
        } else {
            if (maxValidYear) {
                inputElement.max = `${maxValidYear}-12-31`;
            }
        }

        this.isApply = params.location === 'floatingFilter' && !!buttons?.includes('apply');
    }

    public refresh(params: IDateParams): void {
        this.params = params;
        this.setParams(params);
    }

    public getDate(): Date | null {
        return _parseDateTimeFromString(this.eDateInput.getValue());
    }

    public setDate(date: Date): void {
        this.eDateInput.setValue(_serialiseDate(date, false));
    }

    public setInputPlaceholder(placeholder: string): void {
        this.eDateInput.setInputPlaceholder(placeholder);
    }

    public setInputAriaLabel(ariaLabel: string): void {
        this.eDateInput.setAriaLabel(ariaLabel);
    }

    public setDisabled(disabled: boolean): void {
        this.eDateInput.setDisabled(disabled);
    }

    public afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        if (!params || !params.suppressFocus) {
            this.eDateInput.getInputElement().focus({ preventScroll: true });
        }
    }

    private shouldUseBrowserDatePicker(params: IDateParams): boolean {
        return params?.filterParams?.browserDatePicker ?? true;
    }
}
