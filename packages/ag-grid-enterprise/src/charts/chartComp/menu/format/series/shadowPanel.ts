import type { BeanCollection } from 'ag-grid-community';
import { Component } from 'ag-grid-community';

import type { AgGroupComponentParams } from '../../../../../widgets/agGroupComponent';
import { AgGroupComponentSelector } from '../../../../../widgets/agGroupComponent';
import { AgColorPickerSelector } from '../../../../widgets/agColorPicker';
import type { AgSliderParams } from '../../../../widgets/agSlider';
import { AgSliderSelector } from '../../../../widgets/agSlider';
import type { ChartTranslationKey, ChartTranslationService } from '../../../services/chartTranslationService';
import type { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';

export class ShadowPanel extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }
    constructor(
        private readonly chartMenuUtils: ChartMenuParamsFactory,
        private propertyKey: string = 'shadow'
    ) {
        super();
    }

    public postConstruct() {
        // Determine the path within the series options object to get/set the individual shadow options
        const propertyNamespace = this.propertyKey;
        const shadowGroupParams = this.chartMenuUtils.addEnableParams<AgGroupComponentParams>(
            `${propertyNamespace}.enabled`,
            {
                cssIdentifier: 'charts-format-sub-level',
                direction: 'vertical',
                suppressOpenCloseIcons: true,
                title: this.chartTranslation.translate('shadow'),
                suppressEnabledCheckbox: true,
                useToggle: true,
            }
        );
        const shadowColorPickerParams = this.chartMenuUtils.getDefaultColorPickerParams(`${propertyNamespace}.color`);
        this.setTemplate(
            /* html */ `<div>
            <ag-group-component data-ref="shadowGroup">
                <ag-color-picker data-ref="shadowColorPicker"></ag-color-picker>
                <ag-slider data-ref="shadowBlurSlider"></ag-slider>
                <ag-slider data-ref="shadowXOffsetSlider"></ag-slider>
                <ag-slider data-ref="shadowYOffsetSlider"></ag-slider>
            </ag-group-component>
        </div>`,
            [AgGroupComponentSelector, AgColorPickerSelector, AgSliderSelector],
            {
                shadowGroup: shadowGroupParams,
                shadowColorPicker: shadowColorPickerParams,
                shadowBlurSlider: this.getSliderParams('blur', 0, 20),
                shadowXOffsetSlider: this.getSliderParams('xOffset', -10, 10),
                shadowYOffsetSlider: this.getSliderParams('yOffset', -10, 10),
            }
        );
    }

    private getSliderParams(property: ChartTranslationKey, minValue: number, defaultMaxValue: number): AgSliderParams {
        const expression = `${this.propertyKey}.${property}`;
        const params = this.chartMenuUtils.getDefaultSliderParams(expression, property, defaultMaxValue);
        params.minValue = minValue;
        return params;
    }
}
