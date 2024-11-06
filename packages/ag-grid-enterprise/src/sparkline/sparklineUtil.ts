import type { AgSparklineOptions } from 'ag-charts-types';

import type { ISparklineCellRendererParams } from 'ag-grid-community';

export const sizeValid = (width: number, height: number) => width > 0 && height > 0;

export const needsResize = (width: number, height: number, options: AgSparklineOptions) =>
    options.width !== width || options.height !== height;

export const hasData = (params?: ISparklineCellRendererParams) => typeof params?.value?.[0] === 'number';

// XXX required until AgSparklines support different data shapes
export const transformData = (options: AgSparklineOptions, params?: ISparklineCellRendererParams) => {
    if (params && hasData(params)) {
        options.type ??= 'line';
        options.xKey = 'x';
        options.yKey = 'y';
        options.data = params.value.map((y: number, x: number) => ({ [options.xKey]: x, [options.yKey]: y }));
    }
};
