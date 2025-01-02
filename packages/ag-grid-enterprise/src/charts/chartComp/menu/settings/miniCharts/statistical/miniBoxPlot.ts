import type { Group } from 'ag-charts-types/scene';

import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniChartWithAxes } from '../miniChartWithAxes';

export class MiniBoxPlot extends MiniChartWithAxes {
    static chartType: ChartType = 'boxPlot';

    private readonly boxPlotGroups: Group[];

    constructor(
        container: HTMLElement,
        agChartsExports: AgChartsExports,
        fills: string[],
        strokes: string[],
        themeTemplateParameters: ThemeTemplateParameters,
        isCustomTheme: boolean
    ) {
        super(container, agChartsExports, 'boxPlotTooltip');

        const {
            size,
            padding,
            agChartsExports: { _Scene },
        } = this;

        const data = [11, 11.5, 10.5];

        const maxRatio = 1.2;
        const q3Ratio = 1.1;
        const q1Ratio = 0.9;
        const minRatio = 0.8;

        const yScale = new _Scene.LinearScale();
        yScale.domain = [
            data.reduce((a, b) => Math.min(a, b), Infinity) * minRatio,
            data.reduce((a, b) => Math.max(a, b), 0) * maxRatio,
        ];
        yScale.range = [size - 1.5 * padding, padding];

        const xScale = new _Scene.CategoryScale();
        xScale.domain = data.map((_, index) => index);
        xScale.range = [padding, size - padding];
        xScale.paddingInner = 0.4;
        xScale.paddingOuter = 0.2;

        const bandwidth = Math.round(xScale.bandwidth);
        const halfBandWidth = Math.round(xScale.bandwidth / 2);

        this.boxPlotGroups = data.map((datum, i) => {
            const [minValue, q1Value, q3Value, maxValue] = [
                datum * minRatio,
                datum * q1Ratio,
                datum * q3Ratio,
                datum * maxRatio,
            ];

            const top = Math.round(yScale.convert(q3Value));
            const left = Math.round(xScale.convert(i));
            const right = Math.round(left + bandwidth);
            const bottom = Math.round(yScale.convert(q1Value));
            const min = Math.round(yScale.convert(minValue));
            const mid = Math.round(yScale.convert(datum));
            const max = Math.round(yScale.convert(maxValue));
            const whiskerX = left + halfBandWidth;

            const boxPlotGroup = new _Scene.Group();

            const box = new _Scene.Rect();
            const median = new _Scene.Line();
            const topWhisker = new _Scene.Line();
            const bottomWhisker = new _Scene.Line();
            const topCap = new _Scene.Line();
            const bottomCap = new _Scene.Line();

            box.x = left;
            box.y = top;
            box.width = bandwidth;
            box.height = bottom - top;
            box.strokeWidth = 1;
            box.strokeOpacity = 0.75;
            box.crisp = true;

            this.setLineProperties(median, left, right, mid, mid);
            this.setLineProperties(topWhisker, whiskerX, whiskerX, max, top);
            this.setLineProperties(bottomWhisker, whiskerX, whiskerX, min, bottom);
            this.setLineProperties(topCap, left, right, max, max);
            this.setLineProperties(bottomCap, left, right, min, min);

            boxPlotGroup.append([box, median, topWhisker, bottomWhisker, topCap, bottomCap]);
            return boxPlotGroup;
        });

        this.updateColors(fills, strokes, themeTemplateParameters, isCustomTheme);
        this.root.append(this.boxPlotGroups);
    }

    updateColors(
        fills: string[],
        strokes: string[],
        themeTemplateParameters?: ThemeTemplateParameters,
        isCustomTheme?: boolean
    ) {
        const {
            agChartsExports: { _Util, _Theme },
        } = this;
        const themeBackgroundColor = themeTemplateParameters?.get(_Theme.themeSymbols.DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill =
            (Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) ?? 'white';

        this.boxPlotGroups.forEach((group, i) => {
            for (const node of group.children() as Iterable<any>) {
                const fill = fills[i % fills.length];
                node.fill = isCustomTheme ? fill : _Util.interpolateColor(fill, backgroundFill)(0.7);
                node.stroke = strokes[i % strokes.length];
            }
        });
    }

    setLineProperties(line: any, x1: number, x2: number, y1: number, y2: number) {
        line.x1 = x1;
        line.x2 = x2;
        line.y1 = y1;
        line.y2 = y2;
        line.strokeOpacity = 0.75;
    }
}
