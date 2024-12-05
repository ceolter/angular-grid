import type { LicenseManager } from 'ag-grid-enterprise';

export interface LicensedProducts {
    grid: boolean;
    charts: boolean;
}

export type LicenseDetails = ReturnType<typeof LicenseManager.getLicenseDetails>;
