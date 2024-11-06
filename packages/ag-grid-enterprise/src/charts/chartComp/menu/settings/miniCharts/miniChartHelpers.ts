import type { _Scene } from 'ag-charts-community';

import { _last } from 'ag-grid-community';

import type { AgChartsContext } from '../../../../gridChartsModule';
import type { CommandSegment } from './miniChartApi';

export interface CreateColumnRectsParams {
    agChartsContext: AgChartsContext;
    stacked: boolean;
    root: _Scene.Group;
    data: any;
    size: number;
    padding: number;
    xScaleDomain: number[];
    yScaleDomain: number[];
    xScalePadding: number;
}

export function createColumnRects(params: CreateColumnRectsParams) {
    const {
        stacked,
        size,
        padding,
        xScalePadding,
        xScaleDomain,
        yScaleDomain,
        agChartsContext: { _Scene },
    } = params;

    const xScale = new _Scene.BandScale<number>();
    xScale.domain = xScaleDomain;
    xScale.range = [padding, size - padding];
    xScale.paddingInner = xScalePadding;
    xScale.paddingOuter = xScalePadding;

    const yScale = new _Scene.LinearScale();
    yScale.domain = yScaleDomain;
    yScale.range = [size - padding, padding];

    const createBars = (series: number[], xScale: _Scene.BandScale<number>, yScale: _Scene.LinearScale) => {
        return series.map((datum: number, i: number) => {
            const top = yScale.convert(datum);
            const rect = new _Scene.Rect();
            rect.x = xScale.convert(i);
            rect.y = top;
            rect.width = xScale.bandwidth;
            rect.height = yScale.convert(0) - top;
            rect.strokeWidth = 0;
            rect.crisp = true;

            return rect;
        });
    };

    if (stacked) {
        return params.data.map((d: number[]) => createBars(d, xScale, yScale));
    }

    return createBars(params.data, xScale, yScale);
}

export function prepareLinearScene(agChartsContext: AgChartsContext, data: number[][], size: number, padding: number) {
    const xDomain = [0, data[0].length - 1];
    const yDomain = data.reduce(
        (acc, curr) => {
            curr.forEach((datum) => {
                if (datum < acc[0]) {
                    acc[0] = datum;
                }

                if (datum > acc[1]) {
                    acc[1] = datum;
                }
            });

            return acc;
        },
        [Infinity, -Infinity]
    );

    yDomain[0]--;
    yDomain[yDomain.length - 1]++;

    const xScale = new agChartsContext._Scene.LinearScale();
    xScale.domain = xDomain;
    xScale.range = [padding, size - padding];

    const yScale = new agChartsContext._Scene.LinearScale();
    yScale.domain = yDomain;
    yScale.range = [size - padding, padding];

    return { xScale, yScale };
}

export function createPathCommands(
    data: number[][],
    xScale: _Scene.LinearScale,
    yScale: _Scene.LinearScale
): CommandSegment[][] {
    return data.map((series) =>
        series.map((datum: number, i: number) => [
            i > 0 ? 'lineTo' : 'moveTo',
            xScale.convert(i),
            yScale.convert(datum),
        ])
    );
}

export function createPath(agChartsContext: AgChartsContext, commands: CommandSegment[]): _Scene.Path {
    const path = new agChartsContext._Scene.Path();
    commands.forEach(([command, x, y]: CommandSegment) => path.path[command](x, y));
    return path;
}

export function createAreaPathCommands(
    commands: CommandSegment[][],
    yScale: _Scene.LinearScale,
    stacked: boolean
): CommandSegment[][] {
    return commands.map((pathCommands: CommandSegment[], index, all) => {
        const closingPath = stacked
            ? closePathViaPreviousSeries(all, index, yScale)
            : closePathViaOrigin(pathCommands, yScale);

        // reverse path to maintain CW winding order
        const closingPathCommands: CommandSegment[] = [...closingPath]
            .reverse()
            .map(([_, x, y]: CommandSegment) => ['lineTo', x, y]);

        const first: CommandSegment = pathCommands[0];
        const last = _last(closingPathCommands);

        // close the path if needed
        if (first[1] !== last[1] || first[2] !== last[2]) {
            closingPathCommands.push(['lineTo', first[1], first[2]]);
        }

        return [...pathCommands, ...closingPathCommands] as CommandSegment[];
    });
}

export function closePathViaPreviousSeries(all: CommandSegment[][], index: number, yScale: _Scene.LinearScale) {
    if (index === 0) {
        return closePathViaOrigin(all[index], yScale);
    }
    return [...all[index - 1]];
}

export function closePathViaOrigin(pathCommands: CommandSegment[], yScale: _Scene.LinearScale) {
    return pathCommands.map(([c, x]) => [c, x, yScale.convert(0)]);
}

