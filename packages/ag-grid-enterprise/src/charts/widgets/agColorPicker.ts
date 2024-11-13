import type { AgPickerFieldParams, BeanCollection, ComponentSelector } from 'ag-grid-community';
import { AgPickerField, _getDocument } from 'ag-grid-community';

import { AgDialog } from '../../widgets/agDialog';
import type { AgChartsExports } from '../agChartsExports';
import { AgColorPanel } from './agColorPanel';

export interface AgColorPickerParams
    extends Omit<AgPickerFieldParams, 'pickerType' | 'pickerAriaLabelKey' | 'pickerAriaLabelValue'> {
    pickerType?: string;
    pickerAriaLabelKey?: string;
    pickerAriaLabelValue?: string;
}

export class AgColorPicker extends AgPickerField<string, AgColorPickerParams & AgPickerFieldParams, string, AgDialog> {
    private isDestroyingPicker: boolean;
    private eDisplayFieldColor: HTMLElement;
    private eDisplayFieldText: HTMLElement;

    constructor(config?: AgColorPickerParams) {
        super({
            pickerAriaLabelKey: 'ariaLabelColorPicker',
            pickerAriaLabelValue: 'Color Picker',
            pickerType: 'ag-list',
            className: 'ag-color-picker',
            pickerIcon: 'chartsColorPicker',
            ...config,
        });
    }

    public override wireBeans(beans: BeanCollection): void {
        super.wireBeans(beans);
    }

    public override postConstruct() {
        const eDocument = _getDocument(this.beans);
        this.eDisplayFieldColor = eDocument.createElement('span');
        this.eDisplayFieldColor.classList.add('ag-color-picker-color');
        this.eDisplayFieldText = eDocument.createElement('span');
        this.eDisplayFieldText.classList.add('ag-color-picker-value');
        this.eDisplayField.appendChild(this.eDisplayFieldColor);
        this.eDisplayField.appendChild(this.eDisplayFieldText);

        super.postConstruct();

        if (this.value) {
            this.setValue(this.value);
        }
    }

    protected createPickerComponent() {
        const eGuiRect = this.eWrapper.getBoundingClientRect();
        const parentRect = this.popupSvc.getParentRect();

        const colorDialog = this.createBean(
            new AgDialog({
                closable: false,
                modal: true,
                hideTitleBar: true,
                minWidth: 190,
                width: 190,
                height: 250,
                x: eGuiRect.right - parentRect.left - 190,
                y: eGuiRect.top - parentRect.top - 250 - (this.config.pickerGap ?? 0),
                postProcessPopupParams: {
                    type: 'colorPicker',
                    eventSource: this.eWrapper,
                },
            })
        );

        return colorDialog;
    }

    protected override renderAndPositionPicker(): () => void {
        const pickerComponent = this.pickerComponent!;
        const colorPanel = this.createBean(new AgColorPanel({ picker: this }));

        pickerComponent.addCssClass('ag-color-dialog');

        colorPanel.addDestroyFunc(() => {
            if (pickerComponent.isAlive()) {
                this.destroyBean(pickerComponent);
            }
        });

        pickerComponent.setParentComponent(this);
        pickerComponent.setBodyComponent(colorPanel);
        colorPanel.setValue(this.getValue());
        colorPanel.getGui().focus();

        pickerComponent.addDestroyFunc(() => {
            // here we check if the picker was already being
            // destroyed to avoid a stack overflow
            if (!this.isDestroyingPicker) {
                this.beforeHidePicker();
                this.isDestroyingPicker = true;

                if (colorPanel.isAlive()) {
                    this.destroyBean(colorPanel);
                }

                if (this.isAlive()) {
                    this.getFocusableElement().focus();
                }
            } else {
                this.isDestroyingPicker = false;
            }
        });

        return () => this.pickerComponent?.close();
    }

    public override setValue(color: string): this {
        if (this.value === color) {
            return this;
        }

        this.eDisplayFieldColor.style.backgroundColor = color;
        this.eDisplayFieldText.textContent = (this.beans.agChartsExports as AgChartsExports)._Util.Color.fromString(
            color
        )
            .toHexString()
            .toUpperCase();

        return super.setValue(color);
    }

    public override getValue(): string {
        return this.value;
    }
}

export const AgColorPickerSelector: ComponentSelector = {
    selector: 'AG-COLOR-PICKER',
    component: AgColorPicker,
};
