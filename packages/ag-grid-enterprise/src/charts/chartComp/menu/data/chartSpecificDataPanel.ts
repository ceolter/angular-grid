import type { BeanCollection, IChartService } from 'ag-grid-community';
import { AgSelect, Component, RefPlaceholder } from 'ag-grid-community';

import type { AgGroupComponent, AgGroupComponentParams } from '../../../../widgets/agGroupComponent';
import { AgGroupComponentSelector } from '../../../../widgets/agGroupComponent';
import type { ChartTranslationService } from '../../services/chartTranslationService';
import {
    SERIES_GROUP_TYPES,
    canSwitchDirection,
    getFullChartNameTranslationKey,
    getSeriesType,
} from '../../utils/seriesTypeMapper';
import type { ChartMenuContext } from '../chartMenuContext';
import { ChartMenuParamsFactory } from '../chartMenuParamsFactory';

export class ChartSpecificDataPanel extends Component {
    private chartTranslation: ChartTranslationService;
    private chartSvc: IChartService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
        this.chartSvc = beans.chartSvc!;
    }

    private readonly chartSpecificGroup: AgGroupComponent = RefPlaceholder;

    private directionSelect?: AgSelect;
    private groupTypeSelect?: AgSelect;
    private hasContent = false;

    constructor(
        private readonly chartMenuContext: ChartMenuContext,
        private isOpen?: boolean
    ) {
        super();
    }

    public postConstruct(): void {
        const title = this.getTitle();
        const chartSpecificGroupParams: AgGroupComponentParams = {
            title,
            enabled: true,
            suppressEnabledCheckbox: true,
            suppressOpenCloseIcons: false,
            cssIdentifier: 'charts-data',
            expanded: this.isOpen,
            items: [...this.createDirectionSelect(), this.createGroupTypeSelect()],
        };
        this.setTemplate(
            /* html */ `
            <div id="chartSpecificGroup">
                <ag-group-component data-ref="chartSpecificGroup"></ag-group-component>
            </div>`,
            [AgGroupComponentSelector],
            {
                chartSpecificGroup: chartSpecificGroupParams,
            }
        );
        this.setDisplayed(this.hasContent);
    }

    public refresh(): void {
        this.hasContent = false;
        this.chartSpecificGroup.setTitle(this.getTitle());
        this.updateDirectionSelect();
        this.updateGroupTypeSelect();
        this.setDisplayed(this.hasContent);
    }

    private getTitle(): string {
        const chartType = this.chartMenuContext.chartController.getChartType();
        return this.chartTranslation.translate(getFullChartNameTranslationKey(chartType));
    }

    private createDirectionSelect(): AgSelect[] {
        if (!this.chartSvc.isEnterprise()) {
            return [];
        }
        const { chartOptionsService, chartController } = this.chartMenuContext;
        const chartOptionsSeriesProxy = chartOptionsService.getSeriesOptionsProxy(() =>
            getSeriesType(chartController.getChartType())
        );
        const chartSeriesMenuParamsFactory = this.createManagedBean(
            new ChartMenuParamsFactory(chartOptionsSeriesProxy)
        );
        const options = (['horizontal', 'vertical'] as const).map((value) => ({
            value,
            text: this.chartTranslation.translate(value),
        }));
        const params = chartSeriesMenuParamsFactory.getDefaultSelectParams('direction', 'direction', options);
        const onValueChange = params.onValueChange;
        params.onValueChange = (value) => {
            onValueChange!(value);
            // series and axes configuration are based on direction
            chartController.raiseChartModelUpdateEvent();
        };
        this.directionSelect = this.createManagedBean(new AgSelect(params));
        this.updateDirectionSelect();
        return [this.directionSelect];
    }

    private updateDirectionSelect(): void {
        const isDisplayed = canSwitchDirection(this.chartMenuContext.chartController.getChartType());
        this.updateDisplayed(this.directionSelect, isDisplayed);
    }

    private createGroupTypeSelect(): AgSelect {
        const { chartController, chartMenuParamsFactory } = this.chartMenuContext;
        this.groupTypeSelect = this.createManagedBean(
            new AgSelect(
                chartMenuParamsFactory.getDefaultSelectParamsWithoutValueParams(
                    'seriesGroupType',
                    SERIES_GROUP_TYPES.map((value) => ({
                        value,
                        text: this.chartTranslation.translate(`${value}SeriesGroupType`),
                    })),
                    chartController.getSeriesGroupType(),
                    (value) => chartController.setSeriesGroupType(value)
                )
            )
        );
        this.updateGroupTypeSelect();
        return this.groupTypeSelect;
    }

    private updateGroupTypeSelect(): void {
        const isDisplayed = ['radialColumn', 'radialBar', 'nightingale'].includes(
            this.chartMenuContext.chartController.getChartType()
        );
        this.updateDisplayed(this.groupTypeSelect, isDisplayed);
    }

    private updateDisplayed(select: AgSelect | undefined, isDisplayed: boolean): void {
        select?.setDisplayed(isDisplayed);
        if (select) {
            this.hasContent = this.hasContent || isDisplayed;
        }
    }
}