export function createLinePaths(
    agChartsContext: AgChartsContext,
    root: _Scene.Group,
    data: number[][],
    size: number,
    padding: number
): _Scene.Path[] {
    const { xScale, yScale } = prepareLinearScene(agChartsContext, data, size, padding);

    const pathCommands = createPathCommands(data, xScale, yScale);

    const paths: _Scene.Path[] = pathCommands.map((commands) => {
        const path = createPath(agChartsContext, commands);
        path.strokeWidth = 3;
        path.lineCap = 'round';
        path.fill = undefined;
        return path;
    });

    const pathsGroup = new agChartsContext._Scene.Group();
    pathsGroup.setClipRect(new agChartsContext._Scene.BBox(padding, padding, size - padding * 2, size - padding * 2));
    pathsGroup.append(paths);
    root.append(pathsGroup);

    return paths;
}

export function createAreaPaths(
    agChartsContext: AgChartsContext,
    root: _Scene.Group,
    data: number[][],
    size: number,
    padding: number,
    stacked = false
): _Scene.Path[] {
    const { xScale, yScale } = prepareLinearScene(agChartsContext, data, size, padding);

    const pathCommands = createAreaPathCommands(createPathCommands(data, xScale, yScale), yScale, stacked);

    const areasGroup = new agChartsContext._Scene.Group();
    areasGroup.setClipRect(new agChartsContext._Scene.BBox(padding, padding, size - padding * 2, size - padding * 2));

    const paths: _Scene.Path[] = pathCommands.map((commands) => createPath(agChartsContext, commands));
    areasGroup.append(paths);
    root.append(areasGroup);

    return paths;
}

export function stackData(data: number[][]): number[][] {
    return data.map((stack, sindex, array) =>
        stack.map((_y, i) => array.slice(0, sindex + 1).reduce((p, c) => p + c[i], 0))
    );
}

export function normalizeStackData(data: number[][]): number[][] {
    const colSum = data.map((_, index) => data.reduce((acc, cur) => Math.max(acc, cur[index]), 0));
    return data.map((stack) => stack.map((y, index) => (y / colSum[index]) * 19));
}

export function createPolarPaths(
    agChartsContext: AgChartsContext,
    root: _Scene.Group,
    data: number[][],
    size: number,
    radius: number,
    innerRadius: number,
    markerSize: number = 0
): { paths: _Scene.Path[]; markers: _Scene.Circle[] } {
    const angleScale = new agChartsContext._Scene.LinearScale();
    angleScale.domain = [0, 7];
    angleScale.range = [-Math.PI, Math.PI].map((angle) => angle + Math.PI / 2);

    const radiusScale = new agChartsContext._Scene.LinearScale();
    radiusScale.domain = [0, 10];
    radiusScale.range = [radius, innerRadius];

    const markers: _Scene.Circle[] = [];
    const center = size / 2;

    const paths: _Scene.Path[] = data.map((series) => {
        const path = new agChartsContext._Scene.Path();
        path.strokeWidth = 1;
        path.strokeOpacity = 0.5;
        path.lineCap = 'round';
        path.fill = undefined;
        path.fillOpacity = 0.8;

        series.forEach((datum: number, i: number) => {
            const angle = angleScale.convert(i);
            const r = radius + innerRadius - radiusScale.convert(datum);

            const x = r * Math.cos(angle) + center;
            const y = r * Math.sin(angle) + center;

            path.path[i > 0 ? 'lineTo' : 'moveTo'](x, y);

            if (markerSize > 0) {
                const marker = new agChartsContext._Scene.Circle();
                marker.x = x;
                marker.y = y;
                marker.size = markerSize;
                markers.push(marker);
            }
        });

        path.path.closePath();
        return path;
    });

    const group = new agChartsContext._Scene.Group();

    group.append([...paths, ...markers]);
    root.append(group);

    return { paths, markers };
}

export function accumulateData(data: number[][]): { processedData: number[][]; min: number; max: number } {
    let [min, max] = [Infinity, -Infinity];
    const processedData = data.reduce((acc, curr, currIndex) => {
        const previous = currIndex > 0 ? acc[currIndex - 1] : undefined;
        acc[currIndex] ??= [];
        const current = acc[currIndex];
        curr.forEach((datum, datumIndex) => {
            if (previous) {
                datum += previous[datumIndex];
            }

            current[datumIndex] = datum;

            if (current[datumIndex] < min) {
                min = current[datumIndex];
            }

            if (current[datumIndex] > max) {
                max = current[datumIndex];
            }
        });
        return acc;
    }, [] as number[][]);

    return { processedData, min, max };
}
