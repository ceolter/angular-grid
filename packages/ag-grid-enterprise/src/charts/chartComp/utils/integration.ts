import type {
    AgCartesianAxisType,
    AgChartCaptionOptions,
    AgChartInstance,
    AgChartInstanceOptions,
    AgPolarAxisOptions,
} from 'ag-charts-types';

export function deproxy(chartOrProxy: AgChartInstance<AgChartInstanceOptions>): AgChartActual {
    if ((chartOrProxy as any).chart != null) {
        return (chartOrProxy as any).chart;
    }
    return chartOrProxy as AgChartActual;
}

// Extensions to the public ag-charts-community API that Integrated Charts currently depends on for
// correct operation. Over time we aim to eliminate these and only use the public API.
//
// AVOID ADDING MORE DEPENDENCIES ON THESE PRIVATE APIS.

export interface AgChartActual extends AgChartInstance {
    title?: AgChartCaptionOptions;
    width: number;
    height: number;
    series: {
        type: string;
        toggleSeriesItem(itemId: string, enabled: boolean): void;
        properties: {
            [key: string]: any;
            toJson(): any;
        };
    }[];
    axes?: {
        type: AgCartesianAxisType | AgPolarAxisOptions['type'];
        direction: 'x' | 'y';
    }[];
    canvasElement: HTMLCanvasElement;
    getCanvasDataURL(type?: string): string;
    addEventListener(type: 'click', cb: (even: any) => void): void;
    waitForUpdate(): Promise<void>;
}

export type AgChartAxis = NonNullable<AgChartActual['axes']>[number];
export type AgChartAxisType = AgChartAxis['type'];
