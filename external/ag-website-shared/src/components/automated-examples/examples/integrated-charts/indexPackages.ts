/**
 * Automated Integrated Charts demo
 */
import type { AutomatedExample } from '../../types.d';
import { createAutomatedIntegratedChartsWithCreateGrid } from './createAutomatedIntegratedChartsWithCreateGrid';
import type { CreateAutomatedIntegratedChartsParams } from './createAutomatedIntegratedChartsWithCreateGrid';

/**
 * Create automated integrated charts example using packages
 *
 */
export function createAutomatedIntegratedCharts(params: CreateAutomatedIntegratedChartsParams): AutomatedExample {
    return createAutomatedIntegratedChartsWithCreateGrid({
        createGrid: globalThis.agGrid.createGrid,
        ...params,
    });
}
