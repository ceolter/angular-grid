import { AgCharts } from 'ag-charts-community/modules';
import { setupEnterpriseModules } from 'ag-charts-enterprise/modules';

import type { ILicenseManager } from '../license/shared/licenseManager';
import { LicenseManager } from '../license/shared/licenseManager';

declare const process: any;

let agChartsDynamic: any;
if (process.env.NODE_ENV !== 'production') {
    agChartsDynamic = (globalThis as any).agCharts;
}

if (agChartsDynamic != null) {
    agChartsDynamic.setupEnterpriseModules?.();
    agChartsDynamic.AgCharts.setGridContext(true);

    LicenseManager.setChartsLicenseManager(agChartsDynamic.AgCharts as ILicenseManager);
} else {
    setupEnterpriseModules();
    AgCharts.setGridContext(true);

    LicenseManager.setChartsLicenseManager(AgCharts as ILicenseManager);
}

export * from '../charts/main';
