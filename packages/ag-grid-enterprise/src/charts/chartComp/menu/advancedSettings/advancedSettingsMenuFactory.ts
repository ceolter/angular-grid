import type { BeanCollection, FocusService, NamedBean } from 'ag-grid-community';
import { BeanStub, TabGuardComp } from 'ag-grid-community';

import { AgDialog } from '../../../../widgets/agDialog';
import type { ChartTranslationService } from '../../services/chartTranslationService';
import type { ChartMenuContext } from '../chartMenuContext';
import { AdvancedSettingsPanel } from './advancedSettingsPanel';

export class AdvancedSettingsMenuFactory extends BeanStub implements NamedBean {
    beanName = 'advancedSettingsMenuFactory' as const;

    private focusSvc: FocusService;
    private chartTranslationService: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.focusSvc = beans.focusSvc;
        this.chartTranslationService = beans.chartTranslationService as ChartTranslationService;
    }

    private activeMenu?: AdvancedSettingsMenu;
    private activeDialog?: AgDialog;

    public showMenu(chartMenuContext: ChartMenuContext, eventSource?: HTMLElement): void {
        this.hideMenu();

        const menu = this.createBean(new AdvancedSettingsMenu(chartMenuContext));

        this.activeDialog = this.createBean(
            new AgDialog({
                title: this.chartTranslationService.translate('advancedSettings'),
                component: menu,
                width: 300,
                height: 400,
                resizable: true,
                movable: true,
                centered: true,
                closable: true,
                afterGuiAttached: () => {
                    this.focusSvc.findFocusableElements(menu.getGui())[0]?.focus();
                },
                closedCallback: () => {
                    this.activeMenu = this.destroyBean(this.activeMenu);
                    this.activeDialog = undefined;
                    eventSource?.focus({ preventScroll: true });
                },
            })
        );

        this.activeMenu = menu;
    }

    public hideMenu(): void {
        if (this.activeDialog) {
            this.destroyBean(this.activeDialog);
        }
    }

    public override destroy(): void {
        this.activeMenu = this.destroyBean(this.activeMenu);
        this.activeDialog = this.destroyBean(this.activeDialog);
        super.destroy();
    }
}

class AdvancedSettingsMenu extends TabGuardComp {
    private focusSvc: FocusService;

    public wireBeans(beans: BeanCollection): void {
        this.focusSvc = beans.focusSvc;
    }

    private advancedSettingsPanel: AdvancedSettingsPanel;

    constructor(private readonly chartMenuContext: ChartMenuContext) {
        super(/* html */ `<div class="ag-chart-advanced-settings"></div>`);
    }

    public postConstruct(): void {
        this.advancedSettingsPanel = this.createManagedBean(new AdvancedSettingsPanel(this.chartMenuContext));
        this.getGui().appendChild(this.advancedSettingsPanel.getGui());
        this.initialiseTabGuard({
            onTabKeyDown: this.onTabKeyDown.bind(this),
            focusTrapActive: true,
        });
    }

    protected onTabKeyDown(e: KeyboardEvent) {
        if (e.defaultPrevented) {
            return;
        }

        e.preventDefault();

        const backwards = e.shiftKey;
        const panelGui = this.advancedSettingsPanel.getGui();
        const nextEl = this.focusSvc.findNextFocusableElement(panelGui, false, backwards);

        if (nextEl) {
            nextEl.focus();
        } else {
            const focusableElements = this.focusSvc.findFocusableElements(panelGui);
            if (focusableElements.length) {
                focusableElements[backwards ? focusableElements.length - 1 : 0].focus();
            }
        }
    }
}
