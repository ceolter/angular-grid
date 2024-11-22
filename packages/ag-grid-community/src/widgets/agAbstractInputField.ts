import type { AgInputFieldParams } from '../interfaces/agFieldParams';
import { _setAriaLabel } from '../utils/aria';
import { _addOrRemoveAttribute, _setDisabled, _setElementWidth } from '../utils/dom';
import type { AgAbstractFieldEvent, FieldElement } from './agAbstractField';
import { AgAbstractField } from './agAbstractField';
import { RefPlaceholder } from './component';

export type AgAbstractInputFieldEvent = AgAbstractFieldEvent;
export abstract class AgAbstractInputField<
    TElement extends FieldElement,
    TValue,
    TConfig extends AgInputFieldParams = AgInputFieldParams,
    TEventType extends string = AgAbstractInputFieldEvent,
> extends AgAbstractField<TValue, TConfig, AgAbstractInputFieldEvent | TEventType> {
    protected readonly eLabel: HTMLElement = RefPlaceholder;
    protected readonly eWrapper: HTMLElement = RefPlaceholder;
    protected readonly eInput: TElement = RefPlaceholder;

    constructor(
        config?: TConfig,
        className?: string,
        private readonly inputType: string | null = 'text',
        private readonly displayFieldTag = 'input'
    ) {
        super(
            config,
            config?.template ??
                /* html */ `
            <div role="presentation">
                <div data-ref="eLabel" class="ag-input-field-label"></div>
                <div data-ref="eWrapper" class="ag-wrapper ag-input-wrapper" role="presentation">
                    <${displayFieldTag} data-ref="eInput" class="ag-input-field-input"></${displayFieldTag}>
                </div>
            </div>`,
            [],
            className
        );
    }

    public override postConstruct() {
        super.postConstruct();
        this.setInputType();

        const { eLabel, eWrapper, eInput, className } = this;
        eLabel.classList.add(`${className}-label`);
        eWrapper.classList.add(`${className}-input-wrapper`);
        eInput.classList.add(`${className}-input`);
        this.addCssClass('ag-input-field');

        eInput.id = eInput.id || `ag-${this.getCompId()}-input`;

        const { inputName, inputWidth } = this.config;
        if (inputName != null) {
            this.setInputName(inputName);
        }
        if (inputWidth != null) {
            this.setInputWidth(inputWidth);
        }

        this.addInputListeners();
        this.activateTabIndex([eInput]);
    }

    protected addInputListeners() {
        this.addManagedElementListeners(this.eInput, { input: (e: any) => this.setValue(e.target.value) });
    }

    private setInputType() {
        if (this.displayFieldTag === 'input') {
            this.eInput.setAttribute('type', this.inputType!);
        }
    }

    public getInputElement(): TElement {
        return this.eInput;
    }

    public setInputWidth(width: number | 'flex'): this {
        _setElementWidth(this.eWrapper, width);

        return this;
    }

    public setInputName(name: string): this {
        this.getInputElement().setAttribute('name', name);

        return this;
    }

    public override getFocusableElement(): HTMLElement {
        return this.eInput;
    }

    public setMaxLength(length: number): this {
        const eInput = this.eInput as HTMLInputElement | HTMLTextAreaElement;
        eInput.maxLength = length;

        return this;
    }

    public setInputPlaceholder(placeholder?: string | null): this {
        _addOrRemoveAttribute(this.eInput, 'placeholder', placeholder);

        return this;
    }

    public setInputAriaLabel(label?: string | null): this {
        _setAriaLabel(this.eInput, label);
        this.refreshAriaLabelledBy();

        return this;
    }

    public override setDisabled(disabled: boolean): this {
        _setDisabled(this.eInput, disabled);

        return super.setDisabled(disabled);
    }

    public setAutoComplete(value: boolean | string) {
        if (value === true) {
            // Remove the autocomplete attribute if the value is explicitly set to true
            // to allow the default browser autocomplete/autofill behaviour.
            _addOrRemoveAttribute(this.eInput, 'autocomplete', null);
        } else {
            // When a string is provided, use it as the value of the autocomplete attribute.
            // This enables users to specify how they want to the browser to handle the autocomplete on the input, as per spec:
            // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete#values
            const autoCompleteValue = typeof value === 'string' ? value : 'off';
            _addOrRemoveAttribute(this.eInput, 'autocomplete', autoCompleteValue);
        }
        return this;
    }
}
