import type { BeanCollection } from 'ag-grid-community';
import { Component, RefPlaceholder } from 'ag-grid-community';

import type { AgGroupComponent, AgGroupComponentParams } from '../../../../../widgets/agGroupComponent';
import { AgGroupComponentSelector } from '../../../../../widgets/agGroupComponent';
import type { ChartTranslationService } from '../../../services/chartTranslationService';
import type { FormatPanelOptions } from '../formatPanel';
import { BackgroundPanel } from './backgroundPanel';
import { PaddingPanel } from './paddingPanel';

export class ChartPanel extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }
    private readonly chartGroup: AgGroupComponent = RefPlaceholder;

    constructor(private readonly options: FormatPanelOptions) {
        super();
    }

    public postConstruct() {
        const {
            chartController,
            chartMenuParamsFactory,
            isExpandedOnInit: expanded,
            registerGroupComponent,
        } = this.options;

        const chartGroupParams: AgGroupComponentParams = {
            cssIdentifier: 'charts-format-top-level',
            direction: 'vertical',
            title: this.chartTranslation.translate('chartStyle'),
            expanded,
            suppressEnabledCheckbox: true,
            items: [
                this.createManagedBean(new PaddingPanel(chartMenuParamsFactory, chartController)),
                this.createManagedBean(new BackgroundPanel(chartMenuParamsFactory)),
            ],
        };
        this.setTemplate(
            /* html */ `<div>
            <ag-group-component data-ref="chartGroup"></ag-group-component>
        </div>`,
            [AgGroupComponentSelector],
            { chartGroup: chartGroupParams }
        );
        registerGroupComponent(this.chartGroup);
    }
}
