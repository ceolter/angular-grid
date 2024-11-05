import { BeanStub } from '../context/beanStub';
import { _isDomLayout } from '../gridOptionsUtils';

export class CenterWidthFeature extends BeanStub {
    constructor(
        private readonly callback: (width: number) => void,
        private readonly addSpacer: boolean = false
    ) {
        super();
    }

    public postConstruct(): void {
        const listener = this.setWidth.bind(this);
        this.addManagedPropertyListener('domLayout', listener);

        this.addManagedEventListeners({
            columnContainerWidthChanged: listener,
            displayedColumnsChanged: listener,
            leftPinnedWidthChanged: listener,
        });

        if (this.addSpacer) {
            this.addManagedEventListeners({
                rightPinnedWidthChanged: listener,
                scrollVisibilityChanged: listener,
                scrollbarWidthChanged: listener,
            });
        }

        this.setWidth();
    }

    private setWidth(): void {
        const printLayout = _isDomLayout(this.gos, 'print');
        const { visibleCols, scrollVisibleSvc } = this.beans;

        const centerWidth = visibleCols.bodyWidth;
        const leftWidth = visibleCols.getColsLeftWidth();
        const rightWidth = visibleCols.getDisplayedColumnsRightWidth();

        let totalWidth: number;

        if (printLayout) {
            totalWidth = centerWidth + leftWidth + rightWidth;
        } else {
            totalWidth = centerWidth;

            if (this.addSpacer) {
                const relevantWidth = this.gos.get('enableRtl') ? leftWidth : rightWidth;
                if (relevantWidth === 0 && scrollVisibleSvc.verticalScrollShowing) {
                    totalWidth += scrollVisibleSvc.getScrollbarWidth();
                }
            }
        }

        this.callback(totalWidth);
    }
}
