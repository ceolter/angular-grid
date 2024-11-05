import { AgCharts } from 'ag-charts-community';
import type { AgChartInstance, AgSparklineOptions } from 'ag-charts-types';

import type { ICellRenderer, ISparklineCellRendererParams } from 'ag-grid-community';
import { Component, RefPlaceholder, _observeResize } from 'ag-grid-community';

import { needsResize, sizeValid, transformData } from './sparklineUtil';

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
        const unsubscribeFromResize = _observeResize(this.gos, this.getGui(), () => {
            this.updateSparkline(params);
        });
        this.addDestroyFunc(() => unsubscribeFromResize());
    }

    private updateSparkline(params?: ISparklineCellRendererParams): boolean {
        const { clientWidth: width, clientHeight: height } = this.getGui();

        if (sizeValid(width, height)) {
            if (!this.sparklineInstance && params) {
                const options = {
                    background: { visible: false },
                    container: this.eSparkline,
                    width,
                    height,
                    ...params.sparklineOptions,
                } as AgSparklineOptions;

                transformData((this.sparklineOptions = options), params);

                // create new sparkline
                this.sparklineInstance = AgCharts.__createSparkline(options);
                return true;
            } else if (this.sparklineInstance && needsResize(width, height, this.sparklineOptions)) {
                this.sparklineOptions.width = width;
                this.sparklineOptions.height = height;

                transformData(this.sparklineOptions, params);

                this.sparklineInstance?.updateDelta({ width, height, data: this.sparklineOptions.data });
                return true;
            }
        }
        return false;
    }

    public refresh(params: ISparklineCellRendererParams): boolean {
        if (this.sparklineInstance) {
            transformData(this.sparklineOptions, params);

            return this.updateSparkline(params);
        }
        return false;
    }

    public override destroy() {
        super.destroy();
        this.sparklineInstance?.destroy();
    }
}
