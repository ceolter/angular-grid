import { _last } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../agChartsExports';
import type { CommandSegment } from './miniChartApi';

interface CreateColumnRectsParams {
    agChartsExports: AgChartsExports;
    stacked: boolean;
    root: any;
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
        agChartsExports: { _Scene },
    } = params;

    const xScale = new _Scene.BandScale();
    xScale.domain = xScaleDomain;
    xScale.range = [padding, size - padding];
    xScale.paddingInner = xScalePadding;
    xScale.paddingOuter = xScalePadding;

    const yScale = new _Scene.LinearScale();
    yScale.domain = yScaleDomain;
    yScale.range = [size - padding, padding];

    const createBars = (series: number[], xScale: any, yScale: any) => {
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

export function prepareLinearScene(_Scene: AgChartsExports['_Scene'], data: number[][], size: number, padding: number) {
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

    const xScale = new _Scene.LinearScale();
    xScale.domain = xDomain;
    xScale.range = [padding, size - padding];

    const yScale = new _Scene.LinearScale();
    yScale.domain = yDomain;
    yScale.range = [size - padding, padding];

    return { xScale, yScale };
}

export function createPathCommands(data: number[][], xScale: any, yScale: any): CommandSegment[][] {
    return data.map((series) =>
        series.map((datum: number, i: number) => [
            i > 0 ? 'lineTo' : 'moveTo',
            xScale.convert(i),
            yScale.convert(datum),
        ])
    );
}

export function createPath(_Scene: AgChartsExports['_Scene'], commands: CommandSegment[]): any {
    const path = new _Scene.Path();
    commands.forEach(([command, x, y]: CommandSegment) => path.path[command](x, y));
    return path;
}

export function createAreaPathCommands(
    commands: CommandSegment[][],
    yScale: any,
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

export function closePathViaPreviousSeries(all: CommandSegment[][], index: number, yScale: any) {
    if (index === 0) {
        return closePathViaOrigin(all[index], yScale);
    }
    return [...all[index - 1]];
}

export function closePathViaOrigin(pathCommands: CommandSegment[], yScale: any) {
    return pathCommands.map(([c, x]) => [c, x, yScale.convert(0)]);
}

export function createLinePaths(
    { _Scene }: AgChartsExports,
    root: any,
    data: number[][],
    size: number,
    padding: number
): any[] {
    const { xScale, yScale } = prepareLinearScene(_Scene, data, size, padding);

    const pathCommands = createPathCommands(data, xScale, yScale);

    const paths: any[] = pathCommands.map((commands) => {
        const path = createPath(_Scene, commands);
        path.strokeWidth = 3;
        path.lineCap = 'round';
        path.fill = undefined;
        return path;
    });

    const pathsGroup = new _Scene.Group();
    pathsGroup.setClipRect(new _Scene.BBox(padding, padding, size - padding * 2, size - padding * 2));
    pathsGroup.append(paths);
    root.append(pathsGroup);

    return paths;
}

export function createAreaPaths(
    _Scene: AgChartsExports['_Scene'],
    root: any,
    data: number[][],
    size: number,
    padding: number,
    stacked = false
): any[] {
    const { xScale, yScale } = prepareLinearScene(_Scene, data, size, padding);

    const pathCommands = createAreaPathCommands(createPathCommands(data, xScale, yScale), yScale, stacked);

    const areasGroup = new _Scene.Group();
    areasGroup.setClipRect(new _Scene.BBox(padding, padding, size - padding * 2, size - padding * 2));

    const paths: any[] = pathCommands.map((commands) => createPath(_Scene, commands));
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
    agChartsExports: AgChartsExports,
    root: any,
    data: number[][],
    size: number,
    radius: number,
    innerRadius: number,
    markerSize: number = 0
): { paths: any[]; markers: any[] } {
    const { _Scene } = agChartsExports;

    const angleScale = new _Scene.LinearScale();
    angleScale.domain = [0, 7];
    angleScale.range = [-Math.PI, Math.PI].map((angle) => angle + Math.PI / 2);

    const radiusScale = new _Scene.LinearScale();
    radiusScale.domain = [0, 10];
    radiusScale.range = [radius, innerRadius];

    const markers: any[] = [];
    const center = size / 2;

    const paths: any[] = data.map((series) => {
        const path = new _Scene.Path();
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
                const marker = new _Scene.Marker({ shape: 'circle' });
                marker.x = x;
                marker.y = y;
                marker.size = markerSize;
                markers.push(marker);
            }
        });

        path.path.closePath();
        return path;
    });

    const group = new _Scene.Group();

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
