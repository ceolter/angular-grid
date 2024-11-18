import type { IColor, _IUtil } from 'ag-charts-types';

import type { AgInputTextFieldParams, BeanCollection, ComponentSelector } from 'ag-grid-community';
import { AgInputTextField, RefPlaceholder } from 'ag-grid-community';

import type { AgChartsExports } from '../agChartsExports';
import type { ChartTranslationService } from '../chartComp/services/chartTranslationService';

export type AgColorInputEvent = 'colorChanged';
export class AgColorInput extends AgInputTextField<AgInputTextFieldParams, AgColorInputEvent> {
    private chartTranslation: ChartTranslationService;
    private color: _IUtil['Color'];

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
        this.color = (beans.agChartsExports as AgChartsExports)._Util.Color;
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

    public setColor(color: IColor): void {
        const rgbaColor = color.toRgbaString();
        this.setValue(this.color.fromString(rgbaColor).toHexString().toUpperCase(), true);
        this.eColor.style.backgroundColor = rgbaColor;
    }

    public override setValue(value?: string | null | undefined, silent?: boolean | undefined): this {
        const isValid = this.color.validColorString(value ?? '');
        this.eInput.setCustomValidity(isValid ? '' : this.chartTranslation.translate('invalidColor'));
        super.setValue(value, silent);
        if (isValid && !silent) {
            this.dispatchLocalEvent({ type: 'colorChanged' });
        }
        return this;
    }

    public onColorChanged(callback: (color: IColor) => void): void {
        this.addManagedListeners(this, { colorChanged: () => callback(this.color.fromString(this.value!)) });
    }
}

export const AgColorInputSelector: ComponentSelector = {
    selector: 'AG-COLOR-INPUT',
    component: AgColorInput,
};
