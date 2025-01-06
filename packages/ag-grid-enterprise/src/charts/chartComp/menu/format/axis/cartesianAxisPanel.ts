import type { AgCartesianAxisOptions } from 'ag-charts-types';

import type { AgSelect, AgSelectParams, BeanCollection, ListOption } from 'ag-grid-community';
import {
    AgCheckbox,
    AgSelectSelector,
    Component,
    RefPlaceholder,
    _removeFromParent,
    _setDisplayed,
} from 'ag-grid-community';

import type { AgGroupComponent, AgGroupComponentParams } from '../../../../../widgets/agGroupComponent';
import { AgGroupComponentSelector } from '../../../../../widgets/agGroupComponent';
import { AgAngleSelect } from '../../../../widgets/agAngleSelect';
import type { AgColorPickerParams } from '../../../../widgets/agColorPicker';
import { AgColorPickerSelector } from '../../../../widgets/agColorPicker';
import type { AgSliderParams } from '../../../../widgets/agSlider';
import { AgSlider, AgSliderSelector } from '../../../../widgets/agSlider';
import type { ChartController } from '../../../chartController';
import type { ChartOptionsProxy, ChartOptionsService } from '../../../services/chartOptionsService';
import type { ChartTranslationKey, ChartTranslationService } from '../../../services/chartTranslationService';
import { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';
import type { FontPanelParams } from '../fontPanel';
import { FontPanel } from '../fontPanel';
import type { FormatPanelOptions } from '../formatPanel';
import { AxisTicksPanel } from './axisTicksPanel';
import { GridLinePanel } from './gridLinePanel';

const DEFAULT_TIME_AXIS_FORMAT = '%d %B %Y';

export class CartesianAxisPanel extends Component {
    private readonly axisGroup: AgGroupComponent = RefPlaceholder;
    private readonly axisTypeSelect: AgSelect = RefPlaceholder;
    private readonly axisPositionSelect: AgSelect = RefPlaceholder;
    private readonly axisTimeFormatSelect: AgSelect = RefPlaceholder;

    private chartTranslation: ChartTranslationService;
    private chartOptionsService: ChartOptionsService;
    private chartController: ChartController;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }
    private readonly chartOptionsSeriesProxy: ChartOptionsProxy;

    private activePanels: Component[] = [];
    private updateFuncs: ((...args: any[]) => any)[] = [];

    private prevRotation: number | undefined;

    constructor(
        private readonly axisType: 'xAxis' | 'yAxis',
        private readonly options: FormatPanelOptions
    ) {
        super();

        const { chartOptionsService, seriesType, chartController } = options;
        this.chartOptionsService = chartOptionsService;
        this.chartController = chartController;
        this.chartOptionsSeriesProxy = chartOptionsService.getSeriesOptionsProxy(() => seriesType);
    }

    public postConstruct() {
        const { isExpandedOnInit: expanded, chartOptionsService, registerGroupComponent } = this.options;
        const labelKey: ChartTranslationKey = this.axisType;
        const axisGroupParams: AgGroupComponentParams = {
            cssIdentifier: 'charts-format-top-level',
            direction: 'vertical',
            title: this.translate(labelKey),
            expanded,
            suppressEnabledCheckbox: true,
        };

        const chartAxisOptionsProxy = chartOptionsService.getCartesianAxisOptionsProxy(this.axisType);
        const chartAxisOptions = this.createManagedBean(new ChartMenuParamsFactory(chartAxisOptionsProxy));
        const chartAxisThemeOverrides = this.createManagedBean(
            new ChartMenuParamsFactory(chartOptionsService.getCartesianAxisThemeOverridesProxy(this.axisType))
        );

        const axisTypeSelectParams = this.getAxisTypeSelectParams(
            chartAxisOptions,
            chartOptionsService.getCartesianAxisAppliedThemeOverridesProxy(this.axisType)
        );
        const axisPositionSelectParams = this.getAxisPositionSelectParams(chartAxisOptions);
        const axisTimeFormatSelectParams = this.getAxisTimeFormatSelectParams(chartAxisOptions);
        const axisColorInputParams = this.getAxisColorInputParams(chartAxisThemeOverrides);
        const axisLineWidthSliderParams = this.getAxisLineWidthSliderParams(chartAxisThemeOverrides);

        this.setTemplate(
            /* html */ `<div>
            <ag-group-component data-ref="axisGroup">
                <ag-select data-ref="axisTypeSelect"></ag-select>
                <ag-select data-ref="axisTimeFormatSelect"></ag-select>
                <ag-select data-ref="axisPositionSelect"></ag-select>
                <ag-color-picker data-ref="axisColorInput"></ag-color-picker>
                <ag-slider data-ref="axisLineWidthSlider"></ag-slider>
            </ag-group-component>
        </div>`,
            [AgGroupComponentSelector, AgSelectSelector, AgColorPickerSelector, AgSliderSelector],
            {
                axisGroup: axisGroupParams,
                axisTypeSelect: axisTypeSelectParams ?? undefined,
                axisPositionSelect: axisPositionSelectParams ?? undefined,
                axisTimeFormatSelect: axisTimeFormatSelectParams ?? undefined,
                axisColorInput: axisColorInputParams,
                axisLineWidthSlider: axisLineWidthSliderParams,
            }
        );
        registerGroupComponent(this.axisGroup);

        this.axisTypeSelect.setDisplayed(!!axisTypeSelectParams.options?.length);
        if (!axisPositionSelectParams) this.removeTemplateComponent(this.axisPositionSelect);
        const updateTimeFormatVisibility = () => {
            const isTimeAxis = chartAxisOptionsProxy.getValue('type') === 'time';
            _setDisplayed(this.axisTimeFormatSelect.getGui(), isTimeAxis);
        };
        if (!axisTimeFormatSelectParams) {
            this.removeTemplateComponent(this.axisTimeFormatSelect);
        } else {
            // Conditionally hide the time format input based on the currently selected axis type
            updateTimeFormatVisibility();
            // Update the visibility whenever the axis type changes
            this.addManagedEventListeners({
                chartOptionsChanged: () => {
                    updateTimeFormatVisibility();
                },
            });
        }

        this.initGridLines(chartAxisThemeOverrides);
        this.initAxisTicks(chartAxisThemeOverrides);
        this.initAxisLabels(chartAxisThemeOverrides);

        const updateFns = () => this.updateFuncs.forEach((func) => func());
        this.addManagedListeners(this.chartController, {
            chartUpdated: updateFns,
            chartModelUpdate: () =>
                setTimeout(() => {
                    if (!this.isAlive()) {
                        return;
                    }
                    // make sure this runs after the actual chart update has happened
                    this.refreshAxisTypeSelect(chartAxisOptions);
                    updateTimeFormatVisibility();
                }),
        });
    }

    private getAxisTypeSelectParams(
        chartAxisOptions: ChartMenuParamsFactory,
        chartAxisAppliedThemeOverrides: ChartOptionsProxy
    ): AgSelectParams {
        const chartOptions = chartAxisOptions.getChartOptions();
        const axisTypeSelectOptions = this.getAxisTypeSelectOptions();
        const params = chartAxisOptions.getDefaultSelectParams('type', 'axisType', axisTypeSelectOptions);
        params.onValueChange = (value: AgCartesianAxisOptions['type']): void => {
            const previousAxisType = chartOptions.getValue<AgCartesianAxisOptions['type']>('type');
            if (value === previousAxisType) return;
            // If the axis type is changed, we need to carry over all the accumulated theme overrides
            // that have been applied to the existing axis type so far
            const previousAxisThemeOverrides = chartAxisAppliedThemeOverrides.getValue<AgCartesianAxisOptions>('*');
            // Optionally update the axis label format when switching between time and non-time axes
            const previousAxisIsTimeAxis = previousAxisType === 'time';
            const updatedAxisIsTimeAxis = value === 'time';
            const updatedLabelFormat =
                previousAxisIsTimeAxis !== updatedAxisIsTimeAxis
                    ? updatedAxisIsTimeAxis
                        ? DEFAULT_TIME_AXIS_FORMAT
                        : undefined
                    : null;
            // Update the axis type (and label format if necessary)
            this.chartOptionsService.setCartesianCategoryAxisType(this.axisType, value);
            if (updatedLabelFormat !== null) {
                const existingLabel = chartOptions.getValue<AgCartesianAxisOptions['label']>('label') ?? {};
                chartOptions.setValue<AgCartesianAxisOptions['label']>('label', {
                    ...existingLabel,
                    format: updatedLabelFormat,
                });
            }
            // Reapply the previous theme overrides to the new axis type
            chartAxisAppliedThemeOverrides.setValue<AgCartesianAxisOptions>('*', previousAxisThemeOverrides);
        };
        return params;
    }

    private refreshAxisTypeSelect(chartAxisOptions: ChartMenuParamsFactory): void {
        const options = this.getAxisTypeSelectOptions();
        const hasOptions = !!options.length;
        this.axisTypeSelect.setDisplayed(hasOptions);

        if (!hasOptions) {
            return;
        }

        this.axisTypeSelect
            .clearOptions()
            .addOptions(options)
            .setValue(chartAxisOptions.getChartOptions().getValue('type'));
    }

    private getAxisTypeSelectOptions(): ListOption[] {
        const controller = this.chartController;
        const chartType = controller.getChartType();
        const supportsNumericalAxis = () => {
            const testDatum = controller.getChartData()[0];
            if (!testDatum) {
                return false;
            }
            return controller.getSelectedDimensions().every((col) => !isNaN(parseFloat(testDatum[col.colId])));
        };
        if (
            ['heatmap', 'histogram', 'boxPlot', 'rangeBar', 'scatter', 'bubble'].includes(chartType) ||
            controller.isGrouping() ||
            !this.isCategoryAxis() ||
            controller.isCategorySeriesSwitched() ||
            !supportsNumericalAxis()
        ) {
            return [];
        }

        return ['category', 'number', 'time'].map((value: 'category' | 'number' | 'time') => ({
            value,
            text: this.translate(value),
        }));
    }

    private isCategoryAxis(): boolean {
        const isHorizontal = this.chartOptionsSeriesProxy.getValue('direction') === 'horizontal';
        return (isHorizontal && this.axisType === 'yAxis') || (!isHorizontal && this.axisType === 'xAxis');
    }

    private getAxisPositionSelectParams(chartAxisOptions: ChartMenuParamsFactory): AgSelectParams | null {
        const axisPositionSelectOptions = ((chartType, axisType) => {
            switch (chartType) {
                // Some chart types do not support configuring the axis position
                case 'heatmap':
                    return null;
                default:
                    switch (axisType) {
                        // Horizontal axis position can be changed between top and bottom
                        case 'xAxis':
                            return [
                                { value: 'top', text: this.translate('top') },
                                { value: 'bottom', text: this.translate('bottom') },
                            ];
                        // Vertical axis position can be changed between left and right
                        case 'yAxis':
                            return [
                                { value: 'left', text: this.translate('left') },
                                { value: 'right', text: this.translate('right') },
                            ];
                    }
            }
        })(this.chartController.getChartType(), this.axisType);
        if (!axisPositionSelectOptions) return null;
        return chartAxisOptions.getDefaultSelectParams('position', 'position', axisPositionSelectOptions);
    }

    private getAxisTimeFormatSelectParams(chartAxisOptions: ChartMenuParamsFactory): AgSelectParams | null {
        if (!this.isCategoryAxis()) {
            return null;
        }

        const axisTimeFormatSelectOptions = [
            { value: '%d/%m/%Y', text: this.translate('timeFormatSlashesDDMMYYYY') },
            { value: '%m/%d/%Y', text: this.translate('timeFormatSlashesMMDDYYYY') },
            { value: '%d/%m/%y', text: this.translate('timeFormatSlashesDDMMYY') },
            { value: '%m/%d/%y', text: this.translate('timeFormatSlashesMMDDYY') },
            { value: '%d.%e.%y', text: this.translate('timeFormatDotsDDMYY') },
            { value: '%e.%d.%y', text: this.translate('timeFormatDotsMDDYY') },
            { value: '%Y-%m-%d', text: this.translate('timeFormatDashesYYYYMMDD') },
            { value: '%d %B %Y', text: this.translate('timeFormatSpacesDDMMMMYYYY') },
            { value: '%H:%M:%S', text: this.translate('timeFormatHHMMSS') },
            { value: '%I:%M:%S %p', text: this.translate('timeFormatHHMMSSAmPm') },
        ];

        return chartAxisOptions.getDefaultSelectParams('label.format', 'timeFormat', axisTimeFormatSelectOptions);
    }

    private getAxisColorInputParams(chartAxisThemeOverrides: ChartMenuParamsFactory): AgColorPickerParams {
        return chartAxisThemeOverrides.getDefaultColorPickerParams('line.stroke');
    }

    private getAxisLineWidthSliderParams(chartAxisThemeOverrides: ChartMenuParamsFactory): AgSliderParams {
        const chartOptions = chartAxisThemeOverrides.getChartOptions();
        // Note that there is no separate checkbox for enabling/disabling the axis line. Whenever the line width is
        // changed, the value for `line.enabled` is inferred based on the whether the `line.width` value is non-zero.
        const getAxisLineWidth = (): number | null => {
            const isAxisLineEnabled = chartOptions.getValue<boolean>('line.enabled');
            if (!isAxisLineEnabled) return null;
            return chartOptions.getValue<number>('line.width');
        };
        const setAxisLineWidth = (value: number | null): void => {
            chartOptions.setValues<number | boolean>([
                { expression: 'line.enabled', value: value != null },
                { expression: 'line.width', value: value ?? 0 },
            ]);
        };
        const axisLineWidthSliderParams = chartAxisThemeOverrides.getDefaultSliderParamsWithoutValueParams(
            getAxisLineWidth() ?? 0,
            'thickness',
            10
        );
        axisLineWidthSliderParams.onValueChange = (newValue) => {
            setAxisLineWidth(newValue === 0 ? null : newValue);
        };
        return axisLineWidthSliderParams;
    }

    private initGridLines(chartAxisThemeOverrides: ChartMenuParamsFactory) {
        const chartType = this.chartController.getChartType();

        // Some chart types do not support configuring grid lines
        if (chartType === 'heatmap') {
            return;
        }

        const gridLineComp = this.createBean(new GridLinePanel(chartAxisThemeOverrides));
        this.axisGroup.addItem(gridLineComp);
        this.activePanels.push(gridLineComp);
    }

    private initAxisTicks(chartAxisThemeOverrides: ChartMenuParamsFactory) {
        if (!this.hasConfigurableAxisTicks()) return;
        const axisTicksComp = this.createBean(new AxisTicksPanel(chartAxisThemeOverrides));
        this.axisGroup.addItem(axisTicksComp);
        this.activePanels.push(axisTicksComp);

        const updateTickFn = () => axisTicksComp.setTickSizeSliderDisplayed(this.isGroupedCategoryAxis());

        this.updateFuncs.push(updateTickFn);

        updateTickFn();
    }

    private hasConfigurableAxisTicks(): boolean {
        // Axis ticks are disabled for some chart types
        const chartType = this.chartController.getChartType();
        switch (chartType) {
            case 'radarLine':
            case 'radarArea':
            case 'rangeBar':
            case 'boxPlot':
            case 'waterfall':
                return false;
            default:
                return true;
        }
    }

    private initAxisLabels(chartAxisThemeOverrides: ChartMenuParamsFactory) {
        const params: FontPanelParams = {
            name: this.translate('labels'),
            enabled: true,
            suppressEnabledCheckbox: true,
            chartMenuParamsFactory: chartAxisThemeOverrides,
            keyMapper: (key) => `label.${key}`,
        };

        const labelPanelComp = this.createBean(new FontPanel(params));
        this.axisGroup.addItem(labelPanelComp);
        this.activePanels.push(labelPanelComp);

        this.addAdditionalLabelComps(labelPanelComp, chartAxisThemeOverrides);
    }

    private addAdditionalLabelComps(labelPanelComp: FontPanel, chartAxisThemeOverrides: ChartMenuParamsFactory) {
        this.addLabelPadding(labelPanelComp, chartAxisThemeOverrides);

        const rotationComp = this.createRotationWidget('labelRotation', chartAxisThemeOverrides);
        const autoRotateCb = this.initLabelRotation(rotationComp, chartAxisThemeOverrides);

        labelPanelComp.addItem(autoRotateCb);
        labelPanelComp.addItem(rotationComp);
    }

    private initLabelRotation(rotationComp: AgAngleSelect, chartAxisThemeOverrides: ChartMenuParamsFactory) {
        const chartOptions = chartAxisThemeOverrides.getChartOptions();

        const getLabelRotationValue = (): number | undefined => {
            return chartOptions.getValue<number | undefined>('label.rotation');
        };
        const getLabelAutoRotateValue = (): boolean => {
            return chartOptions.getValue<boolean>('label.autoRotate');
        };

        const updateAutoRotate = (autoRotate: boolean) => {
            // Remember the existing rotation before we clear it from the options
            if (autoRotate) this.prevRotation = getLabelRotationValue();

            // For the autoRotate option to take effect, we need to additionally clear the rotation option value
            chartOptions.setValues<boolean | number | undefined>([
                { expression: 'label.autoRotate', value: autoRotate },
                // Clear the rotation option when activating auto-rotate, reinstate the previous value when deactivating
                { expression: 'label.rotation', value: autoRotate ? undefined : this.prevRotation },
            ]);

            rotationComp.setDisplayed(!autoRotate);
        };

        const rotation = getLabelRotationValue();
        const autoRotate = typeof rotation === 'number' ? false : getLabelAutoRotateValue();

        const autoRotateCheckbox = this.createBean(
            new AgCheckbox({
                label: this.translate('autoRotate'),
                value: autoRotate,
                onValueChange: updateAutoRotate,
            })
        );

        // init rotation comp state
        rotationComp.setDisplayed(!autoRotate);

        const autoRotateUpdateFn = () => autoRotateCheckbox.setDisplayed(this.isGroupedCategoryAxis());

        this.updateFuncs.push(autoRotateUpdateFn);

        autoRotateUpdateFn();

        return autoRotateCheckbox;
    }

    private createRotationWidget(labelKey: ChartTranslationKey, chartAxisThemeOverrides: ChartMenuParamsFactory) {
        const chartOptions = chartAxisThemeOverrides.getChartOptions();

        const getLabelRotationValue = (): number | undefined => {
            return chartOptions.getValue<number | undefined>('label.rotation');
        };
        const setLabelRotationValue = (value: number | undefined): void => {
            return chartOptions.setValue<number | undefined>('label.rotation', value);
        };

        const degreesSymbol = String.fromCharCode(176);

        const label = `${this.chartTranslation.translate(labelKey)} ${degreesSymbol}`;
        const angleSelect = new AgAngleSelect({
            label,
            labelWidth: 'flex',
            value: getLabelRotationValue() ?? 0,
            onValueChange: setLabelRotationValue,
        });

        // the axis label rotation needs to be updated when the default category changes in the data panel
        this.updateFuncs.push(() => {
            angleSelect.setValue(getLabelRotationValue() ?? 0);
        });

        return this.createBean(angleSelect);
    }

    private isGroupedCategoryAxis(): boolean {
        const axisOptionsType = this.chartOptionsService.getCartesianAxisOptionsProxy(this.axisType).getValue('type');

        if (axisOptionsType === 'grouped-category') {
            return !this.isCategoryAxis();
        }

        return true;
    }

    private addLabelPadding(labelPanelComp: FontPanel, chartAxisThemeOverrides: ChartMenuParamsFactory) {
        const labelPaddingSlider = this.createBean(
            new AgSlider(chartAxisThemeOverrides.getDefaultSliderParams('label.spacing', 'padding', 30))
        );

        labelPanelComp.addItem(labelPaddingSlider);
    }

    private translate(key: ChartTranslationKey) {
        return this.chartTranslation.translate(key);
    }

    private removeTemplateComponent(component: Component<any>): void {
        _removeFromParent(component.getGui());
        this.destroyBean(component);
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
