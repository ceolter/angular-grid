import type { LicenseManager } from '@ag-grid-enterprise/core';

export interface LicensedProducts {
    grid: boolean;
    charts: boolean;
}

export type LicenseDetails = ReturnType<typeof LicenseManager.getLicenseDetails>;
