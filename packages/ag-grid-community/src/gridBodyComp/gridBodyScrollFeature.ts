import type { ColumnModel } from '../columns/columnModel';
import type { VisibleColsService } from '../columns/visibleColsService';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { AgColumn } from '../entities/agColumn';
import type { BodyScrollEvent } from '../events';
import { _isDomLayout } from '../gridOptionsUtils';
import type { WithoutGridCommon } from '../interfaces/iCommon';
import type { IRowModel } from '../interfaces/iRowModel';
import type { IRowNode, VerticalScrollPosition } from '../interfaces/iRowNode';
import type { AnimationFrameService } from '../misc/animationFrameService';
import type { PageBoundsService } from '../pagination/pageBoundsService';
import type { PaginationService } from '../pagination/paginationService';
import type { RowContainerHeightService } from '../rendering/rowContainerHeightService';
import type { RowRenderer } from '../rendering/rowRenderer';
import { _isIOSUserAgent } from '../utils/browser';
import { _getInnerHeight, _getScrollLeft, _isRtlNegativeScroll, _setScrollLeft } from '../utils/dom';
import { _debounce } from '../utils/function';
import { _warn } from '../validation/logging';
import type { RowContainerCtrl } from './rowContainer/rowContainerCtrl';

enum ScrollDirection {
    Vertical,
    Horizontal,
}

const VIEWPORT = 'Viewport';

const FAKE_V_SCROLLBAR = 'fakeVScrollComp';

const HORIZONTAL_SOURCES = [
    'fakeHScrollComp',
    'centerHeader',
    'topCenter',
    'bottomCenter',
    'stickyTopCenter',
    'stickyBottomCenter',
] as const;

type VerticalScrollSource = typeof VIEWPORT | typeof FAKE_V_SCROLLBAR;
type HorizontalScrollSource = typeof VIEWPORT | (typeof HORIZONTAL_SOURCES)[number];

export interface ScrollPartner {
    getViewportElement(): HTMLElement;
    onScrollCallback(fn: () => void): void;
}

export class GridBodyScrollFeature extends BeanStub {
    private ctrlsSvc: CtrlsService;
    private animationFrameSvc?: AnimationFrameService;
    private pagination?: PaginationService;
    private pageBounds: PageBoundsService;
    private rowModel: IRowModel;
    private heightScaler: RowContainerHeightService;
    private rowRenderer: RowRenderer;
    private colModel: ColumnModel;
    private visibleCols: VisibleColsService;

    public wireBeans(beans: BeanCollection): void {
        this.ctrlsSvc = beans.ctrlsSvc;
        this.animationFrameSvc = beans.animationFrameSvc;
        this.pagination = beans.pagination;
        this.pageBounds = beans.pageBounds;
        this.rowModel = beans.rowModel;
        this.heightScaler = beans.rowContainerHeight;
        this.rowRenderer = beans.rowRenderer;
        this.colModel = beans.colModel;
        this.visibleCols = beans.visibleCols;
    }

    private enableRtl: boolean;

    private lastScrollSource: [VerticalScrollSource | null, HorizontalScrollSource | null] = [null, null];

    private eBodyViewport: HTMLElement;

    private scrollLeft = -1;
    private nextScrollTop = -1;
    private scrollTop = -1;

    // Used to provide approximate values of scrollTop and offsetHeight
    // without forcing the browser to recalculate styles.
    private lastOffsetHeight = -1;
    private lastScrollTop = -1;

    private scrollTimer: number = 0;

    private readonly resetLastHScrollDebounced: () => void;
    private readonly resetLastVScrollDebounced: () => void;

    private centerRowsCtrl: RowContainerCtrl;

    constructor(eBodyViewport: HTMLElement) {
        super();
        this.eBodyViewport = eBodyViewport;
        this.resetLastHScrollDebounced = _debounce(
            this,
            () => (this.lastScrollSource[ScrollDirection.Horizontal] = null),
            500
        );
        this.resetLastVScrollDebounced = _debounce(
            this,
            () => (this.lastScrollSource[ScrollDirection.Vertical] = null),
            500
        );
    }

