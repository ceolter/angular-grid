import type { AgChartThemePalette } from 'ag-charts-types';

import {
    Component,
    RefPlaceholder,
    _areEqual,
    _clearElement,
    _createIconNoSpan,
    _getAbsoluteWidth,
    _radioCssClass,
    _setDisplayed,
} from 'ag-grid-community';

import type { ChartController } from '../../chartController';
import { isStockTheme } from '../../chartProxies/chartTheme';
import { MiniChartsContainer } from './miniChartsContainer';

type AnimationDirection = 'left' | 'right';

export class ChartSettingsPanel extends Component {
    private readonly eMiniChartsContainer: HTMLElement = RefPlaceholder;
    private readonly eNavBar: HTMLElement = RefPlaceholder;
    private readonly eCardSelector: HTMLElement = RefPlaceholder;
    private readonly ePrevBtn: HTMLElement = RefPlaceholder;
    private readonly eNextBtn: HTMLElement = RefPlaceholder;

    private miniChartsContainers: MiniChartsContainer[] = [];
    private cardItems: HTMLElement[] = [];

    private activePaletteIndex = 0;
    private palettes: AgChartThemePalette[] = [];
    private themes: string[] = [];

    private isAnimating: boolean;

    constructor(private readonly chartController: ChartController) {
        super(/* html */ `<div class="ag-chart-settings-wrapper">
            <div data-ref="eMiniChartsContainer" class="ag-chart-settings-mini-charts-container ag-scrollable-container"></div>
            <div data-ref="eNavBar" class="ag-chart-settings-nav-bar">
                <div data-ref="ePrevBtn" class="ag-chart-settings-prev">
                    <button type="button" class="ag-button ag-chart-settings-prev-button"></button>
                </div>
                <div data-ref="eCardSelector" class="ag-chart-settings-card-selector"></div>
                <div data-ref="eNextBtn" class="ag-chart-settings-next">
                    <button type="button" class="ag-button ag-chart-settings-next-button"></button>
                </div>
            </div>
        </div>`);
    }

    public postConstruct() {
        this.resetPalettes();

        this.ePrevBtn.insertAdjacentElement('afterbegin', _createIconNoSpan('chartsThemePrevious', this.beans)!);
        this.eNextBtn.insertAdjacentElement('afterbegin', _createIconNoSpan('chartsThemeNext', this.beans)!);

        this.addManagedElementListeners(this.ePrevBtn, { click: () => this.setActivePalette(this.getPrev(), 'left') });
        this.addManagedElementListeners(this.eNextBtn, { click: () => this.setActivePalette(this.getNext(), 'right') });

        // change the selected chart when a combo chart is modified via the data panel, i.e. the custom combo should be selected
        const reset = () => this.resetPalettes(true);
        this.addManagedListeners(this.chartController, {
            chartTypeChanged: reset,
            chartApiUpdate: reset,
        });

        this.scrollSelectedIntoView();
    }

    private scrollSelectedIntoView(): void {
        // the panel is not immediately visible due to the slide animation, so we add a
        // setTimeout to wait until the panel animation is over and is able to scroll
        setTimeout(() => {
            const isMiniChartsContainerVisible = (miniChartsContainers: MiniChartsContainer) => {
                return !miniChartsContainers.getGui().classList.contains('ag-hidden');
            };
            const currentMiniChartContainer = this.miniChartsContainers.find(isMiniChartsContainerVisible);
            const currentChart = currentMiniChartContainer!.getGui().querySelector('.ag-selected') as HTMLElement;

            if (currentChart) {
                const parent = currentChart.offsetParent as HTMLElement;
                if (parent) {
                    this.eMiniChartsContainer.scrollTo(0, parent.offsetTop);
                }
            }
        }, 250);
    }

