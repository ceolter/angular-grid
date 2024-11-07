import type { AgChartsContext } from '../../../../gridChartsModule';
import type { ChartTranslationKey } from '../../../services/chartTranslationService';
import { MiniChart } from './miniChart';

export abstract class MiniChartWithPolarAxes extends MiniChart {
    private readonly stroke = 'gray';
    private gridLines: any[];
    protected showRadiusAxisLine: boolean = true;
    protected showAngleAxisLines: boolean = true;

    constructor(container: HTMLElement, agChartsContext: AgChartsContext, tooltipName: ChartTranslationKey) {
        super(container, agChartsContext, tooltipName);
    }

    public override postConstruct() {
        const size = this.size;
        const padding = this.padding;
        const combinedPadding = padding * 2;

        const axisLineRadius = (size - combinedPadding) / 2;
        const gridRadii = this.showAngleAxisLines
            ? [axisLineRadius, axisLineRadius * 0.8, axisLineRadius * 0.6, axisLineRadius * 0.4]
            : [];

        const radiusAxisLine = new this.agChartsContext._Scene.Line();
        radiusAxisLine.x1 = size / 2;
        radiusAxisLine.y1 = padding;
        radiusAxisLine.x2 = size / 2;
        radiusAxisLine.y2 = size - padding - axisLineRadius - gridRadii[gridRadii.length - 1];
        radiusAxisLine.stroke = this.stroke;
        radiusAxisLine.strokeOpacity = 0.5;
        radiusAxisLine.fill = undefined;

        radiusAxisLine.visible = this.showRadiusAxisLine;

        const x = padding + axisLineRadius;
        this.gridLines = gridRadii.map((radius, index) => {
            const gridLine = new this.agChartsContext._Scene.Path();
            gridLine.path.arc(x, x, radius, 0, 2 * Math.PI);
            gridLine.strokeWidth = 1;
            gridLine.stroke = this.stroke;
            gridLine.strokeOpacity = index === 0 ? 0.5 : 0.2;
            gridLine.fill = undefined;

            return gridLine;
        });

        const root = this.root;

        root.append(radiusAxisLine);
        if (this.gridLines.length > 0) root.append(this.gridLines);
        super.postConstruct();
    }
}
