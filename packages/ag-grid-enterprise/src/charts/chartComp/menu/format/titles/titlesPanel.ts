import type { BeanCollection } from 'ag-grid-community';
import { Component, RefPlaceholder } from 'ag-grid-community';

import type { AgGroupComponent, AgGroupComponentParams } from '../../../../../widgets/agGroupComponent';
import { AgGroupComponentSelector } from '../../../../../widgets/agGroupComponent';
import type { ChartTranslationService } from '../../../services/chartTranslationService';
import { isCartesian, isPolar } from '../../../utils/seriesTypeMapper';
import { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';
import type { FormatPanelOptions } from '../formatPanel';
import { ChartTitlePanel } from './chartTitlePanel';
import { TitlePanel } from './titlePanel';

export class TitlesPanel extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }
    private readonly titleGroup: AgGroupComponent = RefPlaceholder;

    constructor(private readonly options: FormatPanelOptions) {
        super();
    }

    public postConstruct() {
        const {
            chartMenuParamsFactory,
            chartAxisMenuParamsFactory,
            chartOptionsService,
            seriesType,
            isExpandedOnInit: expanded = false,
            registerGroupComponent,
        } = this.options;
        const axisTitlePanels: TitlePanel[] = [];
        if (isCartesian(seriesType)) {
            const createAxisParamsFactory = (axisType: 'xAxis' | 'yAxis') =>
                this.createManagedBean(
                    new ChartMenuParamsFactory(chartOptionsService.getCartesianAxisThemeOverridesProxy(axisType))
                );
            axisTitlePanels.push(
                this.createManagedBean(new TitlePanel(createAxisParamsFactory('xAxis'), 'horizontalAxisTitle', 'title'))
            );
            axisTitlePanels.push(
                this.createManagedBean(new TitlePanel(createAxisParamsFactory('yAxis'), 'verticalAxisTitle', 'title'))
            );
        } else if (isPolar(seriesType)) {
            axisTitlePanels.push(
                this.createManagedBean(new TitlePanel(chartAxisMenuParamsFactory, 'polarAxisTitle', 'title'))
            );
        }
        const titleGroupParams: AgGroupComponentParams = {
            cssIdentifier: 'charts-format-top-level',
            direction: 'vertical',
            title: this.chartTranslation.translate('chartTitles'),
            expanded,
            suppressEnabledCheckbox: true,
            items: [
                this.createManagedBean(new ChartTitlePanel(chartMenuParamsFactory, 'chartTitle', 'title')),
                this.createManagedBean(new TitlePanel(chartMenuParamsFactory, 'chartSubtitle', 'subtitle')),
                ...axisTitlePanels,
            ],
        };
        this.setTemplate(
            /* html */ `<div>
            <ag-group-component data-ref="titleGroup"></ag-group-component>
        </div>`,
            [AgGroupComponentSelector],
            { titleGroup: titleGroupParams }
        );
        registerGroupComponent(this.titleGroup);
    }
}