    public override destroy(): void {
        super.destroy();

        window.clearTimeout(this.scrollTimer);
    }

    public postConstruct(): void {
        this.enableRtl = this.gos.get('enableRtl');
        this.addManagedEventListeners({
            displayedColumnsWidthChanged: this.onDisplayedColumnsWidthChanged.bind(this),
        });

        this.ctrlsSvc.whenReady(this, (p) => {
            this.centerRowsCtrl = p.center;
            this.onDisplayedColumnsWidthChanged();
            this.addScrollListener();
        });
    }

    private addScrollListener() {
        this.addHorizontalScrollListeners();
        this.addVerticalScrollListeners();
    }

    private addHorizontalScrollListeners(): void {
        this.addManagedElementListeners(this.centerRowsCtrl.getViewportElement(), {
            scroll: this.onHScroll.bind(this, VIEWPORT),
        });

        for (const source of HORIZONTAL_SOURCES) {
            const scrollPartner: ScrollPartner = this.ctrlsSvc.get(source);
            this.registerScrollPartner(scrollPartner, this.onHScroll.bind(this, source));
        }
    }

    private addVerticalScrollListeners(): void {
        const fakeVScrollComp = this.ctrlsSvc.get('fakeVScrollComp');
        const isDebounce = this.gos.get('debounceVerticalScrollbar');

        const onVScroll = isDebounce
            ? _debounce(this, this.onVScroll.bind(this, VIEWPORT), 100)
            : this.onVScroll.bind(this, VIEWPORT);
        const onFakeVScroll = isDebounce
            ? _debounce(this, this.onVScroll.bind(this, FAKE_V_SCROLLBAR), 100)
            : this.onVScroll.bind(this, FAKE_V_SCROLLBAR);

        this.addManagedElementListeners(this.eBodyViewport, { scroll: onVScroll });
        this.registerScrollPartner(fakeVScrollComp, onFakeVScroll);
    }

    private registerScrollPartner(comp: ScrollPartner, callback: () => void) {
        comp.onScrollCallback(callback);
    }

    private onDisplayedColumnsWidthChanged(): void {
        if (this.enableRtl) {
            // because RTL is all backwards, a change in the width of the row
            // can cause a change in the scroll position, without a scroll event,
            // because the scroll position in RTL is a function that depends on
            // the width. to be convinced of this, take out this line, enable RTL,
            // scroll all the way to the left and then resize a column
            this.horizontallyScrollHeaderCenterAndFloatingCenter();
        }
    }

    private horizontallyScrollHeaderCenterAndFloatingCenter(scrollLeft?: number): void {
        // when doing RTL, this method gets called once prematurely
        const notYetInitialised = this.centerRowsCtrl == null;
        if (notYetInitialised) {
            return;
        }

        if (scrollLeft === undefined) {
            scrollLeft = this.centerRowsCtrl.getCenterViewportScrollLeft();
        }

        this.setScrollLeftForAllContainersExceptCurrent(Math.abs(scrollLeft));
    }

    private setScrollLeftForAllContainersExceptCurrent(scrollLeft: number): void {
        for (const container of [...HORIZONTAL_SOURCES, VIEWPORT] as const) {
            if (this.lastScrollSource[ScrollDirection.Horizontal] === container) {
                continue;
            }

            const viewport = this.getViewportForSource(container);
            _setScrollLeft(viewport, scrollLeft, this.enableRtl);
        }
    }

    private getViewportForSource(source: VerticalScrollSource | HorizontalScrollSource): HTMLElement {
        if (source === VIEWPORT) {
            return this.centerRowsCtrl.getViewportElement();
        }

        return this.ctrlsSvc.get(source).getViewportElement();
    }

