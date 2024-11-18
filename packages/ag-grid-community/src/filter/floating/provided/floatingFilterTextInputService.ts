import { BeanStub } from '../../../context/beanStub';
import type { AgInputTextFieldParams } from '../../../widgets/agInputTextField';
import { AgInputTextField } from '../../../widgets/agInputTextField';
import { RefPlaceholder } from '../../../widgets/component';
import type { FloatingFilterInputService } from './iFloatingFilterInputService';

export class FloatingFilterTextInputService extends BeanStub implements FloatingFilterInputService {
    private eInput: AgInputTextField = RefPlaceholder;
    private onValueChanged: (e: KeyboardEvent) => void = () => {};

    constructor(private params?: { config?: AgInputTextFieldParams }) {
        super();
    }

    public setupGui(parentElement: HTMLElement): void {
        this.eInput = this.createManagedBean(new AgInputTextField(this.params?.config));

        const eInput = this.eInput.getGui();

        parentElement.appendChild(eInput);

        const listener = (e: KeyboardEvent) => this.onValueChanged(e);
        this.addManagedListeners(eInput, {
            input: listener,
            keydown: listener,
        });
    }

    public setEditable(editable: boolean): void {
        this.eInput.setDisabled(!editable);
    }

    public getValue(): string | null | undefined {
        return this.eInput.getValue();
    }

    public setValue(value: string | null | undefined, silent?: boolean): void {
        this.eInput.setValue(value, silent);
    }

    public setValueChangedListener(listener: (e: KeyboardEvent) => void): void {
        this.onValueChanged = listener;
    }

    public setParams({ ariaLabel, autoComplete }: { ariaLabel: string; autoComplete?: boolean | string }): void {
        const { eInput } = this;
        eInput.setInputAriaLabel(ariaLabel);

        if (autoComplete !== undefined) {
            eInput.setAutoComplete(autoComplete);
        }
    }
}
