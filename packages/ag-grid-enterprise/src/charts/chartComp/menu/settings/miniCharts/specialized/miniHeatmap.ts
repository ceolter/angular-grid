import type { ChartType } from 'ag-grid-community';

import type { AgChartsContext } from '../../../../../agChartsContext';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniChart } from '../miniChart';

export class MiniHeatmap extends MiniChart {
    static chartType: ChartType = 'heatmap';
    private readonly rects: any[];

    constructor(
        container: HTMLElement,
        agChartsContext: AgChartsContext,
        fills: string[],
        strokes: string[],
        themeTemplate: ThemeTemplateParameters,
        isCustomTheme: boolean
    ) {
        super(container, agChartsContext, 'heatmapTooltip');

        const { size, padding } = this;

        const heatmapSize = 3;

        const data = Array.from({ length: heatmapSize }, (_, __) =>
            Array.from({ length: heatmapSize }, (_, yIndex) => yIndex)
        );
        const domain = data.map((_, index) => index);

        const xScale = new this.agChartsContext._Scene.BandScale();
        xScale.domain = domain;
        xScale.range = [padding, size - padding];
        xScale.paddingInner = 0.01;
        xScale.paddingOuter = 0.1;

        const yScale = new this.agChartsContext._Scene.BandScale();
        yScale.domain = domain;
        yScale.range = [padding, size - padding];
        yScale.paddingInner = 0.01;
        yScale.paddingOuter = 0.1;

        const width = xScale.bandwidth ?? 0;
        const height = yScale.bandwidth ?? 0;

        this.rects = data.reduce((rects, d: [], index) => {
            rects ??= [];
            const xRects = d.map((_, yIndex) => {
                const rect = new this.agChartsContext._Scene.Rect();
                rect.x = xScale.convert(index);
                rect.y = yScale.convert(yIndex);
                rect.width = width;
                rect.height = height;
                rect.strokeWidth = 0;
                rect.crisp = true;

                return rect;
            });

            rects.push(...xRects);

            return rects;
        }, []);

        this.updateColors(fills, strokes, themeTemplate, isCustomTheme);

        const rectGroup = new this.agChartsContext._Scene.Group();
        rectGroup.setClipRect(new this.agChartsContext._Scene.BBox(padding, padding, size - padding, size - padding));
        rectGroup.append(this.rects);
        this.root.append(rectGroup);
    }

    updateColors(fills: string[], strokes: string[], themeTemplate?: ThemeTemplateParameters, isCustomTheme?: boolean) {
        const defaultColorRange = themeTemplate?.get(
            this.agChartsContext._Theme.themeSymbols.DEFAULT_DIVERGING_SERIES_COLOR_RANGE
        );
        const defaultBackgroundColor = themeTemplate?.get(
            this.agChartsContext._Theme.themeSymbols.DEFAULT_BACKGROUND_COLOUR
        );
        const backgroundFill =
            (Array.isArray(defaultBackgroundColor) ? defaultBackgroundColor[0] : defaultBackgroundColor) ?? 'white';

        const colorRange = isCustomTheme ? [fills[0], fills[1]] : defaultColorRange;
        const stroke = isCustomTheme ? strokes[0] : backgroundFill;

        const fillFn = this.agChartsContext._Util.interpolateColor(colorRange[0], colorRange[1]);
        this.rects.forEach((rect, i) => {
            rect.fill = fillFn(i * 0.2);
            rect.stroke = stroke;
        });
    }
}
