import type { BeanCollection } from 'ag-grid-community';
import { Component } from 'ag-grid-community';

import type { AgGroupComponentParams } from '../../../../../widgets/agGroupComponent';
import { AgGroupComponentSelector } from '../../../../../widgets/agGroupComponent';
import { AgColorPickerSelector } from '../../../../widgets/agColorPicker';
import type { ChartTranslationService } from '../../../services/chartTranslationService';
import type { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';

export class BackgroundPanel extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }
    constructor(private readonly chartMenuUtils: ChartMenuParamsFactory) {
        super();
    }

    public postConstruct() {
        const chartBackgroundGroupParams = this.chartMenuUtils.addEnableParams<AgGroupComponentParams>(
            'background.visible',
            {
                cssIdentifier: 'charts-format-sub-level',
                direction: 'vertical',
                suppressOpenCloseIcons: true,
                title: this.chartTranslation.translate('background'),
                suppressEnabledCheckbox: true,
                useToggle: true,
            }
        );
        const colorPickerParams = this.chartMenuUtils.getDefaultColorPickerParams('background.fill');
        this.setTemplate(
            /* html */ `<div>
            <ag-group-component data-ref="chartBackgroundGroup">
                <ag-color-picker data-ref="colorPicker"></ag-color-picker>
            </ag-group-component>
        <div>`,
            [AgGroupComponentSelector, AgColorPickerSelector],
            {
                chartBackgroundGroup: chartBackgroundGroupParams,
                colorPicker: colorPickerParams,
            }
        );
    }
}
