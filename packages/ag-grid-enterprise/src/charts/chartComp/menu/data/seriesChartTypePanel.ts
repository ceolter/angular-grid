import type { BeanCollection, ChartType, SeriesChartType } from 'ag-grid-community';
import { AgCheckbox, AgSelect, Component, _areEqual, _clearElement } from 'ag-grid-community';

import { AgGroupComponent } from '../../../../widgets/agGroupComponent';
import type { ChartController } from '../../chartController';
import type { ColState } from '../../model/chartDataModel';
import type { ChartTranslationService } from '../../services/chartTranslationService';
import { getFullChartNameTranslationKey } from '../../utils/seriesTypeMapper';

export class SeriesChartTypePanel extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }

    private seriesChartTypeGroupComp: AgGroupComponent;
    private selectedColIds: string[] = [];
    private chartTypeComps: Map<string, AgSelect> = new Map();
    private secondaryAxisComps: Map<string, AgCheckbox> = new Map();

    constructor(
        private readonly chartController: ChartController,
        private columns: ColState[],
        private isOpen?: boolean
    ) {
        super(/* html */ `<div id="seriesChartTypeGroup"></div>`);
    }

    public postConstruct() {
        this.createSeriesChartTypeGroup(this.columns);
    }

    public refresh(columns: ColState[]): void {
        if (!_areEqual(this.getValidColIds(columns), this.selectedColIds)) {
            this.recreate(columns);
        } else {
            this.refreshComps();
        }
    }

    private recreate(columns: ColState[]): void {
        this.isOpen = this.seriesChartTypeGroupComp.isExpanded();
        _clearElement(this.getGui());
        this.destroyBean(this.seriesChartTypeGroupComp);
        this.columns = columns;
        this.selectedColIds = [];
        this.clearComps();
        this.postConstruct();
    }

    private getValidColIds(columns: ColState[]): string[] {
        const seriesChartTypes = this.chartController.getSeriesChartTypes();

        return columns
            .filter((col) => col.selected && !!seriesChartTypes.filter((s) => s.colId === col.colId)[0])
            .map(({ colId }) => colId);
    }

    private createSeriesChartTypeGroup(columns: ColState[]): void {
        this.seriesChartTypeGroupComp = this.createBean(
            new AgGroupComponent({
                title: this.chartTranslation.translate('seriesChartType'),
                enabled: true,
                suppressEnabledCheckbox: true,
                suppressOpenCloseIcons: false,
                cssIdentifier: 'charts-data',
                expanded: this.isOpen,
            })
        );

        const seriesChartTypes = this.chartController.getSeriesChartTypes();

        columns.forEach((col) => {
            if (!col.selected) {
                return;
            }

            const seriesChartType: SeriesChartType = seriesChartTypes.filter((s) => s.colId === col.colId)[0];
            if (!seriesChartType) {
                return;
            }

            this.selectedColIds.push(col.colId);

            const seriesItemGroup = this.seriesChartTypeGroupComp.createManagedBean(
                new AgGroupComponent({
                    title: col.displayName!,
                    enabled: true,
                    suppressEnabledCheckbox: true,
                    suppressOpenCloseIcons: true,
                    cssIdentifier: 'charts-format-sub-level',
                })
            );

            const isSecondaryAxisDisabled = (chartType: ChartType) =>
                ['groupedColumn', 'stackedColumn', 'stackedArea'].includes(chartType);

            const secondaryAxisComp = this.seriesChartTypeGroupComp.createManagedBean(
                new AgCheckbox({
                    label: this.chartTranslation.translate('secondaryAxis'),
                    labelWidth: 'flex',
                    disabled: isSecondaryAxisDisabled(seriesChartType.chartType),
                    value: !!seriesChartType.secondaryAxis,
                    onValueChange: (enabled: boolean) =>
                        this.chartController.updateSeriesChartType(col.colId, undefined, enabled),
                })
            );

            seriesItemGroup.addItem(secondaryAxisComp);

            const options = (['line', 'area', 'stackedArea', 'groupedColumn', 'stackedColumn'] as const).map(
                (value) => ({
                    value,
                    text: this.chartTranslation.translate(getFullChartNameTranslationKey(value)),
                })
            );

            const chartTypeComp = seriesItemGroup.createManagedBean(
                new AgSelect({
                    options,
                    value: seriesChartType.chartType,
                    onValueChange: (chartType: ChartType) =>
                        this.chartController.updateSeriesChartType(col.colId, chartType),
                })
            );

            seriesItemGroup.addItem(chartTypeComp);

            this.seriesChartTypeGroupComp.addItem(seriesItemGroup);
            this.chartTypeComps.set(col.colId, chartTypeComp);
            this.secondaryAxisComps.set(col.colId, secondaryAxisComp);
        });

        this.getGui().appendChild(this.seriesChartTypeGroupComp.getGui());
    }

    private refreshComps(): void {
        const seriesChartTypes = this.chartController.getSeriesChartTypes();
        this.selectedColIds.forEach((colId) => {
            const seriesChartType = seriesChartTypes.find((chartType) => chartType.colId === colId);
            if (!seriesChartType) {
                return;
            }
            const chartTypeComp = this.chartTypeComps.get(colId);
            const secondaryAxisComp = this.secondaryAxisComps.get(colId);

            chartTypeComp?.setValue(seriesChartType.chartType);
            secondaryAxisComp?.setValue(!!seriesChartType.secondaryAxis);
            secondaryAxisComp?.setDisabled(this.isSecondaryAxisDisabled(seriesChartType.chartType));
        });
    }

    private clearComps(): void {
        this.chartTypeComps.clear();
        this.secondaryAxisComps.clear();
    }

    private isSecondaryAxisDisabled(chartType: ChartType): boolean {
        return ['groupedColumn', 'stackedColumn', 'stackedArea'].includes(chartType);
    }

    public override destroy(): void {
        this.clearComps();
        this.seriesChartTypeGroupComp = this.destroyBean(this.seriesChartTypeGroupComp)!;
        super.destroy();
    }
}