    private isControllingScroll(
        source: HorizontalScrollSource | VerticalScrollSource,
        direction: ScrollDirection
    ): boolean {
        if (this.lastScrollSource[direction] == null) {
            if (direction === ScrollDirection.Vertical) {
                this.lastScrollSource[0] = source as VerticalScrollSource;
            } else {
                this.lastScrollSource[1] = source as HorizontalScrollSource;
            }

            return true;
        }

        return this.lastScrollSource[direction] === source;
    }

    private onHScroll(source: HorizontalScrollSource): void {
        if (!this.isControllingScroll(source, ScrollDirection.Horizontal)) {
            return;
        }

        const centerContainerViewport = this.centerRowsCtrl.getViewportElement();
        const { scrollLeft } = centerContainerViewport;

        if (this.shouldBlockScrollUpdate(ScrollDirection.Horizontal, scrollLeft, true)) {
            return;
        }
        const newScrollLeft = _getScrollLeft(this.getViewportForSource(source), this.enableRtl);

        this.doHorizontalScroll(newScrollLeft);
        this.resetLastHScrollDebounced();
    }

    private onVScroll(source: VerticalScrollSource): void {
        if (!this.isControllingScroll(source, ScrollDirection.Vertical)) {
            return;
        }

        let scrollTop: number;

        if (source === VIEWPORT) {
            scrollTop = this.eBodyViewport.scrollTop;
        } else {
            scrollTop = this.ctrlsSvc.get('fakeVScrollComp').getScrollPosition();
        }

        if (this.shouldBlockScrollUpdate(ScrollDirection.Vertical, scrollTop, true)) {
            return;
        }
        this.animationFrameSvc?.setScrollTop(scrollTop);
        this.nextScrollTop = scrollTop;

        if (source === VIEWPORT) {
            this.ctrlsSvc.get('fakeVScrollComp').setScrollPosition(scrollTop);
        } else {
            this.eBodyViewport.scrollTop = scrollTop;
        }

        // the `scrollGridIfNeeded` will recalculate the rows to be rendered by the grid
        // so it should only be called after `eBodyViewport` has been scrolled to the correct
        // position, otherwise the `first` and `last` row could be miscalculated.
        if (!this.animationFrameSvc || this.gos.get('suppressAnimationFrame')) {
            this.scrollGridIfNeeded();
        } else {
            this.animationFrameSvc.schedule();
        }

        this.resetLastVScrollDebounced();
    }

    private doHorizontalScroll(scrollLeft: number): void {
        const fakeScrollLeft = this.ctrlsSvc.get('fakeHScrollComp').getScrollPosition();

        if (this.scrollLeft === scrollLeft && scrollLeft === fakeScrollLeft) {
            return;
        }

        this.scrollLeft = scrollLeft;

        this.fireScrollEvent(ScrollDirection.Horizontal);
        this.horizontallyScrollHeaderCenterAndFloatingCenter(scrollLeft);
        this.centerRowsCtrl.onHorizontalViewportChanged(true);
    }

    private fireScrollEvent(direction: ScrollDirection): void {
        const bodyScrollEvent: WithoutGridCommon<BodyScrollEvent> = {
            type: 'bodyScroll',
            direction: direction === ScrollDirection.Horizontal ? 'horizontal' : 'vertical',
            left: this.scrollLeft,
            top: this.scrollTop,
        };
        this.eventSvc.dispatchEvent(bodyScrollEvent);

        window.clearTimeout(this.scrollTimer);

        this.scrollTimer = window.setTimeout(() => {
            this.scrollTimer = 0;
            this.eventSvc.dispatchEvent({
                ...bodyScrollEvent,
                type: 'bodyScrollEnd',
            });
        }, 100);
    }

