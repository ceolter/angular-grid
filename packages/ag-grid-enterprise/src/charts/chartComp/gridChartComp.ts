import type { AgChartInstance, AgChartThemeOverrides, AgChartThemePalette } from 'ag-charts-types';

import type {
    BeanCollection,
    ChartModel,
    ChartToolPanelName,
    ChartType,
    FocusService,
    IAggFunc,
    PartialCellRange,
    PopupService,
    SeriesChartType,
    UpdateChartParams,
} from 'ag-grid-community';
import {
    Component,
    RefPlaceholder,
    _clearElement,
    _getAbsoluteHeight,
    _getAbsoluteWidth,
    _mergeDeep,
    _removeFromParent,
    _setDisplayed,
    _warn,
} from 'ag-grid-community';

import { AgDialog } from '../../widgets/agDialog';
import type { CrossFilteringContext } from '../chartService';
import { ChartController, DEFAULT_THEMES } from './chartController';
import { AreaChartProxy } from './chartProxies/cartesian/areaChartProxy';
import { BarChartProxy } from './chartProxies/cartesian/barChartProxy';
import { LineChartProxy } from './chartProxies/cartesian/lineChartProxy';
import { ScatterChartProxy } from './chartProxies/cartesian/scatterChartProxy';
import type { ChartProxy, ChartProxyParams } from './chartProxies/chartProxy';
import { ComboChartProxy } from './chartProxies/combo/comboChartProxy';
import type { EnterpriseChartProxyFactory } from './chartProxies/enterpriseChartProxyFactory';
import { PieChartProxy } from './chartProxies/pie/pieChartProxy';
import { ChartMenu } from './menu/chartMenu';
import type { ChartMenuContext } from './menu/chartMenuContext';
import { ChartMenuParamsFactory } from './menu/chartMenuParamsFactory';
import type { ChartModelParams } from './model/chartDataModel';
import { ChartDataModel } from './model/chartDataModel';
import type { ChartCrossFilterService } from './services/chartCrossFilterService';
import type { ChartMenuService } from './services/chartMenuService';
import { CHART_TOOL_PANEL_MENU_OPTIONS } from './services/chartMenuService';
import { ChartOptionsService } from './services/chartOptionsService';
import type { ChartTranslationKey, ChartTranslationService } from './services/chartTranslationService';
import { getCanonicalChartType, getSeriesType, isHierarchical } from './utils/seriesTypeMapper';

export interface GridChartParams {
    chartId: string;
    pivotChart?: boolean;
    cellRange: PartialCellRange;
    chartType: ChartType;
    chartThemeName?: string;
    insideDialog: boolean;
    focusDialogOnOpen?: boolean;
    suppressChartRanges?: boolean;
    switchCategorySeries?: boolean;
    aggFunc?: string | IAggFunc;
    chartThemeOverrides?: AgChartThemeOverrides;
    unlinkChart?: boolean;
    crossFiltering?: boolean;
    crossFilteringContext: CrossFilteringContext;
    chartOptionsToRestore?: AgChartThemeOverrides;
    chartPaletteToRestore?: AgChartThemePalette;
    seriesChartTypes?: SeriesChartType[];
    crossFilteringResetCallback?: () => void;
}

export class GridChartComp extends Component {
    private crossFilterService: ChartCrossFilterService;
    private chartTranslationService: ChartTranslationService;
    private chartMenuService: ChartMenuService;
    private focusSvc: FocusService;
    private popupSvc: PopupService;
    private enterpriseChartProxyFactory?: EnterpriseChartProxyFactory;

    public wireBeans(beans: BeanCollection): void {
        this.crossFilterService = beans.chartCrossFilterService as ChartCrossFilterService;
        this.chartTranslationService = beans.chartTranslationService as ChartTranslationService;
        this.chartMenuService = beans.chartMenuService as ChartMenuService;
        this.focusSvc = beans.focusSvc;
        this.popupSvc = beans.popupSvc!;
        this.enterpriseChartProxyFactory = beans.enterpriseChartProxyFactory as EnterpriseChartProxyFactory;
    }

    private readonly eChart: HTMLElement = RefPlaceholder;
    private readonly eChartContainer: HTMLElement = RefPlaceholder;
    private readonly eMenuContainer: HTMLElement = RefPlaceholder;
    private readonly eEmpty: HTMLElement = RefPlaceholder;

    private chartMenu: ChartMenu;
    private chartDialog: AgDialog;

