import type { BeanCollection } from 'ag-grid-community';
import { Component } from 'ag-grid-community';

import { AgGroupComponentSelector } from '../../../../../widgets/agGroupComponent';
import type { AgGroupComponentParams } from '../../../../../widgets/agGroupComponent';
import { AgSliderSelector } from '../../../../widgets/agSlider';
import type { ChartTranslationService } from '../../../services/chartTranslationService';
import type { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';

export class CapsPanel extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }
    constructor(private readonly chartMenuUtils: ChartMenuParamsFactory) {
        super();
    }

    public postConstruct() {
        const capsGroupParams: AgGroupComponentParams = {
            cssIdentifier: 'charts-format-sub-level',
            direction: 'vertical',
            title: this.chartTranslation.translate('cap'),
            enabled: true,
            suppressOpenCloseIcons: true,
            suppressEnabledCheckbox: true,
        };
        const capLengthRatioSliderParams = this.chartMenuUtils.getDefaultSliderParams(
            'cap.lengthRatio',
            'capLengthRatio',
            1
        );
        capLengthRatioSliderParams.step = 0.05;

        this.setTemplate(
            /* html */ `<div>
            <ag-group-component data-ref="capsGroup">
                <ag-slider data-ref="capLengthRatioSlider"></ag-slider>
            </ag-group-component>
        </div>`,
            [AgGroupComponentSelector, AgSliderSelector],
            {
                capsGroup: capsGroupParams,
                capLengthRatioSlider: capLengthRatioSliderParams,
            }
        );
    }
}