    private shouldBlockScrollUpdate(direction: ScrollDirection, scrollTo: number, touchOnly: boolean = false): boolean {
        // touch devices allow elastic scroll - which temporally scrolls the panel outside of the viewport
        // (eg user uses touch to go to the left of the grid, but drags past the left, the rows will actually
        // scroll past the left until the user releases the mouse). when this happens, we want ignore the scroll,
        // as otherwise it was causing the rows and header to flicker.

        // sometimes when scrolling, we got values that extended the maximum scroll allowed. we used to
        // ignore these scrolls. problem is the max scroll position could be skipped (eg the previous scroll event
        // could be 10px before the max position, and then current scroll event could be 20px after the max position).
        // if we just ignored the last event, we would be setting the scroll to 10px before the max position, when in
        // actual fact the user has exceeded the max scroll and thus scroll should be set to the max.

        if (touchOnly && !_isIOSUserAgent()) {
            return false;
        }

        if (direction === ScrollDirection.Vertical) {
            return this.shouldBlockVerticalScroll(scrollTo);
        }

        return this.shouldBlockHorizontalScroll(scrollTo);
    }

    private shouldBlockVerticalScroll(scrollTo: number): boolean {
        const clientHeight = _getInnerHeight(this.eBodyViewport);
        const { scrollHeight } = this.eBodyViewport;

        if (scrollTo < 0 || scrollTo + clientHeight > scrollHeight) {
            return true;
        }

        return false;
    }

    private shouldBlockHorizontalScroll(scrollTo: number): boolean {
        const clientWidth = this.centerRowsCtrl.getCenterWidth();
        const { scrollWidth } = this.centerRowsCtrl.getViewportElement();

        if (this.enableRtl && _isRtlNegativeScroll()) {
            if (scrollTo > 0) {
                return true;
            }
        } else if (scrollTo < 0) {
            return true;
        }

        if (Math.abs(scrollTo) + clientWidth > scrollWidth) {
            return true;
        }

        return false;
    }

    private redrawRowsAfterScroll(): void {
        this.fireScrollEvent(ScrollDirection.Vertical);
    }

    // this is to cater for AG-3274, where grid is removed from the dom and then inserted back in again.
    // (which happens with some implementations of tabbing). this can result in horizontal scroll getting
    // reset back to the left, however no scroll event is fired. so we need to get header to also scroll
    // back to the left to be kept in sync.
    // adding and removing the grid from the DOM both resets the scroll position and
    // triggers a resize event, so notify listeners if the scroll position has changed
    public checkScrollLeft(): void {
        if (this.scrollLeft !== this.centerRowsCtrl.getCenterViewportScrollLeft()) {
            this.onHScroll(VIEWPORT);
        }
    }

    public scrollGridIfNeeded(): boolean {
        const frameNeeded = this.scrollTop != this.nextScrollTop;

        if (frameNeeded) {
            this.scrollTop = this.nextScrollTop;
            this.redrawRowsAfterScroll();
        }

        return frameNeeded;
    }

    // called by scrollHorizontally method and alignedGridsService
    public setHorizontalScrollPosition(hScrollPosition: number, fromAlignedGridsService = false): void {
        const minScrollLeft = 0;
        const maxScrollLeft =
            this.centerRowsCtrl.getViewportElement().scrollWidth - this.centerRowsCtrl.getCenterWidth();

        // if this is call is coming from the alignedGridsSvc, we don't need to validate the
        // scroll, because it has already been validated by the grid firing the scroll event.
        if (!fromAlignedGridsService && this.shouldBlockScrollUpdate(ScrollDirection.Horizontal, hScrollPosition)) {
            if (this.enableRtl && _isRtlNegativeScroll()) {
                hScrollPosition = hScrollPosition > 0 ? 0 : maxScrollLeft;
            } else {
                hScrollPosition = Math.min(Math.max(hScrollPosition, minScrollLeft), maxScrollLeft);
            }
        }

        _setScrollLeft(this.centerRowsCtrl.getViewportElement(), Math.abs(hScrollPosition), this.enableRtl);
        // we need to manually do the event handling (rather than wait for the event)
        // for the alignedGridsSvc, as if we don't, the aligned grid service gets
        // notified async, and then it's 'consuming' flag doesn't get used right, and
        // we can end up with an infinite loop
        this.doHorizontalScroll(hScrollPosition);
    }

