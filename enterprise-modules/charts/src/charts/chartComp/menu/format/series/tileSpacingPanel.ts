import { Autowired, Component, PostConstruct } from '@ag-grid-community/core';
import { AgGroupComponent, AgGroupComponentParams } from '@ag-grid-enterprise/core';

import { AgSlider, AgSliderParams } from '../../../../../widgets/agSlider';
import { ChartTranslationKey, ChartTranslationService } from '../../../services/chartTranslationService';
import { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';

export class TileSpacingPanel extends Component {
    public static TEMPLATE /* html */ = `<div>
            <ag-group-component data-ref="groupSpacing">
                <ag-slider data-ref="groupPaddingSlider"></ag-slider>
                <ag-slider data-ref="groupSpacingSlider"></ag-slider>
            </ag-group-component>
            <ag-group-component data-ref="tileSpacing">
                <ag-slider data-ref="tilePaddingSlider"></ag-slider>
                <ag-slider data-ref="tileSpacingSlider"></ag-slider>
            </ag-group-component>
        </div>`;

    @Autowired('chartTranslationService') private readonly chartTranslationService: ChartTranslationService;

    constructor(private readonly chartMenuUtils: ChartMenuParamsFactory) {
        super();
    }

    @PostConstruct
    private init() {
        const groupParams: AgGroupComponentParams = {
            cssIdentifier: 'charts-format-sub-level',
            direction: 'vertical',
            enabled: true,
            suppressOpenCloseIcons: true,
            suppressEnabledCheckbox: true,
        };
        this.setTemplate(TileSpacingPanel.TEMPLATE, [AgGroupComponent, AgSlider], {
            groupSpacing: { ...groupParams, title: this.chartTranslationService.translate('group') },
            tileSpacing: { ...groupParams, title: this.chartTranslationService.translate('tile') },
            groupPaddingSlider: this.getSliderParams('padding', 'group.padding'),
            groupSpacingSlider: this.getSliderParams('spacing', 'group.gap'),
            tilePaddingSlider: this.getSliderParams('padding', 'tile.padding'),
            tileSpacingSlider: this.getSliderParams('spacing', 'tile.gap'),
        });
    }

    private getSliderParams(labelKey: ChartTranslationKey, key: string): AgSliderParams {
        return this.chartMenuUtils.getDefaultSliderParams(key, labelKey, 10);
    }
}
