import type { AgChartInstance, AgSparklineOptions } from 'ag-charts-types';

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
        const unsubscribeFromResize = _observeResize(this.beans, this.getGui(), () => this.refresh(params));
        this.addDestroyFunc(() => unsubscribeFromResize());
    }

    public refresh(params?: ISparklineCellRendererParams): boolean {
        const { clientWidth: width, clientHeight: height } = this.getGui();

        if (!this.sparklineInstance && params && width > 0 && height) {
            this.sparklineOptions = {
                background: { visible: false },
                container: this.eSparkline,
                width,
                height,
                ...params.sparklineOptions,
                data: params.value,
            } as AgSparklineOptions;

            // create new sparkline
            this.sparklineInstance = params.createSparkline!(this.sparklineOptions);
            return true;
        } else if (this.sparklineInstance) {
            const data = params?.value;
            this.sparklineOptions.width = width;
            this.sparklineOptions.height = height;
            this.sparklineOptions.data = data;

            this.sparklineInstance.updateDelta(this.sparklineOptions);

            return true;
        }
        return false;
    }

    public override destroy() {
        super.destroy();
        this.sparklineInstance?.destroy();
    }
}
