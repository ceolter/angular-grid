import type { BeanCollection, ComponentSelector } from 'ag-grid-community';
import { Component, RefPlaceholder } from 'ag-grid-community';

import type { GridLicenseManager as LicenseManager } from './gridLicenseManager';
import { watermarkCSS } from './watermark.css-GENERATED';

export class AgWatermark extends Component {
    licenseManager: LicenseManager;

    public wireBeans(beans: BeanCollection): void {
        this.licenseManager = beans.licenseManager as LicenseManager;
    }

    private readonly eLicenseTextRef: HTMLElement = RefPlaceholder;

    constructor() {
        super(
            /* html*/
            `<div class="ag-watermark">
                <div data-ref="eLicenseTextRef" class="ag-watermark-text"></div>
            </div>`
        );
        this.registerCSS(watermarkCSS);
    }

    public postConstruct(): void {
        const show = this.shouldDisplayWatermark();
        this.setDisplayed(show);

        if (show) {
            this.eLicenseTextRef.innerText = this.licenseManager.getWatermarkMessage();

            window.setTimeout(() => this.addCssClass('ag-opacity-zero'), 0);
            window.setTimeout(() => this.setDisplayed(false), 5000);
        }
    }

    private shouldDisplayWatermark(): boolean {
        return this.licenseManager.isDisplayWatermark();
    }
}

export const AgWatermarkSelector: ComponentSelector = {
    selector: 'AG-WATERMARK',
    component: AgWatermark,
};
