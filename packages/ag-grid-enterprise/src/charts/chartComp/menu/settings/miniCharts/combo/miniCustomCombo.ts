import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import { MiniChart } from '../miniChart';
import { createColumnRects, createLinePaths } from '../miniChartHelpers';

export class MiniCustomCombo extends MiniChart {
    static chartType: ChartType = 'customCombo';

    private columns: any[];
    private lines: any[];

    private columnData = [3, 4];

    private lineData = [[5, 4, 6, 5, 4]];

    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[]) {
        super(container, agChartsExports, 'customComboTooltip');

        const {
            root,
            columnData,
            lineData,
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
            yScaleDomain: [0, 4],
            xScalePadding: 0.5,
            agChartsExports,
        });

        root.append(this.columns);

        this.lines = createLinePaths(this.agChartsExports, root, lineData, size, padding);

        const axisStroke = 'grey';
        const axisOvershoot = 3;

        const leftAxis = new _Scene.Line();
        leftAxis.x1 = padding;
        leftAxis.y1 = padding;
        leftAxis.x2 = padding;
        leftAxis.y2 = size - padding + axisOvershoot;
        leftAxis.stroke = axisStroke;

        const bottomAxis = new _Scene.Line();
        bottomAxis.x1 = padding - axisOvershoot + 1;
        bottomAxis.y1 = size - padding;
        bottomAxis.x2 = size - padding + 1;
        bottomAxis.y2 = size - padding;
        bottomAxis.stroke = axisStroke;

        const penIcon = new _Scene.Path();
        this.buildPenIconPath(penIcon);
        penIcon.fill = 'whitesmoke';
        penIcon.stroke = 'darkslategrey';
        penIcon.strokeWidth = 1;

        root.append([bottomAxis, leftAxis, penIcon]);

        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], strokes: string[]) {
        this.columns.forEach((bar: any, i: number) => {
            bar.fill = fills[i];
            bar.stroke = strokes[i];
        });

        this.lines.forEach((line: any, i: number) => {
            line.stroke = fills[i + 2];
        });
    }

    buildPenIconPath(penIcon: any) {
        const { path } = penIcon;
        path.moveTo(25.76, 43.46);
        path.lineTo(31.27, 48.53);
        path.moveTo(49.86, 22);
        path.lineTo(49.86, 22);
        path.cubicCurveTo(49.01994659053345, 21.317514933510974, 47.89593834348529, 21.09645997825817, 46.86, 21.41);
        path.lineTo(46.86, 21.41);
        path.cubicCurveTo(45.55460035985361, 21.77260167850787, 44.38777081121966, 22.517979360321792, 43.51, 23.55);
        path.lineTo(25.51, 43.8);
        path.lineTo(25.43, 43.89);
        path.lineTo(23.01, 51.89);
        path.lineTo(22.83, 52.46);
        path.lineTo(31.02, 48.86);
        path.lineTo(49.02, 28.52);
        path.lineTo(49.02, 28.52);
        path.cubicCurveTo(49.940716461596224, 27.521914221246085, 50.54302631059587, 26.2720342455763, 50.75, 24.93);
        path.lineTo(50.75, 24.93);
        path.cubicCurveTo(50.95363374988308, 23.866379846512814, 50.62080640232334, 22.77066734274871, 49.86, 22.0);
        path.closePath();
        path.moveTo(41.76, 25.5);
        path.lineTo(47.34, 30.5);
        path.moveTo(40.74, 26.65);
        path.lineTo(46.25, 31.71);
    }
}
