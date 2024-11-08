import type {
    BeanCollection,
    DefaultChartMenuItem,
    IAfterGuiAttachedParams,
    IconName,
    MenuItemDef,
    NamedBean,
    PopupService,
} from 'ag-grid-community';
import {
    BeanStub,
    Component,
    RefPlaceholder,
    _createIconNoSpan,
    _focusInto,
    _isNothingFocused,
} from 'ag-grid-community';

import { AgMenuList } from '../../../widgets/agMenuList';
import type { ChartController } from '../chartController';
import type { ChartMenuService } from '../services/chartMenuService';
import type { ChartTranslationService } from '../services/chartTranslationService';
import type { ChartMenuContext } from './chartMenuContext';

export class ChartMenuListFactory extends BeanStub implements NamedBean {
    beanName = 'chartMenuListFactory' as const;

    private popupSvc: PopupService;
    private chartMenuSvc: ChartMenuService;
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.popupSvc = beans.popupSvc!;
        this.chartMenuSvc = beans.chartMenuSvc as ChartMenuService;
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }

    private activeChartMenuList?: ChartMenuList;

    public showMenuList(params: {
        eventSource: HTMLElement;
        showMenu: () => void;
        chartMenuContext: ChartMenuContext;
    }): void {
        const { eventSource, showMenu, chartMenuContext } = params;
        const areChartToolPanelsEnabled = this.chartMenuSvc.doChartToolPanelsExist(chartMenuContext.chartController);
        const menuItems = this.mapWithStockItems(
            this.getMenuItems(chartMenuContext.chartController, areChartToolPanelsEnabled),
            chartMenuContext,
            showMenu,
            eventSource,
            areChartToolPanelsEnabled
        );
        if (!menuItems.length) {
            return;
        }
        const chartMenuList = this.createBean(new ChartMenuList(menuItems));
        this.activeChartMenuList = chartMenuList;

        let multiplier = -1;
        let alignSide: 'left' | 'right' = 'left';

        if (this.gos.get('enableRtl')) {
            multiplier = 1;
            alignSide = 'right';
        }

        const eGui = chartMenuList.getGui();

        this.popupSvc.addPopup({
            modal: true,
            eChild: eGui,
            closeOnEsc: true,
            closedCallback: () => {
                this.destroyBean(chartMenuList);
                this.activeChartMenuList = undefined;
                if (_isNothingFocused(this.beans)) {
                    eventSource.focus({ preventScroll: true });
                }
            },
            afterGuiAttached: (params) => chartMenuList.afterGuiAttached(params),
            positionCallback: () => {
                {
                    this.popupSvc.positionPopupByComponent({
                        type: 'chartMenu',
                        eventSource,
                        ePopup: eGui,
                        alignSide,
                        nudgeX: 4 * multiplier,
                        nudgeY: 4,
                        position: 'under',
                        keepWithinBounds: true,
                    });
                }
            },
            ariaLabel: 'Chart Menu',
        });
    }

    private getMenuItems(
        chartController: ChartController,
        areChartToolPanelsEnabled: boolean
    ): (MenuItemDef | DefaultChartMenuItem)[] {
        const defaultItems: DefaultChartMenuItem[] = [
            ...(areChartToolPanelsEnabled ? (['chartEdit'] as const) : []),
            ...(chartController.isEnterprise() ? (['chartAdvancedSettings'] as const) : []),
            chartController.isChartLinked() ? 'chartUnlink' : 'chartLink',
            'chartDownload',
        ];
        const chartMenuItems = this.gos.get('chartMenuItems');
        if (!chartMenuItems) {
            return defaultItems;
        } else if (Array.isArray(chartMenuItems)) {
            return chartMenuItems;
        } else {
            return chartMenuItems(
                this.gos.addGridCommonParams({
                    defaultItems,
                })
            );
        }
    }

    private mapWithStockItems(
        originalList: (MenuItemDef | DefaultChartMenuItem)[],
        chartMenuContext: ChartMenuContext,
        showMenu: () => void,
        eventSource: HTMLElement,
        areChartToolPanelsEnabled: boolean
    ): MenuItemDef[] {
        if (!originalList) {
            return [];
        }
        const resultList: MenuItemDef[] = [];

        originalList.forEach((menuItemOrString) => {
            let result: MenuItemDef | null;
            if (typeof menuItemOrString === 'string') {
                result = this.getStockMenuItem(
                    menuItemOrString,
                    chartMenuContext,
                    showMenu,
                    eventSource,
                    areChartToolPanelsEnabled
                );
            } else {
                result = { ...menuItemOrString };
            }
            if (!result) {
                return;
            }

            const { subMenu } = result;
            if (Array.isArray(subMenu)) {
                result.subMenu = this.mapWithStockItems(
                    subMenu as (DefaultChartMenuItem | MenuItemDef)[],
                    chartMenuContext,
                    showMenu,
                    eventSource,
                    areChartToolPanelsEnabled
                );
            }

            resultList.push(result);
        });

        return resultList;
    }

    private getStockMenuItem(
        key: DefaultChartMenuItem,
        chartMenuContext: ChartMenuContext,
        showMenu: () => void,
        eventSource: HTMLElement,
        areChartToolPanelsEnabled: boolean
    ): MenuItemDef | null {
        switch (key) {
            case 'chartEdit':
                return areChartToolPanelsEnabled
                    ? this.createMenuItem(this.chartTranslation.translate('chartEdit'), 'chartsMenuEdit', showMenu)
                    : null;
            case 'chartAdvancedSettings':
                return this.createMenuItem(
                    this.chartTranslation.translate('chartAdvancedSettings'),
                    'chartsMenuAdvancedSettings',
                    () => this.chartMenuSvc.openAdvancedSettings(chartMenuContext, eventSource)
                );
            case 'chartUnlink':
                return chartMenuContext.chartController.isChartLinked()
                    ? this.createMenuItem(this.chartTranslation.translate('chartUnlink'), 'unlinked', () =>
                          this.chartMenuSvc.toggleLinked(chartMenuContext)
                      )
                    : null;
            case 'chartLink':
                return !chartMenuContext.chartController.isChartLinked()
                    ? this.createMenuItem(this.chartTranslation.translate('chartLink'), 'linked', () =>
                          this.chartMenuSvc.toggleLinked(chartMenuContext)
                      )
                    : null;
            case 'chartDownload':
                return this.createMenuItem(this.chartTranslation.translate('chartDownload'), 'chartsDownload', () =>
                    this.chartMenuSvc.downloadChart(chartMenuContext)
                );
        }
        return null;
    }

    private createMenuItem(name: string, iconName: IconName, action: () => void): MenuItemDef {
        return {
            name,
            icon: _createIconNoSpan(iconName, this.beans, null),
            action,
        };
    }

    public override destroy(): void {
        this.destroyBean(this.activeChartMenuList);
        super.destroy();
    }
}

class ChartMenuList extends Component {
    private readonly eChartsMenu: HTMLElement = RefPlaceholder;

    private hidePopupFunc: () => void;
    private mainMenuList: AgMenuList;

    constructor(private readonly menuItems: MenuItemDef[]) {
        super(/* html */ `
            <div data-ref="eChartsMenu" role="presentation" class="ag-menu ag-chart-menu-popup"></div>
        `);
    }

    public postConstruct(): void {
        this.mainMenuList = this.createManagedBean(new AgMenuList(0));
        this.mainMenuList.addMenuItems(this.menuItems);
        this.mainMenuList.addEventListener('closeMenu', this.onHidePopup.bind(this));
        this.eChartsMenu.appendChild(this.mainMenuList.getGui());
    }

    private onHidePopup(): void {
        this.hidePopupFunc?.();
    }

    public afterGuiAttached({ hidePopup }: IAfterGuiAttachedParams): void {
        if (hidePopup) {
            this.hidePopupFunc = hidePopup;
            this.addDestroyFunc(hidePopup);
        }
        _focusInto(this.mainMenuList.getGui());
    }
}