    public setVerticalScrollPosition(vScrollPosition: number): void {
        this.eBodyViewport.scrollTop = vScrollPosition;
    }

    public getVScrollPosition(): VerticalScrollPosition {
        this.lastScrollTop = this.eBodyViewport.scrollTop;
        this.lastOffsetHeight = this.eBodyViewport.offsetHeight;
        const result = {
            top: this.lastScrollTop,
            bottom: this.lastScrollTop + this.lastOffsetHeight,
        };
        return result;
    }

    /** Get an approximate scroll position that returns the last real value read.
     * This is useful for avoiding repeated DOM reads that force the browser to recalculate styles.
     * This can have big performance improvements but may not be 100% accurate so only use if this is acceptable.
     */
    public getApproximateVScollPosition(): VerticalScrollPosition {
        if (this.lastScrollTop >= 0 && this.lastOffsetHeight >= 0) {
            return {
                top: this.scrollTop,
                bottom: this.scrollTop + this.lastOffsetHeight,
            };
        }
        return this.getVScrollPosition();
    }

    public getHScrollPosition(): { left: number; right: number } {
        return this.centerRowsCtrl.getHScrollPosition();
    }

    public isHorizontalScrollShowing(): boolean {
        return this.centerRowsCtrl.isHorizontalScrollShowing();
    }

    // called by the headerRootComp and moveColumnController
    public scrollHorizontally(pixels: number): number {
        const oldScrollPosition = this.centerRowsCtrl.getViewportElement().scrollLeft;

        this.setHorizontalScrollPosition(oldScrollPosition + pixels);
        return this.centerRowsCtrl.getViewportElement().scrollLeft - oldScrollPosition;
    }

    // gets called by rowRenderer when new data loaded, as it will want to scroll to the top
    public scrollToTop(): void {
        this.eBodyViewport.scrollTop = 0;
    }

    // Valid values for position are bottom, middle and top
    public ensureNodeVisible<TData = any>(
        comparator: TData | IRowNode<TData> | ((row: IRowNode<TData>) => boolean),
        position: 'top' | 'bottom' | 'middle' | null = null
    ) {
        // look for the node index we want to display
        const rowCount = this.rowModel.getRowCount();
        let indexToSelect = -1;
        // go through all the nodes, find the one we want to show
        for (let i = 0; i < rowCount; i++) {
            const node = this.rowModel.getRow(i);
            if (typeof comparator === 'function') {
                // Have to assert type here, as type could be TData & Function
                const predicate = comparator as (row: IRowNode<TData>) => boolean;
                if (node && predicate(node)) {
                    indexToSelect = i;
                    break;
                }
            } else {
                // check object equality against node and data
                if (comparator === node || comparator === node!.data) {
                    indexToSelect = i;
                    break;
                }
            }
        }
        if (indexToSelect >= 0) {
            this.ensureIndexVisible(indexToSelect, position);
        }
    }

