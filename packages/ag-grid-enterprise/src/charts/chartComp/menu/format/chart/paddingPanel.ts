import type { AgChartPaddingOptions, AgChartThemeOverrides } from 'ag-charts-types';

import type { BeanCollection } from 'ag-grid-community';
import { Component, RefPlaceholder } from 'ag-grid-community';

import type { AgGroupComponentParams } from '../../../../../widgets/agGroupComponent';
import { AgGroupComponentSelector } from '../../../../../widgets/agGroupComponent';
import type { AgSlider } from '../../../../widgets/agSlider';
import { AgSliderSelector } from '../../../../widgets/agSlider';
import type { ChartController } from '../../../chartController';
import type { ChartTranslationService } from '../../../services/chartTranslationService';
import type { ChartThemeOverridesSeriesType } from '../../../utils/seriesTypeMapper';
import type { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';

export class PaddingPanel extends Component {
    private readonly paddingTopSlider: AgSlider = RefPlaceholder;

    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }
    constructor(
        private readonly chartMenuUtils: ChartMenuParamsFactory,
        private readonly chartController: ChartController
    ) {
        super();
    }

    public postConstruct() {
        const chartPaddingGroupParams: AgGroupComponentParams = {
            cssIdentifier: 'charts-format-sub-level',
            direction: 'vertical',
            suppressOpenCloseIcons: true,
            title: this.chartTranslation.translate('padding'),
            suppressEnabledCheckbox: true,
        };
        const getSliderParams = (property: keyof AgChartPaddingOptions) =>
            this.chartMenuUtils.getDefaultSliderParams('padding.' + property, property, 200);

        this.setTemplate(
            /* html */ `<div>
            <ag-group-component data-ref="chartPaddingGroup">
                <ag-slider data-ref="paddingTopSlider"></ag-slider>
                <ag-slider data-ref="paddingRightSlider"></ag-slider>
                <ag-slider data-ref="paddingBottomSlider"></ag-slider>
                <ag-slider data-ref="paddingLeftSlider"></ag-slider>
            </ag-group-component>
        <div>`,
            [AgGroupComponentSelector, AgSliderSelector],
            {
                chartPaddingGroup: chartPaddingGroupParams,
                paddingTopSlider: getSliderParams('top'),
                paddingRightSlider: getSliderParams('right'),
                paddingBottomSlider: getSliderParams('bottom'),
                paddingLeftSlider: getSliderParams('left'),
            }
        );

        this.addManagedEventListeners({
            chartOptionsChanged: (e) => {
                this.updateTopPadding(e.chartOptions);
            },
        });
    }

    private updateTopPadding(chartOptions: AgChartThemeOverrides) {
        // keep 'top' padding in sync with chart as toggling chart title on / off change the 'top' padding
        const topPadding = [...this.chartController.getChartSeriesTypes(), 'common']
            .map((seriesType: ChartThemeOverridesSeriesType) => chartOptions[seriesType]?.padding?.top)
            .find((value) => value != null);
        if (topPadding != null) {
            this.paddingTopSlider.setValue(`${topPadding}`);
        }
    }
}
