import type {
    BeanCollection,
    ChartToolPanelMenuOptions,
    ChartToolbarMenuItemOptions,
    Environment,
    IconName,
} from 'ag-grid-community';
import { AgPromise, Component, _warn } from 'ag-grid-community';

import { AgPanel } from '../../../widgets/agPanel';
import type { ChartController } from '../chartController';
import type { ExtraPaddingDirection } from '../chartProxies/chartProxy';
import type { ChartMenuService } from '../services/chartMenuService';
import type { ChartMenuContext } from './chartMenuContext';
import type { ChartMenuListFactory } from './chartMenuList';
import { ChartToolbar } from './chartToolbar';
import { TabbedChartMenu } from './tabbedChartMenu';

type ChartToolbarButtons = {
    [key in ChartToolbarMenuItemOptions]: {
        iconName: IconName;
        callback: (eventSource: HTMLElement) => void;
    };
};

export class ChartMenu extends Component {
    private chartMenuSvc: ChartMenuService;
    private chartMenuListFactory: ChartMenuListFactory;
    private environment: Environment;

    public wireBeans(beans: BeanCollection) {
        this.chartMenuSvc = beans.chartMenuSvc as ChartMenuService;
        this.chartMenuListFactory = beans.chartMenuListFactory as ChartMenuListFactory;
        this.environment = beans.environment;
    }

    private readonly chartController: ChartController;

    private buttons: ChartToolbarButtons = {
        chartLink: { iconName: 'linked', callback: () => this.chartMenuSvc.toggleLinked(this.chartMenuContext) },
        chartUnlink: {
            iconName: 'unlinked',
            callback: () => this.chartMenuSvc.toggleLinked(this.chartMenuContext),
        },
        chartDownload: {
            iconName: 'chartsDownload',
            callback: () => this.chartMenuSvc.downloadChart(this.chartMenuContext),
        },
        chartMenu: { iconName: 'chartsMenu', callback: (eventSource: HTMLElement) => this.showMenuList(eventSource) },
    };

    private panels: ChartToolPanelMenuOptions[] = [];
    private defaultPanel: ChartToolPanelMenuOptions;

    private chartToolbar: ChartToolbar;
    private tabbedMenu: TabbedChartMenu;
    private menuPanel?: AgPanel;
    private menuVisible = false;
    private chartToolbarOptions: ChartToolbarMenuItemOptions[];

    constructor(
        private readonly eChartContainer: HTMLElement,
        private readonly eMenuPanelContainer: HTMLElement,
        private readonly chartMenuContext: ChartMenuContext
    ) {
        super(/* html */ `<div class="ag-chart-menu-wrapper"></div>`);
        this.chartController = chartMenuContext.chartController;
    }

    public postConstruct(): void {
        this.chartToolbar = this.createManagedBean(new ChartToolbar());
        this.getGui().appendChild(this.chartToolbar.getGui());

        this.refreshToolbarAndPanels();

        this.addManagedEventListeners({
            chartCreated: (e) => {
                if (e.chartId === this.chartController.getChartId()) {
                    const showDefaultToolPanel = Boolean(this.gos.get('chartToolPanelsDef')?.defaultToolPanel);
                    if (showDefaultToolPanel) {
                        this.showMenu({ panel: this.defaultPanel, suppressFocus: true });
                    }
                }
            },
        });
        this.addManagedListeners(this.chartController, {
            chartLinkedChanged: this.refreshToolbarAndPanels.bind(this),
        });

        this.refreshMenuClasses();

        this.addManagedListeners(this.chartController, { chartApiUpdate: this.refreshToolbarAndPanels.bind(this) });
    }

    public isVisible(): boolean {
        return this.menuVisible;
    }

    public getExtraPaddingDirections(): ExtraPaddingDirection[] {
        return (['chartMenu', 'chartLink', 'chartUnlink', 'chartDownload'] as const).some((v) =>
            this.chartToolbarOptions.includes(v)
        )
            ? ['top']
            : [];
    }