    private chartController: ChartController;
    private chartOptionsService: ChartOptionsService;
    private chartMenuContext: ChartMenuContext;

    private chartProxy: ChartProxy;
    private chartType: ChartType;
    private chartEmpty: boolean;

    private readonly params: GridChartParams;

    // function to clean up the 'color-scheme-change' event listener
    private onDestroyColorSchemeChangeListener: () => void;

    constructor(params: GridChartParams) {
        super(/* html */ `<div class="ag-chart">
            <div data-ref="eChartContainer" class="ag-chart-components-wrapper ag-chart-menu-hidden">
                <div data-ref="eChart" class="ag-chart-canvas-wrapper"></div>
                <div data-ref="eEmpty" class="ag-chart-empty-text ag-unselectable"></div>
            </div>
            <div data-ref="eMenuContainer" class="ag-chart-docked-container"></div>
            </div>`);
        this.params = params;
    }

    public postConstruct(): void {
        const modelParams: ChartModelParams = {
            ...this.params,
            chartType: getCanonicalChartType(this.params.chartType),
            chartThemeName: this.getThemeName(),
        };

        const isRtl = this.gos.get('enableRtl');

        this.addCssClass(isRtl ? 'ag-rtl' : 'ag-ltr');

        // only the chart controller interacts with the chart model
        const model = this.createBean(new ChartDataModel(modelParams));
        this.chartController = this.createManagedBean(new ChartController(model));
        this.chartOptionsService = this.createManagedBean(new ChartOptionsService(this.chartController));

        this.validateCustomThemes();

        // create chart before dialog to ensure dialog is correct size
        this.createChart();

        if (this.params.insideDialog) {
            this.addDialog();
        }

        this.addMenu();

        this.addManagedElementListeners(this.getGui(), { focusin: this.setActiveChartCellRange.bind(this) });
        this.addManagedListeners(this.chartController, { chartModelUpdate: this.update.bind(this) });

        this.addManagedPropertyListeners(
            ['chartThemeOverrides', 'chartThemes'],
            this.reactivePropertyUpdate.bind(this)
        );

        this.update();
        this.raiseChartCreatedEvent();
    }

    private createChart(): void {
        // if chart already exists, destroy it and remove it from DOM
        let chartInstance: AgChartInstance | undefined = undefined;
        if (this.chartProxy) {
            chartInstance = this.chartProxy.destroy({ keepChartInstance: true });
        }

        const crossFilterCallback = (event: any, reset: boolean) => {
            const ctx = this.params.crossFilteringContext;
            ctx.lastSelectedChartId = reset ? '' : this.chartController.getChartId();
            if (reset) {
                this.params.crossFilteringResetCallback!();
            }
            this.crossFilterService.filter(event, reset);
        };

        const chartType = this.chartController.getChartType();
        const chartProxyParams: ChartProxyParams = {
            chartType,
            chartInstance,
            getChartThemeName: this.getChartThemeName.bind(this),
            getChartThemes: this.getChartThemes.bind(this),
            customChartThemes: this.gos.get('customChartThemes'),
            getGridOptionsChartThemeOverrides: () => this.getGridOptionsChartThemeOverrides(),
            getExtraPaddingDirections: () => this.chartMenu?.getExtraPaddingDirections() ?? [],
            apiChartThemeOverrides: this.params.chartThemeOverrides,
            crossFiltering: this.params.crossFiltering ?? false,
            crossFilterCallback,
            parentElement: this.eChart,
            grouping: this.chartController.isGrouping(),
            chartThemeToRestore: this.params.chartThemeName,
            chartOptionsToRestore: this.params.chartOptionsToRestore,
            chartPaletteToRestore: this.params.chartPaletteToRestore,
            seriesChartTypes: this.chartController.getSeriesChartTypes(),
            translate: (toTranslate: ChartTranslationKey) => this.chartTranslationService.translate(toTranslate),
        };

        // ensure 'restoring' options are not reused when switching chart types
        this.params.chartOptionsToRestore = undefined;

        // set local state used to detect when chart changes
        this.chartType = chartType;

        this.chartProxy = this.createChartProxy(chartProxyParams);
        if (!this.chartProxy) {
            _warn(138, { chartType: chartProxyParams.chartType });
            return;
        }

        this.chartController.setChartProxy(this.chartProxy);
        this.createMenuContext();
    }

