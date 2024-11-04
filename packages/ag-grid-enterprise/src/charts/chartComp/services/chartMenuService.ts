import type {
    BeanCollection,
    ChartToolPanelMenuOptions,
    ChartToolPanelName,
    ChartToolbarMenuItemOptions,
    GetChartToolbarItemsParams,
    NamedBean,
    WithoutGridCommon,
} from 'ag-grid-community';
import { BeanStub, _warn } from 'ag-grid-community';

import type { ChartController } from '../chartController';
import type { AdvancedSettingsMenuFactory } from '../menu/advancedSettings/advancedSettingsMenuFactory';
import type { ChartMenuContext } from '../menu/chartMenuContext';

const CHART_TOOLBAR_ALLOW_LIST: ChartToolbarMenuItemOptions[] = [
    'chartUnlink',
    'chartLink',
    'chartDownload',
    'chartMenu',
];

export const CHART_TOOL_PANEL_MENU_OPTIONS: { [key in ChartToolPanelName]: ChartToolPanelMenuOptions } = {
    settings: 'chartSettings',
    data: 'chartData',
    format: 'chartFormat',
};

export class ChartMenuService extends BeanStub implements NamedBean {
    beanName = 'chartMenuSvc' as const;

    private advSettingsMenuFactory?: AdvancedSettingsMenuFactory;

    public wireBeans(beans: BeanCollection) {
        this.advSettingsMenuFactory = beans.advSettingsMenuFactory as AdvancedSettingsMenuFactory;
    }

    public downloadChart(
        chartMenuContext: ChartMenuContext,
        dimensions?: { width: number; height: number },
        fileName?: string,
        fileFormat?: string
    ): void {
        chartMenuContext.chartController.getChartProxy().downloadChart(dimensions, fileName, fileFormat);
    }

    public toggleLinked(chartMenuContext: ChartMenuContext): void {
        chartMenuContext.chartController.detachChartRange();
    }

    public openAdvancedSettings(chartMenuContext: ChartMenuContext, eventSource?: HTMLElement): void {
        this.advSettingsMenuFactory?.showMenu(chartMenuContext, eventSource);
    }

    public hideAdvancedSettings(): void {
        this.advSettingsMenuFactory?.hideMenu();
    }

    public getChartToolbarOptions(): ChartToolbarMenuItemOptions[] {
        const defaultChartToolbarOptions: ChartToolbarMenuItemOptions[] = ['chartMenu'];

        const toolbarItemsFunc = this.gos.getCallback('getChartToolbarItems');
        const params: WithoutGridCommon<GetChartToolbarItemsParams> = {
            defaultItems: defaultChartToolbarOptions,
        };
        return toolbarItemsFunc
            ? toolbarItemsFunc(params).filter((option) => {
                  if (!CHART_TOOLBAR_ALLOW_LIST.includes(option)) {
                      _warn(155, { option });
                      return false;
                  }
                  return true;
              })
            : defaultChartToolbarOptions;
    }

    public getChartToolPanels(chartController: ChartController): {
        panels: ChartToolPanelMenuOptions[];
        defaultPanel: ChartToolPanelMenuOptions;
    } {
        const chartToolPanelsDef = this.gos.get('chartToolPanelsDef');

        const panelsOverride = chartToolPanelsDef?.panels
            ?.map((panel) => {
                const menuOption = CHART_TOOL_PANEL_MENU_OPTIONS[panel];
                if (!menuOption) {
                    _warn(156, { panel });
                }
                return menuOption;
            })
            .filter((panel) => Boolean(panel));
        let panels = panelsOverride ?? Object.values(CHART_TOOL_PANEL_MENU_OPTIONS);

        // pivot charts use the column tool panel instead of the data panel
        if (chartController.isPivotChart()) {
            panels = panels.filter((panel) => panel !== 'chartData');
        }

        const defaultToolPanel = chartToolPanelsDef?.defaultToolPanel;
        const defaultPanel = (defaultToolPanel && CHART_TOOL_PANEL_MENU_OPTIONS[defaultToolPanel]) || panels[0];

        return {
            panels,
            defaultPanel,
        };
    }

    public doesChartToolbarExist(): boolean {
        const chartToolbarOptions = this.getChartToolbarOptions();
        return chartToolbarOptions.length > 0;
    }

    public doChartToolPanelsExist(chartController: ChartController): boolean {
        const { panels } = this.getChartToolPanels(chartController);
        return panels.length > 0;
    }
}
