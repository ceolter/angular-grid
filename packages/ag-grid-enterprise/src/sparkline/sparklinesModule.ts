import type { _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { sparklineCSS } from './sparkline.css-GENERATED';
import { SparklineCellRenderer } from './sparklineCellRenderer';

/**
 * @feature Sparklines
 */
export const SparklinesModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SparklinesModule'),
    userComponents: { agSparklineCellRenderer: SparklineCellRenderer },
    dependsOn: [EnterpriseCoreModule],
    css: [sparklineCSS],
};