    private createMenuContext(): void {
        if (this.chartMenuContext) {
            return;
        }
        const chartMenuParamsFactory = this.createManagedBean(
            new ChartMenuParamsFactory(this.chartOptionsService.getChartThemeOverridesProxy())
        );
        const chartAxisMenuParamsFactory = this.createManagedBean(
            new ChartMenuParamsFactory(this.chartOptionsService.getAxisThemeOverridesProxy())
        );
        this.chartMenuContext = {
            chartController: this.chartController,
            chartOptionsService: this.chartOptionsService,
            chartMenuParamsFactory,
            chartAxisMenuParamsFactory,
        };
    }

    private getChartThemeName(): string {
        return this.chartController.getChartThemeName();
    }

    private getChartThemes(): string[] {
        return this.chartController.getThemeNames();
    }

    private getGridOptionsChartThemeOverrides(): AgChartThemeOverrides | undefined {
        return this.gos.get('chartThemeOverrides');
    }

    private createChartProxy(chartProxyParams: ChartProxyParams): ChartProxy {
        switch (chartProxyParams.chartType) {
            case 'column':
            case 'bar':
            case 'groupedColumn':
            case 'stackedColumn':
            case 'normalizedColumn':
            case 'groupedBar':
            case 'stackedBar':
            case 'normalizedBar':
                return new BarChartProxy(chartProxyParams);
            case 'pie':
            case 'donut':
            case 'doughnut':
                return new PieChartProxy(chartProxyParams);
            case 'area':
            case 'stackedArea':
            case 'normalizedArea':
                return new AreaChartProxy(chartProxyParams);
            case 'line':
            case 'stackedLine':
            case 'normalizedLine':
                return new LineChartProxy(chartProxyParams);
            case 'scatter':
            case 'bubble':
                return new ScatterChartProxy(chartProxyParams);
            case 'columnLineCombo':
            case 'areaColumnCombo':
            case 'customCombo':
                return new ComboChartProxy(chartProxyParams);
        }
        const enterpriseChartProxy = this.enterpriseChartProxyFactory?.createChartProxy(chartProxyParams);
        if (!enterpriseChartProxy) {
            throw `AG Grid: Unable to create chart as an invalid chartType = '${chartProxyParams.chartType}' was supplied.`;
        }
        return enterpriseChartProxy;
    }

    private addDialog(): void {
        const title = this.chartTranslationService.translate(
            this.params.pivotChart ? 'pivotChartTitle' : 'rangeChartTitle'
        );

        const { width, height } = this.getBestDialogSize();

        const afterGuiAttached = this.params.focusDialogOnOpen
            ? () => setTimeout(() => this.focusSvc.focusInto(this.getGui()))
            : undefined;

        this.chartDialog = new AgDialog({
            resizable: true,
            movable: true,
            maximizable: true,
            title,
            width,
            height,
            component: this,
            centered: true,
            closable: true,
            afterGuiAttached,
            postProcessPopupParams: {
                type: 'chart',
            },
        });

        this.createBean(this.chartDialog);

        this.chartDialog.addEventListener('destroyed', () => {
            this.destroy();
            this.chartMenuService.hideAdvancedSettings();
            const lastFocusedCell = this.focusSvc.getFocusedCell();
            setTimeout(() => {
                if (this.focusSvc.isAlive()) {
                    // focus Service may have been destroyed if both grid and chart destroyed together
                    if (lastFocusedCell) {
                        this.focusSvc.setFocusedCell({ ...lastFocusedCell, forceBrowserFocus: true });
                    } else {
                        this.focusSvc.focusGridInnerElement();
                    }
                }
            });
        });
    }

    private getBestDialogSize(): { width: number; height: number } {
        const popupParent = this.popupSvc.getPopupParent();
        const maxWidth = _getAbsoluteWidth(popupParent) * 0.75;
        const maxHeight = _getAbsoluteHeight(popupParent) * 0.75;
        const ratio = 0.553;

        const chart = this.chartProxy.getChart();
        let width = this.params.insideDialog ? 850 : chart.width;
        let height = this.params.insideDialog ? 470 : chart.height;

        if (width > maxWidth || height > maxHeight) {
            width = Math.min(width, maxWidth);
            height = Math.round(width * ratio);

            if (height > maxHeight) {
                height = maxHeight;
                width = Math.min(width, Math.round(height / ratio));
            }
        }

        return { width, height };
    }

