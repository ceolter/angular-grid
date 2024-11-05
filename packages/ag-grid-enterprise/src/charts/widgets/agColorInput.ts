import { _Util } from 'ag-charts-community';

import type { AgInputTextFieldParams, BeanCollection, ComponentSelector } from 'ag-grid-community';
import { AgInputTextField, RefPlaceholder } from 'ag-grid-community';

import type { ChartTranslationService } from '../chartComp/services/chartTranslationService';

export type AgColorInputEvent = 'colorChanged';
export class AgColorInput extends AgInputTextField<AgInputTextFieldParams, AgColorInputEvent> {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }
    private readonly eColor: HTMLElement = RefPlaceholder;

    constructor() {
        super({
            template: /* html */ `
            <div role="presentation" class="ag-color-input">
                <div data-ref="eLabel" class="ag-input-field-label"></div>
                <div data-ref="eWrapper" class="ag-wrapper ag-input-wrapper" role="presentation">
                    <input data-ref="eInput" class="ag-input-field-input">
                    <div data-ref="eColor" class="ag-color-input-color"></div>
                </div>
            </div>`,
        });
    }

    public setColor(color: _Util.Color): void {
        const rgbaColor = color.toRgbaString();
        this.setValue(_Util.Color.fromString(rgbaColor).toHexString().toUpperCase(), true);
        this.eColor.style.backgroundColor = rgbaColor;
    }

    public override setValue(value?: string | null | undefined, silent?: boolean | undefined): this {
        const isValid = _Util.Color.validColorString(value ?? '');
        this.eInput.setCustomValidity(isValid ? '' : this.chartTranslation.translate('invalidColor'));
        super.setValue(value, silent);
        if (isValid && !silent) {
            this.dispatchLocalEvent({ type: 'colorChanged' });
        }
        return this;
    }

    public onColorChanged(callback: (color: _Util.Color) => void): void {
        this.addManagedListeners(this, { colorChanged: () => callback(_Util.Color.fromString(this.value!)) });
    }
}

export const AgColorInputSelector: ComponentSelector = {
    selector: 'AG-COLOR-INPUT',
    component: AgColorInput,
};
