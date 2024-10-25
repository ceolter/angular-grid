import type { BeanCollection, ChartDataPanel as ChartDataPanelType, ChartType, IChartService } from 'ag-grid-community';
import { AgToggleButton, Component, _getDocument, _setDisplayed, _warn } from 'ag-grid-community';

import type { ChartController } from '../../chartController';
import type { ColState } from '../../model/chartDataModel';
import type { ChartTranslationService } from '../../services/chartTranslationService';
import { getMaxNumCategories, getMaxNumSeries, supportsInvertedCategorySeries } from '../../utils/seriesTypeMapper';
import type { ChartMenuContext } from '../chartMenuContext';
import { CategoriesDataPanel } from './categoriesDataPanel';
import { ChartSpecificDataPanel } from './chartSpecificDataPanel';
import { SeriesChartTypePanel } from './seriesChartTypePanel';
import { SeriesDataPanel } from './seriesDataPanel';

const DefaultDataPanelDef: ChartDataPanelType = {
    groups: [
        { type: 'categories', isOpen: true },
        { type: 'series', isOpen: true },
        { type: 'seriesChartType', isOpen: true },
        { type: 'chartSpecific', isOpen: true },
    ],
};

export class ChartDataPanel extends Component {
    protected chartTranslationService: ChartTranslationService;
    private chartSvc: IChartService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslationService = beans.chartTranslationService as ChartTranslationService;
        this.chartSvc = beans.chartSvc!;
    }

    private readonly chartController: ChartController;
    private chartType?: ChartType;
    private isSwitchCategorySeriesToggled = false;
    private categoriesDataPanel?: CategoriesDataPanel;
    private seriesDataPanel?: SeriesDataPanel;
    private seriesChartTypePanel?: SeriesChartTypePanel;
    private chartSpecificPanel?: ChartSpecificDataPanel;
    private switchCategorySeriesToggle: AgToggleButton;
    private restoreSwitchCategorySeriesToggleFocus = false;
    private panels: Component[] = [];

    constructor(private readonly chartMenuContext: ChartMenuContext) {
        super(/* html */ `<div class="ag-chart-data-wrapper ag-scrollable-container"></div>`);

        this.chartController = chartMenuContext.chartController;
    }

    public postConstruct() {
        this.createSwitchCategorySeriesToggle();
        this.isSwitchCategorySeriesToggled = this.chartController.isCategorySeriesSwitched();

        this.updatePanels();
        const listener = this.updatePanels.bind(this);
        this.addManagedListeners(this.chartController, {
            chartModelUpdate: listener,
            chartApiUpdate: listener,
        });
    }

    public override destroy(): void {
        this.clearPanelComponents();
        super.destroy();
    }

    private updatePanels() {
        const currentChartType = this.chartType;
        const isSwitchCategorySeriesToggledCurrent = this.isSwitchCategorySeriesToggled;
        const { dimensionCols, valueCols } = this.chartController.getColStateForMenu();

        this.chartType = this.chartController.getChartType();

        // Determine the state of the category/series toggle
        this.isSwitchCategorySeriesToggled = this.chartController.isCategorySeriesSwitched();
        const hasChangedSwitchCategorySeries =
            this.isSwitchCategorySeriesToggled !== isSwitchCategorySeriesToggledCurrent;

        // Attempt to re-use existing panels where possible in order to maintain keyboard focus
        if (this.canRefresh(currentChartType, this.chartType) && !hasChangedSwitchCategorySeries) {
            this.categoriesDataPanel?.refresh(dimensionCols);
            this.seriesDataPanel?.refresh(valueCols);
            this.seriesChartTypePanel?.refresh(valueCols);
            this.chartSpecificPanel?.refresh();
        } else {
            this.recreatePanels(dimensionCols, valueCols);
        }

        // Ensure the category/series toggle UI control is up-to-date
        const isSwitchCategorySeriesDisplayed =
            supportsInvertedCategorySeries(this.chartType) &&
            this.chartSvc.isEnterprise() &&
            !this.chartController.isGrouping();
        _setDisplayed(this.switchCategorySeriesToggle.getGui(), isSwitchCategorySeriesDisplayed);
        if (hasChangedSwitchCategorySeries) {
            this.switchCategorySeriesToggle?.setValue(this.chartController.isCategorySeriesSwitched());
        }
        if (this.restoreSwitchCategorySeriesToggleFocus) {
            this.restoreSwitchCategorySeriesToggleFocus = false;
            if (isSwitchCategorySeriesDisplayed) {
                this.switchCategorySeriesToggle.getFocusableElement().focus();
            }
        }
    }

    private canRefresh(oldChartType: ChartType | undefined, newChartType: ChartType): boolean {
        if (oldChartType === undefined) return false;
        if (oldChartType === newChartType) {
            return true;
        }
        const isCombo = (chartType: ChartType) =>
            ['columnLineCombo', 'areaColumnCombo', 'customCombo'].includes(chartType);
        if (isCombo(oldChartType) && isCombo(newChartType)) {
            return true;
        }
        return false;
    }

    private recreatePanels(dimensionCols: ColState[], valueCols: ColState[]): void {
        this.clearPanelComponents();

        const { chartType } = this;
        if (!chartType) return;

        const isCategorySeriesSwitched = this.chartController.isCategorySeriesSwitched();

        this.getDataPanelDef().groups?.forEach(({ type, isOpen }) => {
            if (type === (isCategorySeriesSwitched ? 'series' : 'categories')) {
                this.categoriesDataPanel = this.createBean(
                    new CategoriesDataPanel(
                        this.chartController,
                        this.getCategoryGroupTitle(isCategorySeriesSwitched),
                        this.getCategoryGroupMultipleSelect(chartType, isCategorySeriesSwitched),
                        dimensionCols,
                        isOpen
                    )
                );
                this.panels.push(this.categoriesDataPanel);
            } else if (type === (isCategorySeriesSwitched ? 'categories' : 'series')) {
                this.seriesDataPanel = this.createBean(
                    new SeriesDataPanel(
                        this.chartController,
                        this.chartMenuContext.chartOptionsService,
                        this.getSeriesGroupTitle(isCategorySeriesSwitched),
                        this.getSeriesGroupMultipleSelect(chartType, isCategorySeriesSwitched),
                        this.getSeriesGroupMaxSelection(chartType, isCategorySeriesSwitched),
                        valueCols,
                        isOpen
                    )
                );
                this.panels.push(this.seriesDataPanel);
            } else if (type === 'seriesChartType') {
                if (this.chartController.isComboChart()) {
                    this.seriesChartTypePanel = this.createBean(
                        new SeriesChartTypePanel(this.chartController, valueCols, isOpen)
                    );
                    this.panels.push(this.seriesChartTypePanel);
                }
            } else if (type === 'chartSpecific') {
                this.chartSpecificPanel = this.createBean(new ChartSpecificDataPanel(this.chartMenuContext, isOpen));
                this.panels.push(this.chartSpecificPanel);
            } else {
                _warn(144, { type });
            }
        });

        (isCategorySeriesSwitched ? this.categoriesDataPanel : this.seriesDataPanel)?.addItem(
            this.switchCategorySeriesToggle.getGui()
        );

        this.addPanelComponents();
    }

    private addPanelComponents(): void {
        if (!this.panels.length) {
            return;
        }
        const eDocument = _getDocument(this.gos);
        const fragment = eDocument.createDocumentFragment();
        for (const panel of this.panels) {
            panel.addCssClass('ag-chart-data-section');
            fragment.appendChild(panel.getGui());
        }
        this.getGui().appendChild(fragment);
    }

    private clearPanelComponents() {
        const eGui = this.getGui();

        this.panels.forEach((panel) => {
            eGui.removeChild(panel.getGui());
            this.destroyBean(panel);
        });
        this.panels = [];
    }

    private getDataPanelDef() {
        return this.gos.get('chartToolPanelsDef')?.dataPanel ?? DefaultDataPanelDef;
    }

    private getCategoryGroupTitle(isCategorySeriesSwitched: boolean): string {
        if (isCategorySeriesSwitched) return this.chartTranslationService.translate('seriesLabels');
        return this.chartTranslationService.translate(this.chartController.isActiveXYChart() ? 'labels' : 'categories');
    }

    private getCategoryGroupMultipleSelect(chartType: ChartType, isCategorySeriesSwitched: boolean): boolean {
        if (isCategorySeriesSwitched) return false;
        return getMaxNumCategories(chartType) !== 1;
    }

    private getSeriesGroupTitle(isCategorySeriesSwitched: boolean): string {
        if (isCategorySeriesSwitched) return this.chartTranslationService.translate('categoryValues');
        return this.chartTranslationService.translate(this.chartController.isActiveXYChart() ? 'xyValues' : 'series');
    }

    private getSeriesGroupMultipleSelect(chartType: ChartType, isCategorySeriesSwitched: boolean): boolean {
        return this.getSeriesGroupMaxSelection(chartType, isCategorySeriesSwitched) !== 1;
    }

    private getSeriesGroupMaxSelection(chartType: ChartType, isCategorySeriesSwitched: boolean): number | undefined {
        if (isCategorySeriesSwitched) return undefined;
        return getMaxNumSeries(chartType);
    }

    private createSwitchCategorySeriesToggle(): void {
        this.switchCategorySeriesToggle = this.createManagedBean(
            new AgToggleButton({
                label: this.chartTranslationService.translate('switchCategorySeries'),
                labelAlignment: 'left',
                labelWidth: 'flex',
                inputWidth: 'flex',
                value: this.chartController.isCategorySeriesSwitched(),
                onValueChange: (value) => {
                    this.restoreSwitchCategorySeriesToggleFocus = true;
                    this.chartController.switchCategorySeries(value);
                },
            })
        );
    }
}
