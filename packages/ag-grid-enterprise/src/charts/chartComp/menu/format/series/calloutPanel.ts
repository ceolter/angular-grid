import type { BeanCollection } from 'ag-grid-community';
import { Component } from 'ag-grid-community';

import type { AgGroupComponentParams } from '../../../../../widgets/agGroupComponent';
import { AgGroupComponentSelector } from '../../../../../widgets/agGroupComponent';
import { AgSliderSelector } from '../../../../widgets/agSlider';
import type { ChartTranslationService } from '../../../services/chartTranslationService';
import type { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';

export class CalloutPanel extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }
    constructor(private readonly chartMenuUtils: ChartMenuParamsFactory) {
        super();
    }

    public postConstruct() {
        const calloutGroupParams: AgGroupComponentParams = {
            cssIdentifier: 'charts-format-sub-level',
            direction: 'vertical',
            title: this.chartTranslation.translate('callout'),
            enabled: true,
            suppressOpenCloseIcons: true,
            suppressEnabledCheckbox: true,
        };
        this.setTemplate(
            /* html */ `<div>
            <ag-group-component data-ref="calloutGroup">
                <ag-slider data-ref="calloutLengthSlider"></ag-slider>
                <ag-slider data-ref="calloutStrokeWidthSlider"></ag-slider>
                <ag-slider data-ref="labelOffsetSlider"></ag-slider>
            </ag-group-component>
        </div>`,
            [AgGroupComponentSelector, AgSliderSelector],
            {
                calloutGroup: calloutGroupParams,
                calloutLengthSlider: this.chartMenuUtils.getDefaultSliderParams('calloutLine.length', 'length', 40),
                calloutStrokeWidthSlider: this.chartMenuUtils.getDefaultSliderParams(
                    'calloutLine.strokeWidth',
                    'strokeWidth',
                    10
                ),
                labelOffsetSlider: this.chartMenuUtils.getDefaultSliderParams('calloutLabel.offset', 'offset', 30),
            }
        );
    }
}
