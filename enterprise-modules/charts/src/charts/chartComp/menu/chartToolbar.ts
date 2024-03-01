import {
    Autowired,
    ChartMenuOptions,
    Component,
    RefSelector,
    _
} from "@ag-grid-community/core";
import { ChartTranslationKey, ChartTranslationService } from "../services/chartTranslationService";

interface ChartToolbarButton {
    buttonName: ChartMenuOptions;
    iconName: string;
    callback: (eventSource: HTMLElement) => void;
}

export class ChartToolbar extends Component {
    @Autowired('chartTranslationService') private chartTranslationService: ChartTranslationService;
    @RefSelector("eMenu") private eMenu: HTMLButtonElement;

    private buttonListenersDestroyFuncs: ((() => null) | undefined)[] = [];

    constructor() {
        super(/* html */`<div class="ag-chart-menu" ref="eMenu"></div>`);
    }

    public updateParams(params: {
        buttons: ChartToolbarButton[]
    }): void {
        const { buttons } = params;
        this.createButtons(buttons);
    }

    private createButtons(buttons: ChartToolbarButton[]): void {
        this.buttonListenersDestroyFuncs.forEach(func => func?.());
        this.buttonListenersDestroyFuncs = [];

        const menuEl = this.eMenu;
        _.clearElement(menuEl);

        buttons.forEach(buttonConfig => {
            const { buttonName, iconName, callback } = buttonConfig;
            const buttonEl = _.createIconNoSpan(
                iconName,
                this.gridOptionsService,
                undefined,
                true
            )!;
            buttonEl.classList.add('ag-chart-menu-icon');

            const tooltipTitle = this.chartTranslationService.translate(buttonName + 'ToolbarTooltip' as ChartTranslationKey);
            if (tooltipTitle && buttonEl instanceof HTMLElement) {
                buttonEl.title = tooltipTitle;
            }

            this.buttonListenersDestroyFuncs.push(
                this.addManagedListener(buttonEl, 'click', (event: MouseEvent) => callback(event.target as HTMLElement))
            );

            menuEl.appendChild(buttonEl);
        });
    }

    protected destroy(): void {
        this.buttonListenersDestroyFuncs = [];
        super.destroy();
    }
}