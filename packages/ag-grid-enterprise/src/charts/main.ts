import { AgCharts, time } from 'ag-charts-community';
import { setupCommunityModules } from 'ag-charts-community/modules';

export { GridChartsModule } from './gridChartsModule';

export * from 'ag-charts-types';

declare const process: any;

let agChartsDynamic: any;
if (process.env.NODE_ENV !== 'production') {
    agChartsDynamic = (globalThis as any).agCharts;
}

if (agChartsDynamic != null) {
    agChartsDynamic.setupCommunityModules();
} else {
    setupCommunityModules();
}

export const agCharts = agChartsDynamic ?? { time, AgCharts };
