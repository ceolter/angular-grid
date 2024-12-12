import type { BeanCollection } from 'ag-grid-community';
import { AgCheckbox, AgSelect, Component, RefPlaceholder } from 'ag-grid-community';

import type { AgGroupComponentParams } from '../../../../../widgets/agGroupComponent';
import { AgGroupComponent, AgGroupComponentSelector } from '../../../../../widgets/agGroupComponent';
import { AgSlider } from '../../../../widgets/agSlider';
import type { ChartController } from '../../../chartController';
import type { ChartTranslationKey, ChartTranslationService } from '../../../services/chartTranslationService';
import type { ChartMenuContext } from '../../chartMenuContext';
import type { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';
import type { FontPanelParams } from '../fontPanel';
import { FontPanel } from '../fontPanel';
import type { FormatPanelOptions } from '../formatPanel';

export class LegendPanel extends Component {
    private chartTranslation: ChartTranslationService;
    private readonly chartController: ChartController;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }
    private readonly legendGroup: AgGroupComponent = RefPlaceholder;
    private enabledGroup: AgGroupComponent = RefPlaceholder;

    private readonly key: string;
    private readonly isGradient: boolean;

    constructor(
        private readonly options: FormatPanelOptions,
        private readonly chartMenuContext: ChartMenuContext
    ) {
        super();

        this.isGradient = ['treemap', 'sunburst', 'heatmap'].includes(options.seriesType);
        this.key = this.isGradient ? 'gradientLegend' : 'legend';
        this.chartController = chartMenuContext.chartController;
    }

    public postConstruct() {
        const { chartMenuParamsFactory, isExpandedOnInit: expanded, registerGroupComponent } = this.options;
        const positionSelect = this.createManagedBean(
            new AgSelect(
                chartMenuParamsFactory.getDefaultSelectParams(
                    `${this.key}.position`,
                    'position',
                    ['top', 'right', 'bottom', 'left'].map((position: ChartTranslationKey) => ({
                        value: position,
                        text: this.chartTranslation.translate(position),
                    }))
                )
            )
        );
        this.enabledGroup = this.createManagedBean(
            new AgGroupComponent(
                chartMenuParamsFactory.addEnableParams<AgGroupComponentParams>(`${this.key}.enabled`, {
                    cssIdentifier: 'charts-format-sub-level',
                    direction: 'vertical',
                    suppressOpenCloseIcons: true,
                    title: this.chartTranslation.translate('legendEnabled'),
                    suppressEnabledCheckbox: true,
                    useToggle: true,
                    items: [
                        this.createLabelPanel(chartMenuParamsFactory),
                        positionSelect,
                        ...this.getItems(chartMenuParamsFactory),
                    ],
                })
            )
        );
        const legendGroupParams: AgGroupComponentParams = {
            cssIdentifier: 'charts-format-top-level',
            direction: 'vertical',
            title: this.chartTranslation.translate('legend'),
            suppressEnabledCheckbox: true,
            expanded,
            items: [this.enabledGroup],
        };
        this.setTemplate(
            /* html */ `<div>
            <ag-group-component data-ref="legendGroup">
            </ag-group-component>
        </div>`,
            [AgGroupComponentSelector],
            {
                legendGroup: legendGroupParams,
            }
        );
        registerGroupComponent(this.legendGroup);

        const listener = this.updateLegendEnabledState.bind(this);
        this.addManagedListeners(this.chartController, {
            chartModelUpdate: listener,
            chartApiUpdate: listener,
        });
    }

    private updateLegendEnabledState(): void {
        const { valueCols } = this.chartController.getColStateForMenu();
        this.enabledGroup.setEnabled(valueCols.filter((vc) => vc.selected).length > 1);
    }

    private getItems(chartMenuParamsFactory: ChartMenuParamsFactory): Component<any>[] {
        const createSlider = (expression: string, labelKey: ChartTranslationKey, defaultMaxValue: number) =>
            this.createManagedBean(
                new AgSlider(
                    chartMenuParamsFactory.getDefaultSliderParams(
                        `${this.key}.${expression}`,
                        labelKey,
                        defaultMaxValue
                    )
                )
            );
        if (this.isGradient) {
            return [
                this.createManagedBean(
                    new AgCheckbox(
                        chartMenuParamsFactory.addValueParams('gradientLegend.reverseOrder', {
                            label: this.chartTranslation.translate('reverseDirection'),
                            labelWidth: 'flex',
                        })
                    )
                ),
                createSlider('gradient.thickness', 'thickness', 40),
                createSlider('gradient.preferredLength', 'preferredLength', 300),
                createSlider('spacing', 'spacing', 200),
            ];
        }
        return [
            createSlider('spacing', 'spacing', 200),
            createSlider('item.marker.size', 'markerSize', 40),
            createSlider('item.marker.strokeWidth', 'markerStroke', 10),
            createSlider('item.marker.padding', 'itemSpacing', 20),
            createSlider('item.paddingX', 'layoutHorizontalSpacing', 50),
            createSlider('item.paddingY', 'layoutVerticalSpacing', 50),
        ];
    }

    private createLabelPanel(chartMenuParamsFactory: ChartMenuParamsFactory): FontPanel {
        const rootKey = this.isGradient ? 'gradientLegend.scale.label' : 'legend.item.label';
        const params: FontPanelParams = {
            enabled: true,
            suppressEnabledCheckbox: true,
            chartMenuParamsFactory,
            keyMapper: (key) => `${rootKey}.${key}`,
            cssIdentifier: 'charts-format-sub-level-no-header',
        };

        return this.createManagedBean(new FontPanel(params));
    }
}
