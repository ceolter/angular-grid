import type { Rect } from 'ag-charts-types/scene';

import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniChart } from '../miniChart';

export class MiniTreemap extends MiniChart {
    static chartType: ChartType = 'treemap';
    private readonly rects: Rect[];

    constructor(
        container: HTMLElement,
        agChartsExports: AgChartsExports,
        fills: string[],
        strokes: string[],
        themeTemplate: ThemeTemplateParameters,
        isCustomTheme: boolean
    ) {
        super(container, agChartsExports, 'treemapTooltip');

        const {
            size,
            padding,
            agChartsExports: { _Scene },
        } = this;

        const data: number[][] = [
            [1, 1],
            [3, 2, 1],
        ];

        const treeSize = data.length;
        const treePadding = treeSize % 2 === 0 ? 0.3 : 0.2;
        const range = [padding, size - padding];

        const columns = data.length;
        const columnParts = (columns * (columns + 1)) / 2;
        const columnPadding = treePadding / (columns - 1);

        const availableRange = range[1] - range[0];
        const availableWidth = availableRange - treePadding;

        let previousX = range[0];
        this.rects = data.reduce((rects, d, columnIndex) => {
            rects ??= [];

            const widthRatio = (columns - columnIndex) / columnParts;
            const width = availableWidth * widthRatio;

            const rows = d.length;
            const rowParts = d.reduce((parts, ratio) => (parts += ratio), 0);
            const rowPadding = treePadding / (rows - 1 || 1);
            const availableHeight = rows > 1 ? availableRange - treePadding : availableRange;

            let previousY = range[0];
            const xRects = d.map((ratio) => {
                const rect = new _Scene.Rect();

                const height = (availableHeight * ratio) / rowParts;

                rect.x = previousX;
                rect.y = previousY;
                rect.width = width;
                rect.height = height;
                rect.strokeWidth = 0.75;
                rect.crisp = true;

                previousY += height + rowPadding;
                return rect;
            });

            previousX += width + columnPadding;

            rects.push(...xRects);

            return rects;
        }, [] as Rect[]);

        this.updateColors(fills, strokes, themeTemplate, isCustomTheme);

        const rectGroup = new _Scene.Group();
        rectGroup.setClipRect(new _Scene.BBox(padding, padding, size - padding, size - padding));
        rectGroup.append(this.rects);
        this.root.append(rectGroup);
    }

    updateColors(fills: string[], strokes: string[], themeTemplate?: ThemeTemplateParameters, isCustomTheme?: boolean) {
        const defaultBackgroundColor = themeTemplate?.get(
            this.agChartsExports._Theme.themeSymbols.DEFAULT_BACKGROUND_COLOUR
        );
        const backgroundFill =
            (Array.isArray(defaultBackgroundColor) ? defaultBackgroundColor[0] : defaultBackgroundColor) ?? 'white';

        this.rects.forEach((rect, i) => {
            rect.fill = fills[i % strokes.length];
            rect.stroke = isCustomTheme ? strokes[i % strokes.length] : backgroundFill;
        });
    }
}
