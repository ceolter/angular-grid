import type { AgCharts } from 'ag-charts-community';

import type { _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { sparklineCSS } from './sparkline.css-GENERATED';
import { SparklineCellRenderer } from './sparklineCellRenderer';

type SparklineChartParams = {
    AgCharts: typeof AgCharts;
    setupCharts: () => void;
};

type SparklineChartsModuleType = { with: (params: SparklineChartParams) => _ModuleWithoutApi } & _ModuleWithoutApi;

const baseSparklinesModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SparklinesModule'),
    dependsOn: [EnterpriseCoreModule],
    css: [sparklineCSS],
    validate: () => {
        return {
            isValid: false,
            message: 'AG Grid: SparklinesModule must be initialised with the AG Charts Sparklines library',
        };
    },
};

/**
 * @feature Sparklines
 */
export const SparklinesModule: SparklineChartsModuleType = {
    with: (params) => {
        params.setupCharts();
        return {
            ...baseSparklinesModule,
            userComponents: {
                agSparklineCellRenderer: {
                    classImp: SparklineCellRenderer,
                    /** Default params for provided components */
                    params: { __createSparkline: params.AgCharts.__createSparkline.bind(params.AgCharts) },
                },
            },
            validate: () => {
                return { isValid: true };
            },
        };
    },
    ...baseSparklinesModule,
};
