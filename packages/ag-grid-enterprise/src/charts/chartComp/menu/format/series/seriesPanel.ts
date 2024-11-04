import type { AgRangeBarSeriesLabelPlacement } from 'ag-charts-types';

import type { AgToggleButtonParams, BeanCollection, ListOption } from 'ag-grid-community';
import { AgSelect, AgToggleButton, Component, RefPlaceholder, _error, _removeFromParent } from 'ag-grid-community';

import type { AgGroupComponent, AgGroupComponentParams } from '../../../../../widgets/agGroupComponent';
import { AgGroupComponentSelector } from '../../../../../widgets/agGroupComponent';
import { AgColorPicker } from '../../../../widgets/agColorPicker';
import { AgSlider } from '../../../../widgets/agSlider';
import type { ChartTranslationKey, ChartTranslationService } from '../../../services/chartTranslationService';
import type { ChartSeriesType } from '../../../utils/seriesTypeMapper';
import { getSeriesType, isPieChartSeries } from '../../../utils/seriesTypeMapper';
import { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';
import { FontPanel } from '../fontPanel';
import type { FormatPanelOptions } from '../formatPanel';
import { CalloutPanel } from './calloutPanel';
import { CapsPanel } from './capsPanel';
import { ConnectorLinePanel } from './connectorLinePanel';
import { MarkersPanel } from './markersPanel';
import { SeriesItemsPanel } from './seriesItemsPanel';
import { getShapeSelectOptions } from './seriesUtils';
import { ShadowPanel } from './shadowPanel';
import { TileSpacingPanel } from './tileSpacingPanel';
import { WhiskersPanel } from './whiskersPanel';

const tooltips = 'tooltips';
const strokeWidth = 'strokeWidth';
const lineDash = 'lineDash';
const lineOpacity = 'lineOpacity';
const fillOpacity = 'fillOpacity';
const labels = 'labels';
const shadow = 'shadow';

export class SeriesPanel extends Component {
    private readonly seriesGroup: AgGroupComponent = RefPlaceholder;

    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }
    private chartMenuUtils: ChartMenuParamsFactory;

    private activePanels: Component<any>[] = [];
    private seriesType: ChartSeriesType;

    private readonly widgetFuncs = {
        lineWidth: () => this.initStrokeWidth('lineWidth'),
        [strokeWidth]: () => this.initStrokeWidth('strokeWidth'),
        lineColor: () => this.initLineColor(),
        [lineDash]: () => this.initLineDash(),
        [lineOpacity]: () => this.initOpacity('strokeOpacity'),
        [fillOpacity]: () => this.initOpacity('fillOpacity'),
        markers: () => new MarkersPanel(this.chartMenuUtils),
        [labels]: () => this.initLabels(),
        sectorLabels: () => this.initSectorLabels(),
        [shadow]: () => new ShadowPanel(this.chartMenuUtils),
        [tooltips]: () => this.initTooltips(),
        bins: () => this.initBins(),
        whiskers: () => new WhiskersPanel(this.chartMenuUtils),
        caps: () => new CapsPanel(this.chartMenuUtils),
        connectorLine: () => new ConnectorLinePanel(this.chartMenuUtils),
        seriesItems: () => new SeriesItemsPanel(this.chartMenuUtils),
        tileSpacing: () => new TileSpacingPanel(this.chartMenuUtils),
        shape: () => this.initShape(),
        size: () => this.initSize('size', 'size'),
        minSize: () => this.initSize('size', 'minSize'),
        maxSize: () => this.initSize('maxSize', 'maxSize'),
    } as const;

    private readonly seriesWidgetMappings: { [K in ChartSeriesType]?: (keyof typeof this.widgetFuncs)[] } = {
        bar: [tooltips, strokeWidth, lineDash, lineOpacity, fillOpacity, labels, shadow],
        pie: [tooltips, strokeWidth, lineOpacity, fillOpacity, labels, 'sectorLabels', shadow],
        donut: [tooltips, strokeWidth, lineOpacity, fillOpacity, labels, 'sectorLabels', shadow],
        line: [tooltips, 'lineWidth', lineDash, lineOpacity, 'markers', labels],
        scatter: [tooltips, 'shape', 'size', strokeWidth, labels],
        bubble: [tooltips, 'shape', 'minSize', 'maxSize', strokeWidth, labels],
        area: [tooltips, 'lineWidth', lineDash, lineOpacity, fillOpacity, 'markers', labels, shadow],
        histogram: [tooltips, 'bins', strokeWidth, lineDash, lineOpacity, fillOpacity, labels, shadow],
        'radial-column': [tooltips, strokeWidth, lineDash, lineOpacity, fillOpacity, labels],
        'radial-bar': [tooltips, strokeWidth, lineDash, lineOpacity, fillOpacity, labels],
        'radar-line': [tooltips, strokeWidth, lineDash, lineOpacity, 'markers', labels],
        'radar-area': [tooltips, strokeWidth, lineDash, lineOpacity, fillOpacity, 'markers', labels],
        nightingale: [tooltips, strokeWidth, lineDash, lineOpacity, fillOpacity, labels],
        'box-plot': [tooltips, strokeWidth, lineDash, lineOpacity, fillOpacity, 'whiskers', 'caps'],
        'range-bar': [tooltips, strokeWidth, lineDash, lineOpacity, fillOpacity, labels],
        'range-area': [tooltips, 'lineWidth', lineDash, lineOpacity, fillOpacity, 'markers', labels, shadow],
        treemap: [tooltips, 'tileSpacing'],
        sunburst: [tooltips],
        heatmap: [tooltips, labels, 'lineColor', 'lineWidth', lineOpacity],
        waterfall: [tooltips, 'connectorLine', 'seriesItems'],
    };

    constructor(private readonly options: FormatPanelOptions) {
        super();
        this.seriesType = options.seriesType;
    }

    public postConstruct() {
        const {
            isExpandedOnInit: expanded,
            chartOptionsService,
            chartController,
            registerGroupComponent,
        } = this.options;
        const seriesGroupParams: AgGroupComponentParams = {
            cssIdentifier: 'charts-format-top-level',
            direction: 'vertical',
            title: this.translate('series'),
            expanded,
            suppressEnabledCheckbox: true,
        };
        this.setTemplate(
            /* html */ `<div>
            <ag-group-component data-ref="seriesGroup">
            </ag-group-component>
        </div>`,
            [AgGroupComponentSelector],
            { seriesGroup: seriesGroupParams }
        );

        registerGroupComponent(this.seriesGroup);

        this.chartMenuUtils = this.createManagedBean(
            new ChartMenuParamsFactory(chartOptionsService.getSeriesOptionsProxy(() => this.seriesType))
        );

        this.addManagedListeners(chartController, { chartSeriesChartTypeChanged: this.refreshWidgets.bind(this) });

        this.refreshWidgets();
    }

    private refreshWidgets(): void {
        const { chartController } = this.options;
        this.destroyActivePanels();

        const chart = chartController.getChartProxy().getChart();
        chart
            .waitForUpdate()
            .then(() => {
                const componentWasRemoved = !this.isAlive();
                if (componentWasRemoved) {
                    // It's possible that the component was unmounted during the async delay in updating the chart.
                    // If this is the case we want to bail out to avoid operating on stale UI components.
                    return;
                }
                if (chartController.isComboChart()) {
                    this.updateSeriesType();
                    this.initSeriesSelect();
                }

                (this.seriesWidgetMappings[this.seriesType] ?? []).forEach((w) => {
                    const widgetFuncResult = this.widgetFuncs[w]();
                    let widget: Component<any>;
                    if (Array.isArray(widgetFuncResult)) {
                        const comp = this.createBean(widgetFuncResult[0]);
                        widget = comp;
                        widgetFuncResult[1](comp);
                    } else {
                        widget = this.createBean(widgetFuncResult);
                    }
                    this.seriesGroup.addItem(widget);
                    this.activePanels.push(widget);
                });
            })
            .catch((e) => _error(105, { e }));
    }

    private initSeriesSelect() {
        const seriesSelect = this.createBean(
            new AgSelect(
                this.chartMenuUtils.getDefaultSelectParamsWithoutValueParams(
                    'seriesType',
                    this.getSeriesSelectOptions(),
                    `${this.seriesType}`,
                    (newValue: ChartSeriesType) => {
                        this.seriesType = newValue;
                        this.refreshWidgets();
                    }
                )
            )
        );

        this.seriesGroup.addItem(seriesSelect);

        this.activePanels.push(seriesSelect);
    }

    private initTooltips(): AgToggleButton {
        return new AgToggleButton(
            this.chartMenuUtils.addValueParams<AgToggleButtonParams>('tooltip.enabled', {
                label: this.translate('tooltips'),
                labelAlignment: 'left',
                labelWidth: 'flex',
                inputWidth: 'flex',
            })
        );
    }

    private initLineColor(): AgColorPicker {
        return new AgColorPicker(this.chartMenuUtils.getDefaultColorPickerParams('stroke', 'strokeColor'));
    }

    private initStrokeWidth(labelKey: 'strokeWidth' | 'lineWidth'): AgSlider {
        return new AgSlider(this.chartMenuUtils.getDefaultSliderParams('strokeWidth', labelKey, 10));
    }

    private initLineDash(): AgSlider {
        return new AgSlider(this.chartMenuUtils.getDefaultSliderParams('lineDash', 'lineDash', 30, true));
    }

    private initOpacity(type: 'strokeOpacity' | 'fillOpacity'): AgSlider {
        const params = this.chartMenuUtils.getDefaultSliderParams(type, type, 1);
        params.step = 0.05;
        return new AgSlider(params);
    }

    private initLabels(): [FontPanel, (fontPanel: FontPanel) => void] {
        const isPieChart = isPieChartSeries(this.seriesType);
        const seriesOptionLabelProperty = isPieChart ? 'calloutLabel' : 'label';
        const labelKey = isPieChart ? 'calloutLabels' : 'labels';
        const labelParams = this.chartMenuUtils.getDefaultFontPanelParams(seriesOptionLabelProperty, labelKey);
        const fontPanel = new FontPanel(labelParams);

        const addItems = (labelPanelComp: FontPanel) => {
            if (isPieChart) {
                const calloutPanelComp = labelPanelComp.createManagedBean(new CalloutPanel(this.chartMenuUtils));
                labelPanelComp.addItem(calloutPanelComp);
                this.activePanels.push(calloutPanelComp);
            }

            if (this.seriesType === 'range-bar') {
                // Add label placement dropdown
                const options: Array<ListOption<AgRangeBarSeriesLabelPlacement>> = [
                    { value: 'inside', text: this.translate('inside') },
                    { value: 'outside', text: this.translate('outside') },
                ];
                const placementSelect = labelPanelComp.createManagedBean(
                    new AgSelect(
                        this.chartMenuUtils.getDefaultSelectParams('label.placement', 'labelPlacement', options)
                    )
                );

                labelPanelComp.addItem(placementSelect);
                this.activePanels.push(placementSelect);

                // Add padding slider
                const paddingSlider = labelPanelComp.createManagedBean(
                    new AgSlider(this.chartMenuUtils.getDefaultSliderParams('label.padding', 'padding', 200))
                );

                labelPanelComp.addItem(paddingSlider);
                this.activePanels.push(paddingSlider);
            }
        };

        return [fontPanel, addItems];
    }

    private initSectorLabels(): [FontPanel, (fontPanel: FontPanel) => void] {
        const sectorParams = this.chartMenuUtils.getDefaultFontPanelParams('sectorLabel', 'sectorLabels');
        const fontPanel = new FontPanel(sectorParams);

        const addItems = (sectorPanelComp: FontPanel) => {
            const positionRatioParams = this.chartMenuUtils.getDefaultSliderParams(
                'sectorLabel.positionRatio',
                'positionRatio',
                1
            );
            positionRatioParams.step = 0.05;
            const positionRatioComp = sectorPanelComp.createManagedBean(new AgSlider(positionRatioParams));
            sectorPanelComp.addItem(positionRatioComp);
        };

        return [fontPanel, addItems];
    }

    private initBins(): AgSlider {
        const params = this.chartMenuUtils.getDefaultSliderParams('binCount', 'histogramBinCount', 20);
        const chartOptions = this.chartMenuUtils.getChartOptions();
        // this needs fixing
        const value = (chartOptions.getValue<any>('bins') ?? chartOptions.getValue<any>('calculatedBins', true)).length;
        params.value = `${value}`;
        params.maxValue = Math.max(value, 20);
        return new AgSlider(params);
    }

    private initShape(): AgSelect {
        return new AgSelect(
            this.chartMenuUtils.getDefaultSelectParams('shape', 'shape', getShapeSelectOptions(this.chartTranslation))
        );
    }

    private initSize(expression: 'size' | 'maxSize', labelKey: 'size' | 'minSize' | 'maxSize'): AgSlider {
        return new AgSlider(this.chartMenuUtils.getDefaultSliderParams(expression, labelKey, 60));
    }

    private getSeriesSelectOptions(): ListOption[] {
        const activeSeriesTypes = this.getActiveSeriesTypes();
        return (['area', 'bar', 'line'] as const)
            .filter((seriesType) => activeSeriesTypes.includes(seriesType))
            .map((value) => ({ value, text: this.translate(value) }));
    }

    private updateSeriesType() {
        const activeSeriesTypes = this.getActiveSeriesTypes();
        const invalidSeriesType = !activeSeriesTypes.includes(this.seriesType);
        if (invalidSeriesType && activeSeriesTypes.length > 0) {
            this.seriesType = activeSeriesTypes[0]; // default to first active series type
        }
    }

    private getActiveSeriesTypes(): ChartSeriesType[] {
        return this.options.chartController.getActiveSeriesChartTypes().map((s) => getSeriesType(s.chartType));
    }

    private translate(key: ChartTranslationKey) {
        return this.chartTranslation.translate(key);
    }

    private destroyActivePanels(): void {
        this.activePanels.forEach((panel) => {
            _removeFromParent(panel.getGui());
            this.destroyBean(panel);
        });
    }

    public override destroy(): void {
        this.destroyActivePanels();
        super.destroy();
    }
}
