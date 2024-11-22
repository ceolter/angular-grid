import type { AgInputFieldParams } from '../interfaces/agFieldParams';
import { _exists } from '../utils/generic';
import { _isEventFromPrintableCharacter } from '../utils/keyboard';
import type { AgAbstractInputFieldEvent } from './agAbstractInputField';
import { AgAbstractInputField } from './agAbstractInputField';
import type { ComponentSelector } from './component';

export interface AgInputTextFieldParams extends AgInputFieldParams {
    allowedCharPattern?: string;
}
export type AgInputTextFieldEvent = AgAbstractInputFieldEvent;
export class AgInputTextField<
    TConfig extends AgInputTextFieldParams = AgInputTextFieldParams,
    TEventType extends string = AgInputTextFieldEvent,
> extends AgAbstractInputField<HTMLInputElement, string, TConfig, AgInputTextFieldEvent | TEventType> {
    constructor(config?: TConfig, className = 'ag-text-field', inputType = 'text') {
        super(config, className, inputType);
    }

    public override postConstruct() {
        super.postConstruct();

        if (this.config.allowedCharPattern) {
            this.preventDisallowedCharacters();
        }
    }

    public override setValue(value?: string | null, silent?: boolean): this {
        const eInput = this.eInput;
        // update the input before we call super.setValue, so it's updated before the value changed event is fired
        if (eInput.value !== value) {
            eInput.value = _exists(value) ? value : '';
        }

        return super.setValue(value, silent);
    }

    /** Used to set an initial value into the input without necessarily setting `this.value` or triggering events (e.g. to set an invalid value) */
    public setStartValue(value?: string | null): void {
        this.setValue(value, true);
    }

    private preventDisallowedCharacters(): void {
        const pattern = new RegExp(`[${this.config.allowedCharPattern}]`);

        const preventCharacters = (event: KeyboardEvent) => {
            if (!_isEventFromPrintableCharacter(event)) {
                return;
            }

            if (event.key && !pattern.test(event.key)) {
                event.preventDefault();
            }
        };

        this.addManagedListeners(this.eInput, {
            keydown: preventCharacters,
            paste: (e: ClipboardEvent) => {
                const text = e.clipboardData?.getData('text');

                if (text && text.split('').some((c: string) => !pattern.test(c))) {
                    e.preventDefault();
                }
            },
        });
    }
}
export const AgInputTextFieldSelector: ComponentSelector = {
    selector: 'AG-INPUT-TEXT-FIELD',
    component: AgInputTextField,
};
