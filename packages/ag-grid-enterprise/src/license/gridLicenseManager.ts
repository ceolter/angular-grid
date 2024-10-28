import type { ComponentSelector, IWatermark, NamedBean } from 'ag-grid-community';
import { BeanStub, _getDocument } from 'ag-grid-community';

import type { ILicenseManager } from './shared/licenseManager';
import { LicenseManager } from './shared/licenseManager';
import { AgWatermarkSelector } from './watermark';

export class GridLicenseManager extends BeanStub implements NamedBean, IWatermark {
    beanName = 'licenseManager' as const;

    private licenseManager: LicenseManager;

    public postConstruct(): void {
        this.validateLicense();
    }

    public validateLicense(): void {
        this.licenseManager = new LicenseManager(_getDocument(this.beans));
        this.licenseManager.validateLicense();
    }

    static getLicenseDetails(licenseKey: string) {
        return new LicenseManager(null as any).getLicenseDetails(licenseKey);
    }

    public getWatermarkSelector(): ComponentSelector {
        return AgWatermarkSelector;
    }

    public isDisplayWatermark(): boolean {
        return this.licenseManager.isDisplayWatermark();
    }

    public getWatermarkMessage(): string {
        return this.licenseManager.getWatermarkMessage();
    }

    static setLicenseKey(licenseKey: string): void {
        LicenseManager.setLicenseKey(licenseKey);
    }

    static setChartsLicenseManager(chartsLicenseManager: ILicenseManager) {
        LicenseManager.setChartsLicenseManager(chartsLicenseManager);
    }
}