    // Valid values for position are bottom, middle and top
    // position should be {'top','middle','bottom', or undefined/null}.
    // if undefined/null, then the grid will to the minimal amount of scrolling,
    // eg if grid needs to scroll up, it scrolls until row is on top,
    //    if grid needs to scroll down, it scrolls until row is on bottom,
    //    if row is already in view, grid does not scroll
    public ensureIndexVisible(index: number, position?: 'top' | 'bottom' | 'middle' | null) {
        // if for print or auto height, everything is always visible
        if (_isDomLayout(this.gos, 'print')) {
            return;
        }

        const rowCount = this.rowModel.getRowCount();

        if (typeof index !== 'number' || index < 0 || index >= rowCount) {
            _warn(88, { index });
            return;
        }

        const isPaging = this.gos.get('pagination');
        const paginationPanelEnabled = isPaging && !this.gos.get('suppressPaginationPanel');

        this.beans.frameworkOverrides.wrapIncoming(() => {
            if (!paginationPanelEnabled) {
                this.pagination?.goToPageWithIndex(index);
            }

            const gridBodyCtrl = this.ctrlsSvc.getGridBodyCtrl();
            const stickyTopHeight = gridBodyCtrl.getStickyTopHeight();
            const stickyBottomHeight = gridBodyCtrl.getStickyBottomHeight();

            const rowNode = this.rowModel.getRow(index);
            let rowGotShiftedDuringOperation: boolean;

            do {
                const startingRowTop = rowNode!.rowTop;
                const startingRowHeight = rowNode!.rowHeight;

                const paginationOffset = this.pageBounds.getPixelOffset();
                const rowTopPixel = rowNode!.rowTop! - paginationOffset;
                const rowBottomPixel = rowTopPixel + rowNode!.rowHeight!;

                const scrollPosition = this.getVScrollPosition();
                const heightOffset = this.heightScaler.getDivStretchOffset();

                const vScrollTop = scrollPosition.top + heightOffset;
                const vScrollBottom = scrollPosition.bottom + heightOffset;

                const viewportHeight = vScrollBottom - vScrollTop;

                // work out the pixels for top, middle and bottom up front,
                // make the if/else below easier to read
                const pxTop = this.heightScaler.getScrollPositionForPixel(rowTopPixel);
                const pxBottom = this.heightScaler.getScrollPositionForPixel(rowBottomPixel - viewportHeight);
                // make sure if middle, the row is not outside the top of the grid
                const pxMiddle = Math.min((pxTop + pxBottom) / 2, rowTopPixel);

                const rowAboveViewport = vScrollTop + stickyTopHeight > rowTopPixel;
                const rowBelowViewport = vScrollBottom - stickyBottomHeight < rowBottomPixel;

                let newScrollPosition: number | null = null;

                if (position === 'top') {
                    newScrollPosition = pxTop;
                } else if (position === 'bottom') {
                    newScrollPosition = pxBottom;
                } else if (position === 'middle') {
                    newScrollPosition = pxMiddle;
                } else if (rowAboveViewport) {
                    // if row is before, scroll up with row at top
                    newScrollPosition = pxTop - stickyTopHeight;
                } else if (rowBelowViewport) {
                    // if row is after, scroll down with row at bottom
                    newScrollPosition = pxBottom + stickyBottomHeight;
                }

                if (newScrollPosition !== null) {
                    this.setVerticalScrollPosition(newScrollPosition);
                    this.rowRenderer.redraw({ afterScroll: true });
                }

                // the row can get shifted if during the rendering (during rowRenderer.redraw()),
                // the height of a row changes due to lazy calculation of row heights when using
                // colDef.autoHeight or gridOptions.getRowHeight.
                // if row was shifted, then the position we scrolled to is incorrect.
                rowGotShiftedDuringOperation =
                    startingRowTop !== rowNode!.rowTop || startingRowHeight !== rowNode!.rowHeight;
            } while (rowGotShiftedDuringOperation);

            // so when we return back to user, the cells have rendered
            this.animationFrameSvc?.flushAllFrames();
        });
    }

    public ensureColumnVisible(key: any, position: 'auto' | 'start' | 'middle' | 'end' = 'auto'): void {
        const column = this.colModel.getCol(key);

        if (!column) {
            return;
        }

        // calling ensureColumnVisible on a pinned column doesn't make sense
        if (column.isPinned()) {
            return;
        }

        // defensive
        if (!this.visibleCols.isColDisplayed(column)) {
            return;
        }

        const newHorizontalScroll: number | null = this.getPositionedHorizontalScroll(column, position);

        this.beans.frameworkOverrides.wrapIncoming(() => {
            if (newHorizontalScroll !== null) {
                this.centerRowsCtrl.setCenterViewportScrollLeft(newHorizontalScroll);
            }

            // this will happen anyway, as the move will cause a 'scroll' event on the body, however
            // it is possible that the ensureColumnVisible method is called from within AG Grid and
            // the caller will need to have the columns rendered to continue, which will be before
            // the event has been worked on (which is the case for cell navigation).
            this.centerRowsCtrl.onHorizontalViewportChanged();

            // so when we return back to user, the cells have rendered
            this.animationFrameSvc?.flushAllFrames();
        });
    }

