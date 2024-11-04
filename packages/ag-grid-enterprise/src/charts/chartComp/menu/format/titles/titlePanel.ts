import type { AgInputTextFieldParams, BeanCollection } from 'ag-grid-community';
import { AgInputTextField, Component } from 'ag-grid-community';

import type { AgSliderParams } from '../../../../widgets/agSlider';
import { AgSlider } from '../../../../widgets/agSlider';
import type { ChartOptionsProxy } from '../../../services/chartOptionsService';
import type { ChartTranslationKey, ChartTranslationService } from '../../../services/chartTranslationService';
import type { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';
import type { FontPanelParams } from '../fontPanel';
import { FontPanel } from '../fontPanel';

export class TitlePanel extends Component {
    protected chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }

    protected readonly chartOptions: ChartOptionsProxy;

    protected fontPanel: FontPanel;

    constructor(
        private readonly chartMenuUtils: ChartMenuParamsFactory,
        private readonly name: ChartTranslationKey,
        protected readonly key: string
    ) {
        super(/* html */ `<div></div>`);
        this.chartOptions = chartMenuUtils.getChartOptions();
    }

    public postConstruct(): void {
        this.initFontPanel();
    }

    protected hasTitle(): boolean {
        const title: any = this.chartOptions.getValue(this.key);
        return title && title.enabled && title.text && title.text.length > 0;
    }

    private initFontPanel(): void {
        const hasTitle = this.hasTitle();

        const fontPanelParams: FontPanelParams = {
            name: this.chartTranslation.translate(this.name),
            enabled: hasTitle,
            suppressEnabledCheckbox: false,
            chartMenuParamsFactory: this.chartMenuUtils,
            keyMapper: (key) => `${this.key}.${key}`,
            onEnableChange: (enabled) => this.onEnableChange(enabled),
        };

        this.fontPanel = this.createManagedBean(new FontPanel(fontPanelParams));

        this.fontPanel.addItem(this.createBean(new AgInputTextField(this.getTextInputParams())), true);
        this.fontPanel.addItem(this.createBean(new AgSlider(this.getSpacingSliderParams())));

        this.getGui().appendChild(this.fontPanel.getGui());
    }

    protected getTextInputParams(): AgInputTextFieldParams {
        return this.chartMenuUtils.addValueParams(`${this.key}.text`, {
            label: this.chartTranslation.translate('title'),
            labelAlignment: 'top',
        });
    }

    protected getSpacingSliderParams(): AgSliderParams {
        return this.chartMenuUtils.getDefaultSliderParams(`${this.key}.spacing`, 'spacing', 100);
    }

    protected onEnableChange(enabled: boolean): void {
        this.chartOptions.setValue(`${this.key}.enabled`, enabled);
    }
}
