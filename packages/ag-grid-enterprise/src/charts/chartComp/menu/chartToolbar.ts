import type { BeanCollection, ChartToolbarMenuItemOptions } from 'ag-grid-community';
import { Component, RefPlaceholder, _clearElement, _createIconNoSpan, _getDocument } from 'ag-grid-community';

import type { ChartTranslationKey, ChartTranslationService } from '../services/chartTranslationService';

interface ChartToolbarButton {
    buttonName: ChartToolbarMenuItemOptions;
    iconName: string;
    callback: (eventSource: HTMLElement) => void;
}

export class ChartToolbar extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }

    private readonly eMenu: HTMLButtonElement = RefPlaceholder;

    private buttonListenersDestroyFuncs: ((() => null) | undefined)[] = [];

    constructor() {
        super(/* html */ `<div class="ag-chart-menu" data-ref="eMenu"></div>`);
    }

    public updateParams(params: { buttons: ChartToolbarButton[] }): void {
        const { buttons } = params;
        this.createButtons(buttons);
    }

    private createButtons(buttons: ChartToolbarButton[]): void {
        this.buttonListenersDestroyFuncs.forEach((func) => func?.());
        this.buttonListenersDestroyFuncs = [];

        const menuEl = this.eMenu;
        _clearElement(menuEl);

        buttons.forEach((buttonConfig) => {
            const { buttonName, iconName, callback } = buttonConfig;
            const buttonEl = this.createButton(iconName);

            const tooltipTitle = this.chartTranslation.translate(
                (buttonName + 'ToolbarTooltip') as ChartTranslationKey
            );
            if (tooltipTitle && buttonEl instanceof HTMLElement) {
                buttonEl.title = tooltipTitle;
            }

            this.buttonListenersDestroyFuncs.push(
                ...this.addManagedElementListeners(buttonEl, {
                    click: (event: MouseEvent) => callback(event.currentTarget as HTMLElement),
                })
            );

            menuEl.appendChild(buttonEl);
        });
    }

    private createButton(iconName: string): Element {
        const buttonEl = _createIconNoSpan(iconName, this.gos, undefined, true)!;
        buttonEl.classList.add('ag-chart-menu-icon');

        const wrapperEl = _getDocument(this.gos).createElement('button');
        wrapperEl.appendChild(buttonEl);
        wrapperEl.classList.add('ag-chart-menu-toolbar-button');
        return wrapperEl;
    }

    public override destroy(): void {
        this.buttonListenersDestroyFuncs = [];
        super.destroy();
    }
}
