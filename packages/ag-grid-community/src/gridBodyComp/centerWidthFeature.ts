import type { VisibleColsService } from '../columns/visibleColsService';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import { _isDomLayout } from '../gridOptionsUtils';
import type { ScrollVisibleService } from './scrollVisibleService';

export class CenterWidthFeature extends BeanStub {
    private visibleCols: VisibleColsService;
    private scrollVisibleSvc: ScrollVisibleService;

    public wireBeans(beans: BeanCollection): void {
        this.visibleCols = beans.visibleCols;
        this.scrollVisibleSvc = beans.scrollVisibleSvc;
    }

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

        const centerWidth = this.visibleCols.getBodyContainerWidth();
        const leftWidth = this.visibleCols.getColsLeftWidth();
        const rightWidth = this.visibleCols.getDisplayedColumnsRightWidth();

        let totalWidth: number;

        if (printLayout) {
            totalWidth = centerWidth + leftWidth + rightWidth;
        } else {
            totalWidth = centerWidth;

            if (this.addSpacer) {
                const relevantWidth = this.gos.get('enableRtl') ? leftWidth : rightWidth;
                if (relevantWidth === 0 && this.scrollVisibleSvc.isVerticalScrollShowing()) {
                    totalWidth += this.scrollVisibleSvc.getScrollbarWidth();
                }
            }
        }

        this.callback(totalWidth);
    }
}
