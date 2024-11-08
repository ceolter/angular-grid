import type { ChartType } from 'ag-grid-community';

import type { AgChartsContext } from '../../../../../agChartsContext';
import type { ChartTranslationKey } from '../../../../services/chartTranslationService';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniChart } from '../miniChart';

export class MiniDonut extends MiniChart {
    static chartType: ChartType = 'donut';
    private readonly sectors: any[];

    constructor(
        container: HTMLElement,
        agChartsContext: AgChartsContext,
        fills: string[],
        strokes: string[],
        _themeTemplateParameters: ThemeTemplateParameters,
        _isCustomTheme: boolean,
        centerRadiusScaler = 0.6,
        tooltipName: ChartTranslationKey = 'donutTooltip'
    ) {
        super(container, agChartsContext, tooltipName);

        const radius = (this.size - this.padding * 2) / 2;
        const center = radius + this.padding;
        const toRadians = agChartsContext._Scene.toRadians;
        const angles = [
            [toRadians(-90), toRadians(30)],
            [toRadians(30), toRadians(120)],
            [toRadians(120), toRadians(180)],
            [toRadians(180), toRadians(210)],
            [toRadians(210), toRadians(240)],
            [toRadians(240), toRadians(270)],
        ];

        this.sectors = angles.map(([startAngle, endAngle]) => {
            const sector = new this.agChartsContext._Scene.Sector();
            sector.centerX = center;
            sector.centerY = center;
            sector.innerRadius = radius * centerRadiusScaler;
            sector.outerRadius = radius;
            sector.startAngle = startAngle;
            sector.endAngle = endAngle;
            sector.stroke = undefined;
            sector.strokeWidth = 0;
            sector.inset = 0.75;
            return sector;
        });

        this.updateColors(fills, strokes);
        this.root.append(this.sectors);
    }

    updateColors(fills: string[], strokes: string[]) {
        this.sectors.forEach((sector, i) => {
            sector.fill = fills[i % fills.length];
            sector.stroke = strokes[i % strokes.length];
        });
    }
}
