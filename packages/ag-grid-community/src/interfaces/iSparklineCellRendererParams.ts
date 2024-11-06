import type { AgSparklineOptions } from 'ag-charts-types';

import type { ICellRendererParams } from '../rendering/cellRenderers/iCellRenderer';

export interface ISparklineCellRendererParams<TData = any, TContext = any>
    extends ICellRendererParams<TData, TContext> {
    sparklineOptions?: AgSparklineOptions;
}
