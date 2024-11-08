import type { IntegratedSparklineModule } from 'ag-charts-types';

import type { _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { sparklineCSS } from './sparkline.css-GENERATED';
import { SparklineCellRenderer } from './sparklineCellRenderer';

type SparklineChartsModuleType = { with: (params: IntegratedSparklineModule) => _ModuleWithoutApi } & _ModuleWithoutApi;

const baseSparklinesModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SparklinesModule'),
    dependsOn: [EnterpriseCoreModule],
    css: [sparklineCSS],
    validate: () => {
        return {
            isValid: false,
            message: `AG Grid: SparklinesModule must be initialised with the AG Charts (ag-charts-community) sparkline module i.e 'SparklinesModule.with(SparklineModule)'`,
        };
    },
};

/**
 * @feature Sparklines
 */
export const SparklinesModule: SparklineChartsModuleType = {
    with: (params) => {
        params.setup();

        return {
            ...baseSparklinesModule,
            userComponents: {
                agSparklineCellRenderer: {
                    classImp: SparklineCellRenderer,
                    /** Default params for provided components */
                    params: { createSparkline: params.create },
                },
            },
            validate: () => {
                return { isValid: true };
            },
        };
    },
    ...baseSparklinesModule,
};
