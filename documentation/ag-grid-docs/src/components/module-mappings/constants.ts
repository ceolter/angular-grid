interface Option {
    name: string;
    moduleName: string;
    isEnterprise?: boolean;
}
export type ChartModuleName = 'Sparklines' | 'Integrated Charts';
export type ChartOptions = Record<ChartModuleName, boolean>;

export type BundleOptionValue = '' | 'AllCommunityModule' | 'AllEnterpriseModule';

export const ALL_COMMUNITY_MODULE = 'AllCommunityModule';
export const ALL_ENTERPRISE_MODULE = 'AllEnterpriseModule';

export const ROW_MODEL_OPTIONS: Option[] = [
    { name: 'Client-Side', moduleName: 'ClientSideRowModelModule' },
    { name: 'Server-Side', moduleName: 'ServerSideRowModelModule', isEnterprise: true },
    { name: 'Infinite', moduleName: 'InfiniteRowModelModule' },
    { name: 'Viewport', moduleName: 'ViewportRowModelModule', isEnterprise: true },
];

export const BUNDLE_OPTIONS: Option[] = [
    { name: 'None', moduleName: '' },
    { name: 'All Community Features', moduleName: ALL_COMMUNITY_MODULE },
    { name: 'All Enterprise Features', moduleName: ALL_ENTERPRISE_MODULE, isEnterprise: true },
];

export const SPARKLINES_MODULE: Option = {
    name: 'Sparklines',
    moduleName: 'SparklinesModule',
    isEnterprise: true,
};
export const INTEGRATED_CHARTS_MODULE: Option = {
    name: 'Integrated Charts',
    moduleName: 'IntegratedChartsModule',
    isEnterprise: true,
};
export const CHART_OPTIONS: Option[] = [SPARKLINES_MODULE, INTEGRATED_CHARTS_MODULE];
export const DEFAULT_CHART_OPTIONS = Object.fromEntries(
    CHART_OPTIONS.map(({ name }) => {
        return [name, false];
    })
) as ChartOptions;
