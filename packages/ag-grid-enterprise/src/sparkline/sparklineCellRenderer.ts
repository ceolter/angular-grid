import { AgCharts, _Util } from 'ag-charts-community';
import type { AgChartInstance, AgSparklineOptions } from 'ag-charts-community';

import type { ICellRenderer, ISparklineCellRendererParams } from 'ag-grid-community';
import { Component, RefPlaceholder, _observeResize } from 'ag-grid-community';

export class SparklineCellRenderer extends Component implements ICellRenderer {
    private readonly eSparkline: HTMLElement = RefPlaceholder;
    private sparklineInstance?: AgChartInstance<any>;
    private sparklineOptions: AgSparklineOptions;

    constructor() {
        super(/* html */ `<div class="ag-sparkline-wrapper">
            <span data-ref="eSparkline"></span>
        </div>`);
    }

    public init(params: ISparklineCellRendererParams): void {
        let firstTimeIn = true;
        const options = (this.sparklineOptions = {
            ...params.sparklineOptions,
        } as AgSparklineOptions);

        const updateSparkline = () => {
            const { clientWidth: width, clientHeight: height } = this.getGui();
            if (width === 0 || height === 0 || !params.sparklineOptions) {
                return;
            }

            if (firstTimeIn) {
                firstTimeIn = false;
                options.container = this.eSparkline;
                options.width = width;
                options.height = height;

                if (!options?.xKey || !options?.yKey || _Util.isNumber(!options?.data?.[0])) {
                    // XXX: required until AgCharts supports more data
                    options.data = params.value.map((y: number, x: number) => ({ x, y }));
                    options.xKey = 'x';
                    options.yKey = 'y';
                }

                // create new sparkline
                this.sparklineInstance = AgCharts.__createSparkline(this.sparklineOptions as AgSparklineOptions);
                return;
            }

            if (this.sparklineOptions.width === width && this.sparklineOptions.height === height) {
                return;
            }

            this.sparklineOptions.width = width;
            this.sparklineOptions.height = height;
            this.update();
        };

        const unsubscribeFromResize = _observeResize(this.gos, this.getGui(), updateSparkline);
        this.addDestroyFunc(() => unsubscribeFromResize());
    }

    public refresh(params: ISparklineCellRendererParams): boolean {
        if (this.sparklineInstance) {
            this.sparklineOptions = Object.assign(this.sparklineOptions, params.sparklineOptions as AgSparklineOptions);

            this.update();
            return true;
        }
        return false;
    }

    public update(): void {
        this.sparklineInstance?.update(this.sparklineOptions);
    }

    public override destroy() {
        super.destroy();
        this.sparklineInstance?.destroy();
    }
}