    public setScrollPosition(top: number, left: number): void {
        this.beans.frameworkOverrides.wrapIncoming(() => {
            this.centerRowsCtrl.setCenterViewportScrollLeft(left);
            this.setVerticalScrollPosition(top);
            this.rowRenderer.redraw({ afterScroll: true });
            this.animationFrameSvc?.flushAllFrames();
        });
    }

    private getPositionedHorizontalScroll(
        column: AgColumn,
        position: 'auto' | 'start' | 'middle' | 'end'
    ): number | null {
        const { columnBeforeStart, columnAfterEnd } = this.isColumnOutsideViewport(column);

        const viewportTooSmallForColumn = this.centerRowsCtrl.getCenterWidth() < column.getActualWidth();
        const viewportWidth = this.centerRowsCtrl.getCenterWidth();

        const isRtl = this.enableRtl;

        let alignColToStart = (isRtl ? columnBeforeStart : columnAfterEnd) || viewportTooSmallForColumn;
        let alignColToEnd = isRtl ? columnAfterEnd : columnBeforeStart;

        if (position !== 'auto') {
            alignColToStart = position === 'start';
            alignColToEnd = position === 'end';
        }

        const isMiddle = position === 'middle';

        if (alignColToStart || alignColToEnd || isMiddle) {
            const { colLeft, colMiddle, colRight } = this.getColumnBounds(column);

            if (isMiddle) {
                return colMiddle - viewportWidth / 2;
            }

            if (alignColToStart) {
                return isRtl ? colRight : colLeft;
            }

            return isRtl ? colLeft - viewportWidth : colRight - viewportWidth;
        }

        return null;
    }

    private isColumnOutsideViewport(column: AgColumn): { columnBeforeStart: boolean; columnAfterEnd: boolean } {
        const { start: viewportStart, end: viewportEnd } = this.getViewportBounds();
        const { colLeft, colRight } = this.getColumnBounds(column);

        const isRtl = this.enableRtl;

        const columnBeforeStart = isRtl ? viewportStart > colRight : viewportEnd < colRight;
        const columnAfterEnd = isRtl ? viewportEnd < colLeft : viewportStart > colLeft;

        return { columnBeforeStart, columnAfterEnd };
    }

    private getColumnBounds(column: AgColumn): { colLeft: number; colMiddle: number; colRight: number } {
        const isRtl = this.enableRtl;
        const bodyWidth = this.visibleCols.getBodyContainerWidth();
        const colWidth = column.getActualWidth();
        const colLeft = column.getLeft()!;
        const multiplier = isRtl ? -1 : 1;

        const colLeftPixel = isRtl ? bodyWidth - colLeft : colLeft;
        const colRightPixel = colLeftPixel + colWidth * multiplier;
        const colMidPixel = colLeftPixel + (colWidth / 2) * multiplier;

        return { colLeft: colLeftPixel, colMiddle: colMidPixel, colRight: colRightPixel };
    }

    private getViewportBounds(): { start: number; end: number; width: number } {
        const viewportWidth = this.centerRowsCtrl.getCenterWidth();
        const scrollPosition = this.centerRowsCtrl.getCenterViewportScrollLeft();

        const viewportStartPixel = scrollPosition;
        const viewportEndPixel = viewportWidth + scrollPosition;

        return { start: viewportStartPixel, end: viewportEndPixel, width: viewportWidth };
    }
}
