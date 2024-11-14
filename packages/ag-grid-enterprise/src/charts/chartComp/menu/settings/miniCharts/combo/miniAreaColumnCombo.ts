import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import type { CreateColumnRectsParams } from '../miniChartHelpers';
import { createColumnRects } from '../miniChartHelpers';
import { MiniChartWithAxes } from '../miniChartWithAxes';

export interface Coordinate {
    x: number;
    y: number;
}
export class MiniAreaColumnCombo extends MiniChartWithAxes {
    static chartType: ChartType = 'areaColumnCombo';

    private columns: any[];
    private areas: any[];

    private columnData = [3, 4.5];

    private areaData = [[5, 4, 6, 5, 4]];

    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[]) {
        super(container, agChartsExports, 'areaColumnComboTooltip');

        const {
            root,
            columnData,
            areaData,
            size,
            padding,
            agChartsExports: { _Scene },
        } = this;

        this.columns = createColumnRects({
            stacked: false,
            root,
            data: columnData,
            size,
            padding,
            xScaleDomain: [0, 1],
            yScaleDomain: [0, 6],
            xScalePadding: 0.5,
        } as CreateColumnRectsParams);

        // scale for area series
        const xScale = new _Scene.BandScale();
        xScale.range = [padding, size - padding];
        xScale.domain = [0, 1, 2, 3, 4];
        xScale.paddingInner = 1;
        xScale.paddingOuter = 0;

        const yScale = new _Scene.LinearScale();
        yScale.range = [size - padding, padding];
        yScale.domain = [0, 6];

        const pathData: Coordinate[][] = [];
        const yZero = yScale.convert(0);
        const firstX = xScale.convert(0);

        areaData.forEach((series, i) => {
            const points = pathData[i] || (pathData[i] = []);
            series.forEach((data, j) => {
                const yDatum = data;
                const xDatum = j;

                const x = xScale.convert(xDatum);
                const y = yScale.convert(yDatum);

                points[j] = { x, y };
            });

            const lastX = xScale.convert(series.length - 1);

            pathData[i].push(
                {
                    x: lastX,
                    y: yZero,
                },
                {
                    x: firstX,
                    y: yZero,
                }
            );
        });

        this.areas = pathData.map((points) => {
            const area = new _Scene.Path();
            area.strokeWidth = 0;
            area.fillOpacity = 0.8;

            const path = area.path;
            points.forEach((point, i) => path[i > 0 ? 'lineTo' : 'moveTo'](point.x, point.y));

            return area;
        });

        const areaGroup = new _Scene.Group();
        areaGroup.setClipRect(new _Scene.BBox(padding, padding, size - padding * 2, size - padding * 2));

        const columnGroup = new _Scene.Group();
        columnGroup.setClipRect(new _Scene.BBox(padding, padding, size - padding * 2, size - padding * 2));

        areaGroup.append(this.areas);
        columnGroup.append(this.columns);

        root.append(areaGroup);
        root.append(columnGroup);

        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], strokes: string[]) {
        this.areas.forEach((area, i) => {
            area.fill = fills[i];
            area.stroke = strokes[i];
        });

        this.columns.forEach((bar: any, i: number) => {
            bar.fill = fills[i + 1];
            bar.stroke = strokes[i + 1];
        });
    }
}
