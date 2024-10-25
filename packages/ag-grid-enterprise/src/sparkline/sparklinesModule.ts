import type { _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { sparklineCSS } from './sparkline.css-GENERATED';
import { SparklineCellRenderer } from './sparklineCellRenderer';
import { SparklineTooltipSingleton } from './tooltip/sparklineTooltipSingleton';

export const SparklinesModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SparklinesModule'),
    beans: [SparklineTooltipSingleton],
    userComponents: { agSparklineCellRenderer: SparklineCellRenderer },
    dependsOn: [EnterpriseCoreModule],
    css: [sparklineCSS],
};