    private addMenu(): void {
        if (!this.params.crossFiltering) {
            this.chartMenu = this.createBean(
                new ChartMenu(this.eChartContainer, this.eMenuContainer, this.chartMenuContext)
            );
            this.eChartContainer.appendChild(this.chartMenu.getGui());
        }
    }

    public update(params?: UpdateChartParams): void {
        // update chart model for api.updateChart()
        if (params?.chartId) {
            const validUpdate = this.chartController.update(params);
            if (!validUpdate) {
                return; // warning already logged!
            }
        }

        const updatedChartType = this.chartTypeChanged(params);
        // If the chart type has changed, grab the theme overrides from the exisiting chart before destroying it,
        // so that we can retain any compatible theme overrides across different chart types.
        const persistedThemeOverrides =
            updatedChartType || this.chartEmpty
                ? ((updatedChartType) => {
                      const currentChartType = this.chartType;
                      const targetChartType = updatedChartType;
                      const existingChartInstance = this.chartProxy.getChart();
                      const existingChartOptions = existingChartInstance?.getOptions();
                      const existingAxes = existingChartInstance?.axes;
                      return this.chartOptionsService.getPersistedChartThemeOverrides(
                          existingChartOptions,
                          existingAxes,
                          currentChartType,
                          targetChartType ?? currentChartType
                      );
                  })(updatedChartType)
                : undefined;

        // recreate chart if chart type has changed
        if (updatedChartType) this.createChart();

        // combine any provided theme overrides with any retained theme overrides from changing chart type
        if (persistedThemeOverrides && params?.chartThemeOverrides) {
            _mergeDeep(persistedThemeOverrides, params.chartThemeOverrides);
        }
        const updatedThemeOverrides = persistedThemeOverrides ?? params?.chartThemeOverrides;

        // update chart options if chart type hasn't changed or if overrides are supplied
        this.updateChart(updatedThemeOverrides);

        if (params?.chartId) {
            this.chartProxy
                .getChart()
                .waitForUpdate()
                .then(() => {
                    this.chartController.raiseChartApiUpdateEvent();
                });
        }
    }

    private updateChart(updatedOverrides?: AgChartThemeOverrides): void {
        const { chartProxy } = this;

        const selectedCols = this.chartController.getSelectedValueColState();
        const data = this.chartController.getChartData();
        const chartEmpty = this.handleEmptyChart(data, selectedCols.length);

        this.chartEmpty = chartEmpty;
        if (chartEmpty) {
            // We don't have enough data to reinstantiate the chart with the new chart type,
            // but we still want to persist any theme overrides for when the data is present
            if (updatedOverrides) this.chartController.updateThemeOverrides(updatedOverrides);
            return;
        }

        const chartUpdateParams = this.chartController.getChartUpdateParams(updatedOverrides);
        chartProxy.update(chartUpdateParams);

        this.chartProxy
            .getChart()
            .waitForUpdate()
            .then(() => {
                this.chartController.raiseChartUpdatedEvent();
            });
    }

    private chartTypeChanged(updateParams?: UpdateChartParams): ChartType | null {
        const [currentType, updatedChartType] = [this.chartController.getChartType(), updateParams?.chartType];
        const targetChartType = updatedChartType ? getCanonicalChartType(updatedChartType) : undefined;
        // If the grid chart component is out of sync with the existing chart instance type, return the correct chart type
        if (this.chartType !== currentType) return targetChartType ?? currentType;
        // If the target chart type is different to the current chart type, return the new chart type
        if (targetChartType && currentType !== targetChartType) return targetChartType;
        // Otherwise nothing has changed
        return null;
    }

    public getChartModel(): ChartModel {
        return this.chartController.getChartModel();
    }

    public getChartImageDataURL(fileFormat?: string): string {
        return this.chartProxy.getChartImageDataURL(fileFormat);
    }

    private handleEmptyChart(data: any[], numFields: number): boolean {
        const pivotModeDisabled = this.chartController.isPivotChart() && !this.chartController.isPivotMode();

        // Determine the minimum number of fields based on the chart type
        const chartType = this.chartController.getChartType();
        let minFieldsRequired = 1;
        if (this.chartController.isActiveXYChart()) {
            minFieldsRequired = chartType === 'bubble' ? 3 : 2;
        } else if (isHierarchical(getSeriesType(chartType))) {
            minFieldsRequired = 0;
        }

        const isEmptyChart = numFields < minFieldsRequired || data.length === 0;

        if (this.eChart) {
            const isEmpty = pivotModeDisabled || isEmptyChart;
            _setDisplayed(this.eChart, !isEmpty);
            _setDisplayed(this.eEmpty, isEmpty);
        }

        if (pivotModeDisabled) {
            this.eEmpty.innerText = this.chartTranslationService.translate('pivotChartRequiresPivotMode');
            return true;
        }

        if (isEmptyChart) {
            this.eEmpty.innerText = this.chartTranslationService.translate('noDataToChart');
            return true;
        }

        return false;
    }

