import { KeyCode } from '../constants/keyCode';
import type { AgPickerFieldParams } from '../interfaces/agFieldParams';
import { _shouldDisplayTooltip } from '../tooltip/tooltipFeature';
import type { ITooltipCtrl, TooltipFeature } from '../tooltip/tooltipFeature';
import { _setAriaControls } from '../utils/aria';
import type { ListOption } from './agList';
import { AgList } from './agList';
import { AgPickerField } from './agPickerField';
import { agSelectCSS } from './agSelect.css-GENERATED';
import type { ComponentSelector } from './component';

export interface AgSelectParams<TValue = string>
    extends Omit<AgPickerFieldParams, 'pickerType' | 'pickerAriaLabelKey' | 'pickerAriaLabelValue'> {
    options?: ListOption<TValue>[];
    pickerType?: string;
    pickerAriaLabelKey?: string;
    pickerAriaLabelValue?: string;
    placeholder?: string;
}
export type AgSelectEvent = 'selectedItem';
export class AgSelect<TValue = string | null> extends AgPickerField<
    TValue,
    AgSelectParams<TValue> & AgPickerFieldParams,
    AgSelectEvent,
    AgList<AgSelectEvent, TValue>
> {
    protected listComponent: AgList<AgSelectEvent, TValue> | undefined;
    private tooltipFeature?: TooltipFeature;

    constructor(config?: AgSelectParams<TValue>) {
        super({
            pickerAriaLabelKey: 'ariaLabelSelectField',
            pickerAriaLabelValue: 'Select Field',
            pickerType: 'ag-list',
            className: 'ag-select',
            pickerIcon: 'selectOpen',
            ariaRole: 'combobox',
            ...config,
        });
        this.registerCSS(agSelectCSS);
    }

    public override postConstruct(): void {
        this.tooltipFeature = this.createOptionalManagedBean(
            this.beans.registry.createDynamicBean<TooltipFeature>('tooltipFeature', false, {
                shouldDisplayTooltip: _shouldDisplayTooltip(() => this.eDisplayField),
                getGui: () => this.getGui(),
            } as ITooltipCtrl)
        );
        super.postConstruct();
        this.createListComponent();
        this.eWrapper.tabIndex = this.gos.get('tabIndex');

        const { options, value, placeholder } = this.config;
        if (options != null) {
            this.addOptions(options);
        }
        if (value != null) {
            // need to reapply value after list component created
            this.setValue(value, true);
        }
        if (placeholder && value == null) {
            this.eDisplayField.textContent = placeholder;
        }

        this.addManagedElementListeners(this.eWrapper, { focusout: this.onWrapperFocusOut.bind(this) });
    }

    private onWrapperFocusOut(e: FocusEvent): void {
        if (!this.eWrapper.contains(e.relatedTarget as Element)) {
            this.hidePicker();
        }
    }

    private createListComponent(): void {
        const listComponent = this.createBean(new AgList<AgSelectEvent, TValue>('select', true));
        this.listComponent = listComponent;
        listComponent.setParentComponent(this);

        const eListAriaEl = listComponent.getAriaElement();
        const listId = `ag-select-list-${listComponent.getCompId()}`;

        eListAriaEl.setAttribute('id', listId);
        _setAriaControls(this.getAriaElement(), eListAriaEl);

        listComponent.addManagedListeners(listComponent, {
            selectedItem: () => {
                this.hidePicker();
                this.dispatchLocalEvent({ type: 'selectedItem' });
            },
        });

        listComponent.addManagedListeners(listComponent, {
            fieldValueChanged: () => {
                if (!this.listComponent) {
                    return;
                }
                this.setValue(this.listComponent.getValue()!, false, true);
                this.hidePicker();
            },
        });
    }

    protected createPickerComponent() {
        // do not create the picker every time to save state
        return this.listComponent!;
    }

    protected override onKeyDown(e: KeyboardEvent): void {
        const { key } = e;

        if (key === KeyCode.TAB) {
            this.hidePicker();
        }

        switch (key) {
            case KeyCode.ENTER:
            case KeyCode.UP:
            case KeyCode.DOWN:
            case KeyCode.PAGE_UP:
            case KeyCode.PAGE_DOWN:
            case KeyCode.PAGE_HOME:
            case KeyCode.PAGE_END:
                e.preventDefault();
                if (this.isPickerDisplayed) {
                    this.listComponent?.handleKeyDown(e);
                } else {
                    super.onKeyDown(e);
                }
                break;
            case KeyCode.ESCAPE:
                super.onKeyDown(e);
                break;
            case KeyCode.SPACE:
                if (this.isPickerDisplayed) {
                    e.preventDefault();
                } else {
                    super.onKeyDown(e);
                }
                break;
        }
    }

    public override showPicker() {
        const listComponent = this.listComponent;
        if (!listComponent) {
            return;
        }

        super.showPicker();

        listComponent.refreshHighlighted();
    }

    public addOptions(options: ListOption<TValue>[]): this {
        options.forEach((option) => this.addOption(option));

        return this;
    }

    public addOption(option: ListOption<TValue>): this {
        this.listComponent!.addOption(option);

        return this;
    }

    public clearOptions(): this {
        this.listComponent?.clearOptions();

        return this;
    }

    public override setValue(value?: TValue, silent?: boolean, fromPicker?: boolean): this {
        const {
            listComponent,
            config: { placeholder },
            eDisplayField,
            tooltipFeature,
        } = this;
        if (this.value === value || !listComponent) {
            return this;
        }

        if (!fromPicker) {
            listComponent.setValue(value, true);
        }

        const newValue = listComponent.getValue();

        if (newValue === this.getValue()) {
            return this;
        }

        let displayValue = listComponent.getDisplayValue();
        if (displayValue == null && placeholder) {
            displayValue = placeholder;
        }

        eDisplayField.textContent = displayValue!;

        tooltipFeature?.setTooltipAndRefresh(displayValue ?? null);

        return super.setValue(value, silent);
    }

    public override destroy(): void {
        this.listComponent = this.destroyBean(this.listComponent);

        super.destroy();
    }
}

export const AgSelectSelector: ComponentSelector = {
    selector: 'AG-SELECT',
    component: AgSelect,
};