    private refreshToolbarAndPanels(): void {
        this.initToolbarOptionsAndPanels();
        this.updateToolbar();
    }

    private initToolbarOptionsAndPanels(): void {
        const { panels, defaultPanel } = this.chartMenuSvc.getChartToolPanels(this.chartController);
        this.panels = panels;
        this.defaultPanel = defaultPanel;
        this.chartToolbarOptions = this.chartMenuSvc.getChartToolbarOptions();
    }

    private updateToolbar(): void {
        const buttons = this.chartToolbarOptions.map((buttonName) => {
            const { iconName, callback } = this.buttons[buttonName];
            return {
                buttonName,
                iconName,
                callback,
            };
        });
        this.chartToolbar.updateParams({ buttons });
    }

    private createMenuPanel(defaultTab: number): AgPromise<AgPanel> {
        const menuPanel = (this.menuPanel = this.createBean(
            new AgPanel({
                height: '100%',
                closable: true,
                hideTitleBar: true,
                cssIdentifier: 'chart-menu',
            })
        ));

        menuPanel.setParentComponent(this);
        this.eMenuPanelContainer.appendChild(menuPanel.getGui());

        this.tabbedMenu = this.createBean(new TabbedChartMenu(this.panels, this.chartMenuContext));

        this.addManagedListeners(this.tabbedMenu, {
            closed: () => {
                this.hideMenu();
            },
        });

        this.addManagedListeners(menuPanel, { destroyed: () => this.destroyBean(this.tabbedMenu) });

        return new AgPromise((res: (arg0: any) => void) => {
            window.setTimeout(() => {
                menuPanel.setBodyComponent(this.tabbedMenu);
                this.tabbedMenu.showTab(defaultTab);
                res(menuPanel);
            }, 100);
        });
    }

    private showContainer(eventSource?: HTMLElement, suppressFocus?: boolean) {
        if (!this.menuPanel) {
            return;
        }

        this.menuVisible = true;
        this.refreshMenuClasses();
        this.tabbedMenu.showMenu(eventSource, suppressFocus);
    }

    public showMenu(params?: {
        /**
         * Menu panel to show. If empty, shows the existing menu, or creates the default menu if menu panel has not been created
         */
        panel?: ChartToolPanelMenuOptions;
        eventSource?: HTMLElement;
        suppressFocus?: boolean;
    }): void {
        const { panel, eventSource, suppressFocus } = params ?? {};

        if (this.menuPanel && !panel) {
            this.showContainer(eventSource, suppressFocus);
        } else {
            const menuPanel = panel || this.defaultPanel;
            let tab = this.panels.indexOf(menuPanel);
            if (tab < 0) {
                _warn(143, { panel });
                tab = this.panels.indexOf(this.defaultPanel);
            }

            if (this.menuPanel) {
                this.tabbedMenu.showTab(tab);
                this.showContainer(eventSource, suppressFocus);
            } else {
                this.createMenuPanel(tab).then(() => this.showContainer(eventSource, suppressFocus));
            }
        }
    }

    public hideMenu(): void {
        this.menuVisible = false;
        this.refreshMenuClasses();
    }

    private refreshMenuClasses() {
        this.eChartContainer.classList.toggle('ag-chart-menu-visible', this.menuVisible);
        this.eChartContainer.classList.toggle('ag-chart-menu-hidden', !this.menuVisible);
    }

    private showMenuList(eventSource: HTMLElement): void {
        this.chartMenuListFactory.showMenuList({
            eventSource,
            showMenu: () => this.showMenu({ eventSource }),
            chartMenuContext: this.chartMenuContext,
        });
    }

    public override destroy() {
        super.destroy();

        if (this.menuPanel && this.menuPanel.isAlive()) {
            this.destroyBean(this.menuPanel);
        }

        if (this.tabbedMenu && this.tabbedMenu.isAlive()) {
            this.destroyBean(this.tabbedMenu);
        }
    }
}