    public downloadChart(dimensions?: { width: number; height: number }, fileName?: string, fileFormat?: string): void {
        this.chartProxy.downloadChart(dimensions, fileName, fileFormat);
    }

    public openChartToolPanel(panel?: ChartToolPanelName) {
        const menuPanel = panel ? CHART_TOOL_PANEL_MENU_OPTIONS[panel] : panel;
        this.chartMenu.showMenu({ panel: menuPanel });
    }

    public closeChartToolPanel() {
        this.chartMenu.hideMenu();
    }

    public getChartId(): string {
        return this.chartController.getChartId();
    }

    public getUnderlyingChart() {
        return this.chartProxy.getChartRef();
    }

    public crossFilteringReset(): void {
        this.chartProxy.crossFilteringReset();
    }

    private setActiveChartCellRange(focusEvent: FocusEvent): void {
        if (this.getGui().contains(focusEvent.relatedTarget as HTMLElement)) {
            return;
        }

        this.chartController.setChartRange(true);
        this.focusSvc.clearFocusedCell();
    }

    private getThemeName(): string {
        const availableChartThemes = this.gos.get('chartThemes') || DEFAULT_THEMES;

        if (availableChartThemes.length === 0) {
            throw new Error('Cannot create chart: no chart themes available.');
        }

        const { chartThemeName } = this.params;
        return availableChartThemes.includes(chartThemeName!) ? chartThemeName! : availableChartThemes[0];
    }

    private getAllKeysInObjects(objects: any[]): string[] {
        const allValues: any = {};

        objects
            .filter((obj) => obj != null)
            .forEach((obj) => {
                Object.keys(obj).forEach((key) => (allValues[key] = null));
            });

        return Object.keys(allValues);
    }

    private validateCustomThemes() {
        const suppliedThemes = this.getChartThemes();
        const customChartThemes = this.gos.get('customChartThemes');
        if (customChartThemes) {
            this.getAllKeysInObjects([customChartThemes]).forEach((customThemeName) => {
                if (!suppliedThemes.includes(customThemeName)) {
                    _warn(139, { customThemeName });
                }
            });
        }
    }

    private reactivePropertyUpdate(): void {
        // switch to the first theme if the current theme is unavailable
        this.chartController.setChartThemeName(this.getThemeName(), true);

        const chartId = this.getChartId();
        const modelType = this.chartController.isCrossFilterChart() ? 'crossFilter' : this.getChartModel().modelType;

        // standalone requires that `undefined` / `null` values are supplied as `{}`
        const chartThemeOverrides = this.gos.get('chartThemeOverrides') || {};

        this.update({
            type: `${modelType}ChartUpdate`,
            chartId,
            chartThemeOverrides,
        });
    }

    private raiseChartCreatedEvent(): void {
        this.chartProxy
            .getChart()
            .waitForUpdate()
            .then(() => {
                this.eventSvc.dispatchEvent({
                    type: 'chartCreated',
                    chartId: this.chartController.getChartId(),
                });
            });
    }

    private raiseChartDestroyedEvent(): void {
        this.eventSvc.dispatchEvent({
            type: 'chartDestroyed',
            chartId: this.chartController.getChartId(),
        });
    }

    public override destroy(): void {
        super.destroy();

        if (this.chartProxy) {
            this.chartProxy.destroy();
        }

        this.destroyBean(this.chartMenu);

        // don't want to invoke destroy() on the Dialog (prevents destroy loop)
        if (this.chartDialog && this.chartDialog.isAlive()) {
            this.destroyBean(this.chartDialog);
        }

        this.onDestroyColorSchemeChangeListener?.();

        // if the user is providing containers for the charts, we need to clean up, otherwise the old chart
        // data will still be visible although the chart is no longer bound to the grid
        const eGui = this.getGui();
        _clearElement(eGui);
        // remove from parent, so if user provided container, we detach from the provided dom element
        _removeFromParent(eGui);

        this.raiseChartDestroyedEvent();
    }
}