    private resetPalettes(forceReset?: boolean): void {
        const palettes = this.chartController.getPalettes();
        const themeTemplateParameters = this.chartController.getThemeTemplateParameters();
        const chartGroups = this.gos.get('chartToolPanelsDef')?.settingsPanel?.chartGroupsDef;

        if ((_areEqual(palettes, this.palettes) && !forceReset) || this.isAnimating) {
            return;
        }

        this.palettes = palettes;
        this.themes = this.chartController.getThemeNames();
        this.activePaletteIndex = this.themes.findIndex((name) => name === this.chartController.getChartThemeName());
        this.cardItems = [];

        _clearElement(this.eCardSelector);

        this.destroyMiniCharts();

        const { themes } = this;

        this.palettes.forEach((palette, index) => {
            const isActivePalette = this.activePaletteIndex === index;
            const { fills = [], strokes = [] } = palette;
            const themeName = themes[index];
            const isCustomTheme = !isStockTheme(themeName);
            const miniChartsContainer = this.createBean(
                new MiniChartsContainer(
                    this.chartController,
                    fills,
                    strokes,
                    themeTemplateParameters[index],
                    isCustomTheme,
                    chartGroups
                )
            );

            this.miniChartsContainers.push(miniChartsContainer);
            this.eMiniChartsContainer.appendChild(miniChartsContainer.getGui());
            this.addCardLink(index);

            if (isActivePalette) {
                miniChartsContainer.updateSelectedMiniChart();
            } else {
                miniChartsContainer.setDisplayed(false);
            }
        });

        _setDisplayed(this.eNavBar, this.palettes.length > 1);
        _radioCssClass(this.cardItems[this.activePaletteIndex], 'ag-selected', 'ag-not-selected');
    }

    private addCardLink(index: number): void {
        const link = document.createElement('div');
        link.classList.add('ag-chart-settings-card-item');

        this.addManagedElementListeners(link, {
            click: () => {
                this.setActivePalette(index, index < this.activePaletteIndex ? 'left' : 'right');
            },
        });

        this.eCardSelector.appendChild(link);
        this.cardItems.push(link);
    }

    private getPrev(): number {
        let prev = this.activePaletteIndex - 1;

        if (prev < 0) {
            prev = this.palettes.length - 1;
        }

        return prev;
    }

    private getNext(): number {
        let next = this.activePaletteIndex + 1;

        if (next >= this.palettes.length) {
            next = 0;
        }

        return next;
    }

    private setActivePalette(index: number, animationDirection: AnimationDirection) {
        if (this.isAnimating || this.activePaletteIndex === index) {
            return;
        }

        _radioCssClass(this.cardItems[index], 'ag-selected', 'ag-not-selected');

        const currentPalette = this.miniChartsContainers[this.activePaletteIndex];
        const currentGui = currentPalette.getGui();
        const futurePalette = this.miniChartsContainers[index];
        const nextGui = futurePalette.getGui();

        currentPalette.updateSelectedMiniChart();
        futurePalette.updateSelectedMiniChart();

        const multiplier = animationDirection === 'left' ? -1 : 1;
        const final = (nextGui.style.left = `${_getAbsoluteWidth(this.getGui()) * multiplier}px`);

        this.activePaletteIndex = index;

        this.isAnimating = true;

        const animatingClass = 'ag-animating';

        futurePalette.setDisplayed(true);
        currentPalette.addCssClass(animatingClass);
        futurePalette.addCssClass(animatingClass);

        this.chartController.setChartThemeName(this.themes[index]);

        window.setTimeout(() => {
            currentGui.style.left = `${-parseFloat(final)}px`;
            nextGui.style.left = '0px';
        }, 0);

        window.setTimeout(() => {
            this.isAnimating = false;

            currentPalette.removeCssClass(animatingClass);
            futurePalette.removeCssClass(animatingClass);
            currentPalette.setDisplayed(false);
        }, 300);
    }

    private destroyMiniCharts(): void {
        _clearElement(this.eMiniChartsContainer);

        this.miniChartsContainers = this.destroyBeans(this.miniChartsContainers);
    }

    public override destroy(): void {
        this.destroyMiniCharts();
        super.destroy();
    }
}
