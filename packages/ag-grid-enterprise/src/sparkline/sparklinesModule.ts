import type { IntegratedModule } from 'ag-charts-types';

import { _errMsg } from 'ag-grid-community';
import type { _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { sparklineCSS } from './sparkline.css-GENERATED';
import { SparklineCellRenderer } from './sparklineCellRenderer';

type SparklineChartsModuleType = { with: (params: IntegratedModule) => _ModuleWithoutApi } & _ModuleWithoutApi;

const baseSparklinesModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('Sparklines'),
    dependsOn: [EnterpriseCoreModule],
    css: [sparklineCSS],
    validate: () => {
        return {
            isValid: false,
            message: _errMsg(258),
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
                    params: { createSparkline: params.createSparkline },
                },
            },
            validate: () => {
                return { isValid: true };
            },
        };
    },
    ...baseSparklinesModule,
};
