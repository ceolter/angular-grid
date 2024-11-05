import type { BeanCollection } from 'ag-grid-community';
import { AgSelectSelector, Component } from 'ag-grid-community';

import type { AgGroupComponentParams } from '../../../../../widgets/agGroupComponent';
import { AgGroupComponentSelector } from '../../../../../widgets/agGroupComponent';
import { AgSliderSelector } from '../../../../widgets/agSlider';
import type { ChartTranslationService } from '../../../services/chartTranslationService';
import type { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';
import { getShapeSelectOptions } from './seriesUtils';

export class MarkersPanel extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }
    constructor(private readonly chartMenuUtils: ChartMenuParamsFactory) {
        super();
    }

    public postConstruct() {
        const seriesMarkersGroupParams = this.chartMenuUtils.addEnableParams<AgGroupComponentParams>('marker.enabled', {
            cssIdentifier: 'charts-format-sub-level',
            direction: 'vertical',
            title: this.chartTranslation.translate('markers'),
            suppressEnabledCheckbox: true,
            useToggle: true,
            suppressOpenCloseIcons: true,
        });

        this.setTemplate(
            /* html */ `<div>
            <ag-group-component data-ref="seriesMarkersGroup">
                <ag-select data-ref="seriesMarkerShapeSelect"></ag-select>
                <ag-slider data-ref="seriesMarkerSizeSlider"></ag-slider>
                <ag-slider data-ref="seriesMarkerStrokeWidthSlider"></ag-slider>
            </ag-group-component>
        </div>`,
            [AgGroupComponentSelector, AgSelectSelector, AgSliderSelector],
            {
                seriesMarkersGroup: seriesMarkersGroupParams,
                seriesMarkerShapeSelect: this.chartMenuUtils.getDefaultSelectParams(
                    'marker.shape',
                    'shape',
                    getShapeSelectOptions(this.chartTranslation)
                ),
                seriesMarkerSizeSlider: this.chartMenuUtils.getDefaultSliderParams('marker.size', 'size', 60),
                seriesMarkerStrokeWidthSlider: this.chartMenuUtils.getDefaultSliderParams(
                    'marker.strokeWidth',
                    'strokeWidth',
                    10
                ),
            }
        );
    }
}
