import type { Path } from 'ag-charts-types/scene';

import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import { MiniChartWithAxes } from '../miniChartWithAxes';

export class MiniRangeArea extends MiniChartWithAxes {
    static chartType: ChartType = 'rangeArea';

    private readonly lines: Path[][];
    private readonly areas: Path[];

    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[]) {
        super(container, agChartsExports, 'rangeAreaTooltip');

        // Create a set of repeating zigzag-shaped data series to use as the chart data
        const period = 4;
        const dataSeriesMidpoints = [
            zigzag({ offset: 0.375 * period, length: period, pattern: { low: 3, high: 5, period } }),
            zigzag({ offset: 0.375 * period, length: period, pattern: { low: 2.25, high: 4.25, period } }),
            zigzag({ offset: 0.75 * period, length: period, pattern: { low: 2.5, high: 4.5, period } }),
        ];
        const dataSeriesWidth = 1.75;
        const data = dataSeriesMidpoints.map((series) =>
            series.map(([x, y]) => ({
                x,
                low: y - 0.5 * dataSeriesWidth,
                high: y + 0.5 * dataSeriesWidth,
            }))
        );

        const { lines, areas } = this.createRangeArea(this.root, data, this.size, this.padding);
        this.lines = lines;
        this.areas = areas;
        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], strokes: string[]) {
        // Swap the secondary and tertiary colors to match the designs
        fills = swapArrayItems(fills, 1, 2);
        strokes = swapArrayItems(strokes, 1, 2);

        this.lines.forEach(([highLine, lowLine], i) => {
            highLine.fill = undefined;
            highLine.stroke = strokes[i];
            lowLine.fill = undefined;
            lowLine.stroke = strokes[i];
        });
        this.areas.forEach((area, i) => {
            area.fill = fills[i];
        });
    }

    createRangeArea(
        root: any,
        data: Array<Array<{ x: number; low: number; high: number }>>,
        size: number,
        padding: number
    ): { lines: any[][]; areas: any[] } {
        const xMin = data.reduce((acc, series) => series.reduce((acc, { x }) => Math.min(acc, x), acc), Infinity);
        const xMax = data.reduce((acc, series) => series.reduce((acc, { x }) => Math.max(acc, x), acc), -Infinity);
        const yMin = data.reduce((acc, series) => series.reduce((acc, { low }) => Math.min(acc, low), acc), Infinity);
        const yMax = data.reduce(
            (acc, series) => series.reduce((acc, { high }) => Math.max(acc, high), acc),
            -Infinity
        );

        const { _Scene } = this.agChartsExports;

        const xScale = new _Scene.LinearScale();
        xScale.domain = [xMin, xMax];
        xScale.range = [padding, size - padding];

        const scalePadding = 2 * padding;

        const yScale = new _Scene.LinearScale();
        yScale.domain = [yMin, yMax];
        yScale.range = [size - scalePadding, scalePadding];

        const lines: any[][] = [];
        const areas: any[] = [];

        const lowPoints = data.map((series) => {
            const highLine = new _Scene.Path();
            const lowLine = new _Scene.Path();
            const area = new _Scene.Path();

            lines.push([highLine, lowLine]);
            areas.push(area);

            highLine.strokeWidth = 0;
            lowLine.strokeWidth = 0;
            area.strokeWidth = 0;
            area.fillOpacity = 0.8;

            highLine.path.clear();
            lowLine.path.clear();
            area.path.clear();

            return series.map((datum, datumIndex) => {
                const { x, low, high } = datum;

                const scaledX = xScale.convert(x);
                const yLow = yScale.convert(low);
                const yHigh = yScale.convert(high);

                const command = datumIndex > 0 ? 'lineTo' : 'moveTo';

                highLine.path[command](scaledX, yHigh);
                lowLine.path[command](scaledX, yLow);
                area.path[command](scaledX, yHigh);

                return [scaledX, yLow];
            });
        });

        lowPoints.forEach((seriesLowPoints, seriesIndex) => {
            const n = seriesLowPoints.length - 1;
            const area = areas[seriesIndex];
            for (let datumIndex = n; datumIndex >= 0; datumIndex--) {
                const [x, y] = seriesLowPoints[datumIndex];
                area.path['lineTo'](x, y);
            }
        });

        root.append(areas.concat(...lines));

        return { lines, areas };
    }
}

interface ZigzagPatternOptions {
    low: number;
    high: number;
    period: number;
}

function zigzag(options: { offset: number; length: number; pattern: ZigzagPatternOptions }): Array<[number, number]> {
    const { offset, length, pattern } = options;

    // Generate [x, y] points for all inflection points of the zigzag pattern that fall within the range
    const points = getZigzagInflectionPoints(offset, length, pattern);

    // Ensure the first and last points are clamped to the start and end of the range
    const xMin = 0;
    const xMax = length;
    if (points.length === 0 || points[0][0] !== xMin) points.unshift(getZigzagPoint(xMin, offset, pattern));
    if (points[points.length - 1][0] !== xMax) points.push(getZigzagPoint(xMax, offset, pattern));

    return points;

    function getZigzagInflectionPoints(
        offset: number,
        length: number,
        pattern: ZigzagPatternOptions
    ): [number, number][] {
        const { period } = pattern;
        const scaledOffset = offset / period;
        const patternInflectionPoints = [0, 0.5];
        const inflectionPoints = patternInflectionPoints
            .map((x) => x - scaledOffset)
            // Clamp offset points to the unit range [0, 1)
            .map(getRemainderAbs)
            .sort((a, b) => a - b);
        const repeatedPoints = Array.from(
            { length: Math.floor(inflectionPoints.length * (period / length)) },
            (_, i) => inflectionPoints[i % inflectionPoints.length] + Math.floor(i / inflectionPoints.length)
        );
        return repeatedPoints.map((x) => x * period).map((x) => getZigzagPoint(x, offset, pattern));
    }

    function getZigzagPoint(x: number, offset: number, pattern: ZigzagPatternOptions): [number, number] {
        return [x, getZigzagValue(offset + x, pattern)];
    }

    function getZigzagValue(x: number, pattern: ZigzagPatternOptions): number {
        const { low, high, period } = pattern;
        const scaledX = getRemainderAbs(x / period);
        const y = scaledX > 0.5 ? 1 - 2 * (scaledX - 0.5) : 2 * scaledX;
        return low + (high - low) * y;
    }
}

function getRemainderAbs(value: number): number {
    const remainder = value % 1;
    return remainder < 0 ? remainder + 1 : remainder;
}

function swapArrayItems<T>(items: T[], leftIndex: number, rightIndex: number): T[] {
    const results = [...items];
    const temp = results[leftIndex];
    results[leftIndex] = results[rightIndex];
    results[rightIndex] = temp;
    return results;
}
