import type { BeanCollection, ChartToolPanelMenuOptions } from 'ag-grid-community';
import { AgPromise, Component } from 'ag-grid-community';

import type { TabbedItem } from '../../../widgets/iTabbedLayout';
import { TabbedLayout } from '../../../widgets/tabbedLayout';
import type { ChartTranslationKey, ChartTranslationService } from '../services/chartTranslationService';
import type { ChartMenuContext } from './chartMenuContext';
import { ChartDataPanel } from './data/chartDataPanel';
import { FormatPanel } from './format/formatPanel';
import { ChartSettingsPanel } from './settings/chartSettingsPanel';

const TAB_DATA = 'data';
const TAB_FORMAT = 'format';

export type TabbedChartMenuEvent = 'closed';
export class TabbedChartMenu extends Component<TabbedChartMenuEvent> {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }

    private tabbedLayout: TabbedLayout;
    private tabs: TabbedItem[] = [];
    private eventSource?: HTMLElement;

    constructor(
        private readonly panels: ChartToolPanelMenuOptions[],
        private readonly chartMenuContext: ChartMenuContext
    ) {
        super();
    }

    public postConstruct(): void {
        this.panels.forEach((panel) => {
            const panelType = panel.replace('chart', '').toLowerCase() as 'settings' | 'data' | 'format';
            const panelComp = this.createPanel(panelType);
            const tabItem = this.createTab(panel, panelType, panelComp);

            this.tabs.push(tabItem);
            this.addDestroyFunc(() => this.destroyBean(panelComp));
        });

        this.tabbedLayout = new TabbedLayout({
            items: this.tabs,
            cssClass: 'ag-chart-tabbed-menu',
            keepScrollPosition: true,
            suppressFocusBodyOnOpen: true,
            suppressTrapFocus: true,
            enableCloseButton: true,
            closeButtonAriaLabel: this.chartTranslation.translate('ariaChartMenuClose'),
            onCloseClicked: () => {
                this.eventSource?.focus({ preventScroll: true });
                this.dispatchLocalEvent({ type: 'closed' });
            },
        });
        this.createBean(this.tabbedLayout);
    }

    private createTab(name: ChartToolPanelMenuOptions, title: ChartTranslationKey, panelComp: Component): TabbedItem {
        const eWrapperDiv = document.createElement('div');
        eWrapperDiv.classList.add('ag-chart-tab', `ag-chart-${title}`);

        this.createBean(panelComp);

        eWrapperDiv.appendChild(panelComp.getGui());

        const titleEl = document.createElement('div');
        const translatedTitle = this.chartTranslation.translate(title);
        // eslint-disable-next-line no-restricted-properties -- Could swap to textContent, but could be a breaking change
        titleEl.innerText = translatedTitle;

        return {
            title: titleEl,
            titleLabel: translatedTitle,
            bodyPromise: AgPromise.resolve(eWrapperDiv),
            getScrollableContainer: () => {
                const scrollableContainer = eWrapperDiv.querySelector('.ag-scrollable-container');
                return (scrollableContainer || eWrapperDiv) as HTMLElement;
            },
            name,
        };
    }

    public showTab(tab: number) {
        const tabItem = this.tabs[tab];
        this.tabbedLayout.showItem(tabItem);
    }

    public override getGui(): HTMLElement {
        return this.tabbedLayout && this.tabbedLayout.getGui();
    }

    public showMenu(eventSource?: HTMLElement, suppressFocus?: boolean): void {
        this.eventSource = eventSource;
        if (!suppressFocus) {
            this.tabbedLayout?.focusHeader(true);
        }
    }

    public override destroy(): void {
        if (this.parentComponent && this.parentComponent.isAlive()) {
            this.destroyBean(this.parentComponent);
        }
        super.destroy();
    }

    private createPanel(panelType: string): Component {
        switch (panelType) {
            case TAB_DATA:
                return new ChartDataPanel(this.chartMenuContext);
            case TAB_FORMAT:
                return new FormatPanel(this.chartMenuContext);
            default:
                return new ChartSettingsPanel(this.chartMenuContext.chartController);
        }
    }
}
