import type { BeanCollection, ICellRenderer, ISparklineCellRendererParams } from 'ag-grid-community';
import { Component, RefPlaceholder, _observeResize } from 'ag-grid-community';

import type { SparklineFactoryOptions } from './agSparkline';
import { createAgSparkline } from './agSparkline';
import type { SparklineTooltipSingleton } from './tooltip/sparklineTooltipSingleton';

export class SparklineCellRenderer extends Component implements ICellRenderer {
    private sparklineTooltipSingleton!: SparklineTooltipSingleton;

    public wireBeans(beans: BeanCollection) {
        this.sparklineTooltipSingleton = beans.sparklineTooltipSingleton as SparklineTooltipSingleton;
    }

    private readonly eSparkline: HTMLElement = RefPlaceholder;

    private sparkline?: any;

    constructor() {
        super(/* html */ `<div class="ag-sparkline-wrapper">
            <span data-ref="eSparkline"></span>
        </div>`);
    }

    public init(params: ISparklineCellRendererParams): void {
        let firstTimeIn = true;
        const updateSparkline = () => {
            const { clientWidth, clientHeight } = this.getGui();
            if (clientWidth === 0 || clientHeight === 0) {
                return;
            }

            if (firstTimeIn) {
                const options: SparklineFactoryOptions = {
                    data: params.value,
                    width: clientWidth,
                    height: clientHeight,
                    context: {
                        data: params.data,
                    },
                    ...params.sparklineOptions,
                };

                // create new instance of sparkline
                this.sparkline = createAgSparkline(options, this.sparklineTooltipSingleton.getSparklineTooltip());

                // append sparkline canvas to cell renderer element
                this.eSparkline!.appendChild(this.sparkline.canvasElement);

                firstTimeIn = false;
            } else {
                this.sparkline.width = clientWidth;
                this.sparkline.height = clientHeight;
            }
        };

        const unsubscribeFromResize = _observeResize(this.beans, this.getGui(), updateSparkline);
        this.addDestroyFunc(() => unsubscribeFromResize());
    }

    public refresh(params: ISparklineCellRendererParams): boolean {
        if (this.sparkline) {
            this.sparkline.data = params.value;
            this.sparkline.context = {
                data: params.data,
            };
            return true;
        }
        return false;
    }

    public override destroy() {
        if (this.sparkline) {
            this.sparkline.destroy();
        }
        super.destroy();
    }
}
