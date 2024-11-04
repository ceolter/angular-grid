import type { AgCartesianAxisType, AgChartInstance, AgPolarAxisOptions, _Scene } from 'ag-charts-community';

export function deproxy(chartOrProxy: AgChartInstance): AgChartActual {
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
    title?: _Scene.Caption;
    width: number;
    height: number;
    series: {
        type: string;
        setLegendState(state: boolean[]): void;
        properties: {
            [key: string]: any;
            toJson(): any;
        };
    }[];
    axes?: {
        type: AgCartesianAxisType | AgPolarAxisOptions['type'];
        direction: 'x' | 'y';
    }[];
    getCanvasDataURL(type?: string): string;
    waitForUpdate(): Promise<void>;
}

export type AgChartAxis = NonNullable<AgChartActual['axes']>[number];
export type AgChartAxisType = AgChartAxis['type'];
