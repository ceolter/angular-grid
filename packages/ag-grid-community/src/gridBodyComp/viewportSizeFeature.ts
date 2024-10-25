import type { ColumnFlexService } from '../columns/columnFlexService';
import type { ColumnViewportService } from '../columns/columnViewportService';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { ScrollVisibleService, SetScrollsVisibleParams } from '../gridBodyComp/scrollVisibleService';
import { _requestAnimationFrame } from '../misc/animationFrameService';
import type { PinnedColumnService } from '../pinnedColumns/pinnedColumnService';
import { _getInnerHeight } from '../utils/dom';
import type { GridBodyCtrl } from './gridBodyCtrl';
import type { RowContainerCtrl } from './rowContainer/rowContainerCtrl';

// listens to changes in the center viewport size, for column and row virtualisation,
// and adjusts grid as necessary. there are two viewports, one for horizontal and one for
// vertical scrolling.
export class ViewportSizeFeature extends BeanStub {
    private ctrlsSvc: CtrlsService;
    private pinnedCols?: PinnedColumnService;
    private colFlex?: ColumnFlexService;
    private scrollVisibleSvc: ScrollVisibleService;
    private colViewport: ColumnViewportService;

    public wireBeans(beans: BeanCollection): void {
        this.ctrlsSvc = beans.ctrlsSvc;
        this.pinnedCols = beans.pinnedCols;
        this.colFlex = beans.colFlex;
        this.scrollVisibleSvc = beans.scrollVisibleSvc;
        this.colViewport = beans.colViewport;
    }

    private centerContainerCtrl: RowContainerCtrl;
    private gridBodyCtrl: GridBodyCtrl;

    private centerWidth: number;
    private bodyHeight: number;

    constructor(centerContainerCtrl: RowContainerCtrl) {
        super();
        this.centerContainerCtrl = centerContainerCtrl;
    }

    public postConstruct(): void {
        this.ctrlsSvc.whenReady(this, (p) => {
            this.gridBodyCtrl = p.gridBodyCtrl;
            this.listenForResize();
        });
        this.addManagedEventListeners({ scrollbarWidthChanged: this.onScrollbarWidthChanged.bind(this) });
        this.addManagedPropertyListeners(['alwaysShowHorizontalScroll', 'alwaysShowVerticalScroll'], () => {
            this.checkViewportAndScrolls();
        });
    }

    private listenForResize(): void {
        const { gos, centerContainerCtrl, gridBodyCtrl } = this;

        const listener = () => {
            // onCenterViewportResize causes resize events to be fired (flex-columns).
            // when any resize event happens, style and layout are re-evaluated — which in turn may
            // trigger more resize events. Infinite loops from cyclic dependencies are addressed by
            // only processing elements deeper in the DOM during each iteration.
            // so the solution here is to use the animation frame service to avoid infinite loops.
            // For more info, see: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver#observation_errors
            _requestAnimationFrame(gos, () => {
                this.onCenterViewportResized();
            });
        };

        // centerContainer gets horizontal resizes
        centerContainerCtrl.registerViewportResizeListener(listener);

        // eBodyViewport gets vertical resizes
        gridBodyCtrl.registerBodyViewportResizeListener(listener);
    }

    private onScrollbarWidthChanged() {
        this.checkViewportAndScrolls();
    }

    private onCenterViewportResized(): void {
        this.scrollVisibleSvc.onCentreViewportResized();
        if (this.centerContainerCtrl.isViewportInTheDOMTree()) {
            this.pinnedCols?.keepPinnedColumnsNarrowerThanViewport();
            this.checkViewportAndScrolls();

            const newWidth = this.centerContainerCtrl.getCenterWidth();

            if (newWidth !== this.centerWidth) {
                this.centerWidth = newWidth;
                this.colFlex?.refreshFlexedColumns({
                    viewportWidth: this.centerWidth,
                    updateBodyWidths: true,
                    fireResizedEvent: true,
                });
            }
        } else {
            this.bodyHeight = 0;
        }
    }

    // gets called every time the viewport size changes. we use this to check visibility of scrollbars
    // in the grid panel, and also to check size and position of viewport for row and column virtualisation.
    private checkViewportAndScrolls(): void {
        // results in updating anything that depends on scroll showing
        this.updateScrollVisibleService();

        // fires event if height changes, used by PaginationService, HeightScalerService, RowRenderer
        this.checkBodyHeight();

        // check for virtual columns for ColumnController
        this.onHorizontalViewportChanged();

        this.gridBodyCtrl.getScrollFeature().checkScrollLeft();
    }

    public getBodyHeight(): number {
        return this.bodyHeight;
    }

    private checkBodyHeight(): void {
        const eBodyViewport = this.gridBodyCtrl.getBodyViewportElement();
        const bodyHeight = _getInnerHeight(eBodyViewport);

        if (this.bodyHeight !== bodyHeight) {
            this.bodyHeight = bodyHeight;
            this.eventSvc.dispatchEvent({
                type: 'bodyHeightChanged',
            });
        }
    }

    private updateScrollVisibleService(): void {
        // because of column animation (which takes 200ms), we have to do this twice.
        // eg if user removes cols anywhere except at the RHS, then the cols on the RHS
        // will animate to the left to fill the gap. this animation means just after
        // the cols are removed, the remaining cols are still in the original location
        // at the start of the animation, so pre animation the H scrollbar is still needed,
        // but post animation it is not.
        this.updateScrollVisibleServiceImpl();
        setTimeout(this.updateScrollVisibleServiceImpl.bind(this), 500);
    }

    private updateScrollVisibleServiceImpl(): void {
        const params: SetScrollsVisibleParams = {
            horizontalScrollShowing: this.isHorizontalScrollShowing(),
            verticalScrollShowing: this.gridBodyCtrl.isVerticalScrollShowing(),
        };

        this.scrollVisibleSvc.setScrollsVisible(params);
    }

    private isHorizontalScrollShowing(): boolean {
        return this.centerContainerCtrl.isHorizontalScrollShowing();
    }

    // this gets called whenever a change in the viewport, so we can inform column controller it has to work
    // out the virtual columns again. gets called from following locations:
    // + ensureColVisible, scroll, init, layoutChanged, displayedColumnsChanged
    private onHorizontalViewportChanged(): void {
        const scrollWidth = this.centerContainerCtrl.getCenterWidth();
        const scrollPosition = this.centerContainerCtrl.getViewportScrollLeft();

        this.colViewport.setScrollPosition(scrollWidth, scrollPosition);
    }
}
