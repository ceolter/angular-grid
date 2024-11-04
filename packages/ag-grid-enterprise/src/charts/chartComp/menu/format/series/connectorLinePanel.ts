import type { BeanCollection } from 'ag-grid-community';
import { Component } from 'ag-grid-community';

import { AgGroupComponentSelector } from '../../../../../widgets/agGroupComponent';
import type { AgGroupComponentParams } from '../../../../../widgets/agGroupComponent';
import { AgColorPickerSelector } from '../../../../widgets/agColorPicker';
import type { AgSliderParams } from '../../../../widgets/agSlider';
import { AgSliderSelector } from '../../../../widgets/agSlider';
import type { ChartTranslationKey, ChartTranslationService } from '../../../services/chartTranslationService';
import type { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';

export class ConnectorLinePanel extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }
    constructor(private readonly chartMenuUtils: ChartMenuParamsFactory) {
        super();
    }

    public postConstruct() {
        const lineGroupParams: AgGroupComponentParams = {
            cssIdentifier: 'charts-format-sub-level',
            direction: 'vertical',
            title: this.chartTranslation.translate('connectorLine'),
            enabled: true,
            suppressOpenCloseIcons: true,
            suppressEnabledCheckbox: true,
        };
        this.setTemplate(
            /* html */ `<div>
            <ag-group-component data-ref="lineGroup">
                <ag-color-picker data-ref="lineColorPicker"></ag-color-picker>
                <ag-slider data-ref="lineStrokeWidthSlider"></ag-slider>
                <ag-slider data-ref="lineOpacitySlider"></ag-slider>
                <ag-slider data-ref="lineDashSlider"></ag-slider>                
            </ag-group-component>
        </div>`,
            [AgGroupComponentSelector, AgColorPickerSelector, AgSliderSelector],
            {
                lineGroup: lineGroupParams,
                lineColorPicker: this.chartMenuUtils.getDefaultColorPickerParams('line.stroke'),
                lineStrokeWidthSlider: this.getSliderParams('strokeWidth', 10, 'line.strokeWidth'),
                lineDashSlider: this.getSliderParams('lineDash', 30, 'line.lineDash', 1, true),
                lineOpacitySlider: this.getSliderParams('strokeOpacity', 1, 'line.strokeOpacity', 0.05),
            }
        );
    }

    private getSliderParams(
        labelKey: ChartTranslationKey,
        maxValue: number,
        seriesOptionKey: string,
        step: number = 1,
        isArray: boolean = false
    ): AgSliderParams {
        const params = this.chartMenuUtils.getDefaultSliderParams(seriesOptionKey, labelKey, maxValue, isArray);
        params.step = step;
        return params;
    }
}
