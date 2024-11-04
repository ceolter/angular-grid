import type { BeanCollection } from 'ag-grid-community';
import { Component } from 'ag-grid-community';

import type { AgGroupComponentParams } from '../../../../../widgets/agGroupComponent';
import { AgGroupComponentSelector } from '../../../../../widgets/agGroupComponent';
import { AgColorPickerSelector } from '../../../../widgets/agColorPicker';
import { AgSliderSelector } from '../../../../widgets/agSlider';
import type { ChartTranslationService } from '../../../services/chartTranslationService';
import type { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';

export class WhiskersPanel extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }
    constructor(private readonly chartMenuUtils: ChartMenuParamsFactory) {
        super();
    }

    public postConstruct() {
        const whiskersGroupParams: AgGroupComponentParams = {
            cssIdentifier: 'charts-format-sub-level',
            direction: 'vertical',
            title: this.chartTranslation.translate('whisker'),
            enabled: true,
            suppressOpenCloseIcons: true,
            suppressEnabledCheckbox: true,
        };
        this.setTemplate(
            /* html */ `<div>
            <ag-group-component data-ref="whiskersGroup">
                <ag-color-picker data-ref="whiskerColorPicker"></ag-color-picker>
                <ag-slider data-ref="whiskerThicknessSlider"></ag-slider>
                <ag-slider data-ref="whiskerOpacitySlider"></ag-slider>
                <ag-slider data-ref="whiskerLineDashSlider"></ag-slider>
                <ag-slider data-ref="whiskerLineDashOffsetSlider"></ag-slider>
            </ag-group-component>
        </div>`,
            [AgGroupComponentSelector, AgColorPickerSelector, AgSliderSelector],
            {
                whiskersGroup: whiskersGroupParams,
                whiskerColorPicker: this.chartMenuUtils.getDefaultColorPickerParams('whisker.stroke'),
                whiskerThicknessSlider: this.chartMenuUtils.getDefaultSliderParams(
                    'whisker.strokeWidth',
                    'strokeWidth',
                    10
                ),
                whiskerOpacitySlider: this.chartMenuUtils.getDefaultSliderParams(
                    'whisker.strokeOpacity',
                    'strokeOpacity',
                    1
                ),
                whiskerLineDashSlider: this.chartMenuUtils.getDefaultSliderParams(
                    'whisker.lineDash',
                    'lineDash',
                    30,
                    true
                ),
                whiskerLineDashOffsetSlider: this.chartMenuUtils.getDefaultSliderParams(
                    'whisker.lineDashOffset',
                    'lineDashOffset',
                    30
                ),
            }
        );
    }
}
