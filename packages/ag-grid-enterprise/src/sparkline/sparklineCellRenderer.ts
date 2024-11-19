import type { AgChartInstance, AgSparklineOptions } from 'ag-charts-types';

import type { ICellRenderer, ISparklineCellRendererParams } from 'ag-grid-community';
import { Component, RefPlaceholder, _observeResize } from 'ag-grid-community';

import { wrapFn } from './sparklinesUtils';

export class SparklineCellRenderer extends Component implements ICellRenderer {
    private readonly eSparkline: HTMLElement = RefPlaceholder;
    private sparklineInstance?: AgChartInstance<any>;
    private sparklineOptions: AgSparklineOptions;
    private params: ISparklineCellRendererParams<any, any> | undefined;

    constructor() {
        super(/* html */ `<div class="ag-sparkline-wrapper">
            <span data-ref="eSparkline"></span>
        </div>`);
    }

    public init(params: ISparklineCellRendererParams): void {
        this.refresh(params);
        const unsubscribeFromResize = _observeResize(this.beans, this.getGui(), () => this.refresh(params));
        this.addDestroyFunc(() => unsubscribeFromResize());
    }

    public refresh(params?: ISparklineCellRendererParams): boolean {
        this.params = params;
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

            if (this.sparklineOptions.tooltip?.renderer) {
                this.wrapTooltipRenderer();
            }

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

    private wrapTooltipRenderer() {
        const existing = this.sparklineOptions.tooltip!.renderer!;
        type existingType = typeof existing;

        this.sparklineOptions.tooltip = {
            ...this.sparklineOptions.tooltip,
            renderer: wrapFn(existing, (fn, tooltipParams: Parameters<existingType>[0]): ReturnType<existingType> => {
                return fn({
                    ...tooltipParams,
                    ...({
                        context: {
                            data: this.params?.data,
                            cellData: this.params?.value,
                        },
                        yValue: tooltipParams.datum[tooltipParams.yKey],
                        xValue: tooltipParams.datum[tooltipParams.xKey],
                    } as any),
                });
            }),
        };
    }

    public override destroy() {
        super.destroy();
        this.sparklineInstance?.destroy();
    }
}
