import type { Group } from 'ag-charts-types/scene';

import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import { MiniChartWithPolarAxes } from '../miniChartWithPolarAxes';

export class MiniSunburst extends MiniChartWithPolarAxes {
    static chartType: ChartType = 'sunburst';
    private readonly series: Group[];

    // Hierarchical data using multidimensional array
    private data = [
        [[], []],
        [[], []],
        [[], []],
    ];

    // Rotate the chart by the given angle (-90 degrees)
    private angleOffset = -Math.PI / 2;

    private innerRadiusRatio = 0;

    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[]) {
        super(container, agChartsExports, 'sunburstTooltip');

        this.showRadiusAxisLine = false;
        this.showAngleAxisLines = false;

        const {
            data,
            size,
            padding,
            angleOffset,
            innerRadiusRatio,
            agChartsExports: { _Scene },
        } = this;

        const radius = (size - padding * 2) / 2;

        const angleRange = [angleOffset + 0, angleOffset + 2 * Math.PI];
        const angleExtent = Math.abs(angleRange[1] - angleRange[0]);

        const radiusRange = [radius * innerRadiusRatio, radius];
        const radiusExtent = Math.abs(radiusRange[1] - radiusRange[0]);

        let maxDepth = 0;
        const findMaxDepth = (data: any[], parentDepth: number) => {
            data.forEach((child) => {
                const depth = parentDepth + 1;
                maxDepth = Math.max(maxDepth, depth);
                findMaxDepth(child, depth);
            });
        };

        findMaxDepth(data, 0);

        const radiusRatio = radiusExtent / maxDepth;
        const center = this.size / 2;
        const startAngle = angleRange[0];

        this.series = [];

        const createSectors = (data: any[], depth: number, startAngle: number, availableAngle: number, group?: any) => {
            const isArray = Array.isArray(data);

            if (!isArray) {
                return;
            }

            const childDepth = depth + 1;

            let previousAngle = startAngle;

            data.forEach((child, childIndex, children) => {
                let childGroup = group;
                if (!childGroup) {
                    childGroup = new _Scene.Group();
                    this.series.push(childGroup);
                }

                const innerRadius = radiusRange[0] + depth * radiusRatio;
                const outerRadius = radiusRange[0] + childDepth * radiusRatio;

                const angleRatio = 1 / children.length;
                const start = previousAngle;
                const end = start + availableAngle * angleRatio;

                const sector = new _Scene.Sector();
                sector.centerX = center;
                sector.centerY = center;
                sector.innerRadius = innerRadius;
                sector.outerRadius = outerRadius;
                sector.startAngle = start;
                sector.endAngle = end;
                sector.stroke = undefined;
                sector.strokeWidth = 0;
                sector.inset = 0.75;

                previousAngle = end;

                childGroup.append(sector);

                createSectors(child, childDepth, start, Math.abs(end - start), childGroup);
            });
        };

        createSectors(data, 0, startAngle, angleExtent);

        this.root.append(this.series);

        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], strokes: string[]) {
        this.series.forEach((group, i) => {
            for (const sector of group.children() as Iterable<any>) {
                sector.fill = fills[i % fills.length];
                sector.stroke = strokes[i % strokes.length];
            }
        });
    }
}
