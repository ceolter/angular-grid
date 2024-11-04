import type { BeanCollection } from 'ag-grid-community';
import { AgCheckboxSelector, Component, RefPlaceholder } from 'ag-grid-community';

import type { AgGroupComponentParams } from '../../../../../widgets/agGroupComponent';
import { AgGroupComponentSelector } from '../../../../../widgets/agGroupComponent';
import type { AgSlider } from '../../../../widgets/agSlider';
import { AgSliderSelector } from '../../../../widgets/agSlider';
import type { ChartTranslationService } from '../../../services/chartTranslationService';
import type { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';

export class ZoomPanel extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }

    private readonly zoomScrollingStepInput: AgSlider = RefPlaceholder;

    constructor(private readonly chartMenuParamsFactory: ChartMenuParamsFactory) {
        super();
    }

    public postConstruct() {
        const zoomGroupParams = this.chartMenuParamsFactory.addEnableParams<AgGroupComponentParams>('zoom.enabled', {
            cssIdentifier: 'charts-advanced-settings-top-level',
            direction: 'vertical',
            suppressOpenCloseIcons: true,
            title: this.chartTranslation.translate('zoom'),
            suppressEnabledCheckbox: true,
            useToggle: true,
        });
        const zoomScrollingCheckboxParams = this.chartMenuParamsFactory.getDefaultCheckboxParams(
            'zoom.enableScrolling',
            'scrollingZoom'
        );
        const zoomScrollingStepSliderParams = this.chartMenuParamsFactory.getDefaultSliderParams(
            'zoom.scrollingStep',
            'scrollingStep',
            1
        );
        zoomScrollingStepSliderParams.step = 0.01;
        zoomScrollingStepSliderParams.minValue = zoomScrollingStepSliderParams.step;
        const zoomSelectingCheckboxParams = this.chartMenuParamsFactory.getDefaultCheckboxParams(
            'zoom.enableSelecting',
            'selectingZoom'
        );

        // Enable/disable the scrolling step input according to whether the scrolling checkbox is checked
        zoomScrollingCheckboxParams.onValueChange = ((onValueChange) => (value: boolean) => {
            if (!onValueChange) return;
            onValueChange(value);
            this.zoomScrollingStepInput.setDisabled(!value);
        })(zoomScrollingCheckboxParams.onValueChange);

        this.setTemplate(
            /* html */ `<div>
            <ag-group-component data-ref="zoomGroup">
                <ag-checkbox data-ref="zoomSelectingCheckbox"></ag-checkbox>
                <ag-checkbox data-ref="zoomScrollingCheckbox"></ag-checkbox>
                <ag-slider data-ref="zoomScrollingStepInput"></ag-slider>
            </ag-group-component>
        </div>`,
            [AgGroupComponentSelector, AgCheckboxSelector, AgSliderSelector],
            {
                zoomGroup: zoomGroupParams,
                zoomScrollingCheckbox: zoomScrollingCheckboxParams,
                zoomScrollingStepInput: zoomScrollingStepSliderParams,
                zoomSelectingCheckbox: zoomSelectingCheckboxParams,
            }
        );

        // Set the initial state of the scrolling step input according to whether the scrolling checkbox is checked
        this.zoomScrollingStepInput.setDisabled(!zoomScrollingCheckboxParams.value);
    }
}
