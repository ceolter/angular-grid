import type { IntegratedModule } from 'ag-charts-types';

import { _preInitErrMsg } from 'ag-grid-community';
import type { _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { VERSION } from '../version';
import { sparklineCSS } from './sparkline.css-GENERATED';
import { SparklineCellRenderer } from './sparklineCellRenderer';

type SparklineChartsModuleType = { with: (params: IntegratedModule) => _ModuleWithoutApi } & _ModuleWithoutApi;
const moduleName = 'Sparklines';
/**
 * @feature Sparklines
 * Requires the AG Charts library to be provided to this module via the `with` method.
 * The AG Charts module can be imported from either `ag-charts-community` or `ag-charts-enterprise`.
 * @example
 * import { AgChartsCommunityModule } from 'ag-charts-community';
 * import { ModuleRegistry } from 'ag-grid-community';
 * import { SparklinesModule } from 'ag-grid-enterprise';
 *
 * ModuleRegistry.registerModules([ SparklinesModule.with(AgChartsCommunityModule) ]);
 */
export const SparklinesModule: SparklineChartsModuleType = {
    moduleName,
    version: VERSION,
    dependsOn: [EnterpriseCoreModule],
    validate: () => {
        return {
            isValid: false,
            message: _preInitErrMsg(258),
        };
    },
    with: (params) => {
        params.setup();

        return {
            moduleName,
            version: VERSION,
            dependsOn: [EnterpriseCoreModule],
            css: [sparklineCSS],
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
};
