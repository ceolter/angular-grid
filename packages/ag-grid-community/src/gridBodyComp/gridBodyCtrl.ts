import type { ColumnModel } from '../columns/columnModel';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { RowDragService } from '../dragAndDrop/rowDragService';
import type { EditService } from '../edit/editService';
import type { Environment } from '../environment';
import type { FilterManager } from '../filter/filterManager';
import { _isAnimateRows, _isDomLayout } from '../gridOptionsUtils';
import type { IContextMenuService } from '../interfaces/iContextMenu';
import type { IRowModel } from '../interfaces/iRowModel';
import { _requestAnimationFrame } from '../misc/animationFrameService';
import type { PinnedRowModel } from '../pinnedRowModel/pinnedRowModel';
import type { RowContainerHeightService } from '../rendering/rowContainerHeightService';
import type { LayoutView } from '../styling/layoutFeature';
import { LayoutFeature } from '../styling/layoutFeature';
import { _isIOSUserAgent, _isInvisibleScrollbar } from '../utils/browser';
import { _isElementChildOfClass, _isVerticalScrollShowing } from '../utils/dom';
import type { PopupService } from '../widgets/popupService';
import type { LongTapEvent } from '../widgets/touchListener';
import { TouchListener } from '../widgets/touchListener';
import { GridBodyScrollFeature } from './gridBodyScrollFeature';
import type { MouseEventService } from './mouseEventService';
import { _getRowContainerOptions } from './rowContainer/rowContainerCtrl';
import type { ScrollVisibleService } from './scrollVisibleService';

export type RowAnimationCssClasses = 'ag-row-animation' | 'ag-row-no-animation';

export const CSS_CLASS_FORCE_VERTICAL_SCROLL = 'ag-force-vertical-scroll';

const CSS_CLASS_CELL_SELECTABLE = 'ag-selectable';
const CSS_CLASS_COLUMN_MOVING = 'ag-column-moving';

export interface IGridBodyComp extends LayoutView {
    setColumnMovingCss(cssClass: string, on: boolean): void;
    setCellSelectableCss(cssClass: string | null, on: boolean): void;
    setTopHeight(height: number): void;
    setTopDisplay(display: string): void;
    setBottomHeight(height: number): void;
    setBottomDisplay(display: string): void;
    setStickyTopHeight(height: string): void;
    setStickyTopTop(offsetTop: string): void;
    setStickyTopWidth(width: string): void;
    setStickyBottomHeight(height: string): void;
    setStickyBottomBottom(offsetBottom: string): void;
    setStickyBottomWidth(width: string): void;
    setColumnCount(count: number): void;
    setRowCount(count: number): void;
    setRowAnimationCssOnBodyViewport(cssClass: RowAnimationCssClasses, animate: boolean): void;
    setAlwaysVerticalScrollClass(cssClass: string | null, on: boolean): void;
    setPinnedTopBottomOverflowY(overflow: 'scroll' | 'hidden'): void;
    registerBodyViewportResizeListener(listener: () => void): void;
    setBodyViewportWidth(width: string): void;
}

export class GridBodyCtrl extends BeanStub {
    private rowContainerHeight: RowContainerHeightService;
    private ctrlsSvc: CtrlsService;
    private colModel: ColumnModel;
    private scrollVisibleSvc: ScrollVisibleService;
    private contextMenuSvc?: IContextMenuService;
    private rowDragSvc?: RowDragService;
    private pinnedRowModel?: PinnedRowModel;
    private editSvc?: EditService;
    private popupSvc?: PopupService;
    private mouseEventSvc: MouseEventService;
    private rowModel: IRowModel;
    private filterManager?: FilterManager;
    private environment: Environment;

    public wireBeans(beans: BeanCollection): void {
        this.rowContainerHeight = beans.rowContainerHeight;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.colModel = beans.colModel;
        this.scrollVisibleSvc = beans.scrollVisibleSvc;
        this.contextMenuSvc = beans.contextMenuSvc;
        this.rowDragSvc = beans.rowDragSvc;
        this.pinnedRowModel = beans.pinnedRowModel;
        this.editSvc = beans.editSvc;
        this.popupSvc = beans.popupSvc;
        this.mouseEventSvc = beans.mouseEventSvc;
        this.rowModel = beans.rowModel;
        this.filterManager = beans.filterManager;
        this.environment = beans.environment;
    }

    private comp: IGridBodyComp;
    private eGridBody: HTMLElement;
    private eBodyViewport: HTMLElement;
    private eTop: HTMLElement;
    private eBottom: HTMLElement;
    private eStickyTop: HTMLElement;

    private eCenterColsViewport: HTMLElement;
    private eFullWidthContainer: HTMLElement;
    private eStickyTopFullWidthContainer: HTMLElement;
    private eStickyBottomFullWidthContainer: HTMLElement;

    private stickyTopHeight: number = 0;
    private eStickyBottom: HTMLElement;
    private stickyBottomHeight: number = 0;

    private bodyScrollFeature: GridBodyScrollFeature;

    public getScrollFeature(): GridBodyScrollFeature {
        return this.bodyScrollFeature;
    }

    public getBodyViewportElement(): HTMLElement {
        return this.eBodyViewport;
    }

    public setComp(
        comp: IGridBodyComp,
        eGridBody: HTMLElement,
        eBodyViewport: HTMLElement,
        eTop: HTMLElement,
        eBottom: HTMLElement,
        eStickyTop: HTMLElement,
        eStickyBottom: HTMLElement
    ): void {
        this.comp = comp;
        this.eGridBody = eGridBody;
        this.eBodyViewport = eBodyViewport;
        this.eTop = eTop;
        this.eBottom = eBottom;
        this.eStickyTop = eStickyTop;
        this.eStickyBottom = eStickyBottom;

        this.eCenterColsViewport = eBodyViewport.querySelector(
            `.${_getRowContainerOptions('center').viewport}`
        ) as HTMLElement;
        this.eFullWidthContainer = eBodyViewport.querySelector(
            `.${_getRowContainerOptions('fullWidth').container}`
        ) as HTMLElement;
        this.eStickyTopFullWidthContainer = eStickyTop.querySelector(
            `.${_getRowContainerOptions('stickyTopFullWidth').container}`
        ) as HTMLElement;
        this.eStickyBottomFullWidthContainer = eStickyBottom.querySelector(
            `.${_getRowContainerOptions('stickyBottomFullWidth').container}`
        ) as HTMLElement;

        this.setCellTextSelection(this.gos.get('enableCellTextSelection'));
        this.addManagedPropertyListener('enableCellTextSelection', (props) =>
            this.setCellTextSelection(props.currentValue)
        );

        this.createManagedBean(new LayoutFeature(this.comp));
        this.bodyScrollFeature = this.createManagedBean(new GridBodyScrollFeature(this.eBodyViewport));
        this.addRowDragListener();

        this.setupRowAnimationCssClass();

        this.addEventListeners();
        this.addFocusListeners([eTop, eBodyViewport, eBottom, eStickyTop, eStickyBottom]);
        this.onGridColumnsChanged();
        this.addBodyViewportListener();
        this.setFloatingHeights();
        this.disableBrowserDragging();
        this.addStopEditingWhenGridLosesFocus();
        this.updateScrollingClasses();

        this.filterManager?.setupAdvancedFilterHeaderComp(eTop);

        this.ctrlsSvc.register('gridBodyCtrl', this);
    }

    public getComp(): IGridBodyComp {
        return this.comp;
    }

    private addEventListeners(): void {
        const setFloatingHeights = this.setFloatingHeights.bind(this);
        this.addManagedEventListeners({
            gridColumnsChanged: this.onGridColumnsChanged.bind(this),
            scrollVisibilityChanged: this.onScrollVisibilityChanged.bind(this),
            scrollGapChanged: this.onScrollGapChanged.bind(this),
            pinnedRowDataChanged: setFloatingHeights,
            pinnedHeightChanged: setFloatingHeights,
            headerHeightChanged: this.onHeaderHeightChanged.bind(this),
        });
    }

    private addFocusListeners(elements: HTMLElement[]): void {
        elements.forEach((element) => {
            this.addManagedElementListeners(element, {
                focusin: (e: FocusEvent) => {
                    const { target } = e;
                    // element being focused is nested?
                    const isFocusedElementNested = _isElementChildOfClass(target as HTMLElement, 'ag-root', element);

                    element.classList.toggle('ag-has-focus', !isFocusedElementNested);
                },
                focusout: (e: FocusEvent) => {
                    const { target, relatedTarget } = e;
                    const gridContainRelatedTarget = element.contains(relatedTarget as HTMLElement);
                    const isNestedRelatedTarget = _isElementChildOfClass(
                        relatedTarget as HTMLElement,
                        'ag-root',
                        element
                    );
                    const isNestedTarget = _isElementChildOfClass(target as HTMLElement, 'ag-root', element);

                    // element losing focus belongs to a nested grid,
                    // it should not be handled here.
                    if (isNestedTarget) {
                        return;
                    }

                    // the grid does not contain, or the focus element is within
                    // a nested grid
                    if (!gridContainRelatedTarget || isNestedRelatedTarget) {
                        element.classList.remove('ag-has-focus');
                    }
                },
            });
        });
    }

    // used by ColumnAnimationService
    public setColumnMovingCss(moving: boolean): void {
        this.comp.setColumnMovingCss(CSS_CLASS_COLUMN_MOVING, moving);
    }

    public setCellTextSelection(selectable: boolean = false): void {
        this.comp.setCellSelectableCss(CSS_CLASS_CELL_SELECTABLE, selectable);
    }

    private onScrollVisibilityChanged(): void {
        const visible = this.scrollVisibleSvc.isVerticalScrollShowing();
        this.setVerticalScrollPaddingVisible(visible);
        this.setStickyWidth(visible);
        this.setStickyBottomOffsetBottom();

        const scrollbarWidth = visible ? this.scrollVisibleSvc.getScrollbarWidth() || 0 : 0;
        const pad = _isInvisibleScrollbar() ? 16 : 0;
        const width = `calc(100% + ${scrollbarWidth + pad}px)`;

        _requestAnimationFrame(this.gos, () => this.comp.setBodyViewportWidth(width));

        this.updateScrollingClasses();
    }

    private onScrollGapChanged(): void {
        this.updateScrollingClasses();
    }

    private updateScrollingClasses(): void {
        this.eGridBody.classList.toggle(
            'ag-body-vertical-content-no-gap',
            !this.scrollVisibleSvc.hasVerticalScrollGap()
        );
        this.eGridBody.classList.toggle(
            'ag-body-horizontal-content-no-gap',
            !this.scrollVisibleSvc.hasHorizontalScrollGap()
        );
    }

    private onGridColumnsChanged(): void {
        const columns = this.colModel.getCols();
        this.comp.setColumnCount(columns.length);
    }

    // if we do not do this, then the user can select a pic in the grid (eg an image in a custom cell renderer)
    // and then that will start the browser native drag n' drop, which messes up with our own drag and drop.
    private disableBrowserDragging(): void {
        this.addManagedElementListeners(this.eGridBody, {
            dragstart: (event: DragEvent) => {
                if (event.target instanceof HTMLImageElement) {
                    event.preventDefault();
                    return false;
                }
            },
        });
    }

    private addStopEditingWhenGridLosesFocus(): void {
        this.editSvc?.addStopEditingWhenGridLosesFocus([
            this.eBodyViewport,
            this.eBottom,
            this.eTop,
            this.eStickyTop,
            this.eStickyBottom,
        ]);
    }

    public updateRowCount(): void {
        const headerCount =
            (this.ctrlsSvc.getHeaderRowContainerCtrl()?.getRowCount() ?? 0) +
            (this.filterManager?.getHeaderRowCount() ?? 0);

        const rowCount = this.rowModel.isLastRowIndexKnown() ? this.rowModel.getRowCount() : -1;
        const total = rowCount === -1 ? -1 : headerCount + rowCount;

        this.comp.setRowCount(total);
    }

    public registerBodyViewportResizeListener(listener: () => void): void {
        this.comp.registerBodyViewportResizeListener(listener);
    }

    public setVerticalScrollPaddingVisible(visible: boolean): void {
        const overflowY = visible ? 'scroll' : 'hidden';
        this.comp.setPinnedTopBottomOverflowY(overflowY);
    }

    public isVerticalScrollShowing(): boolean {
        const show = this.gos.get('alwaysShowVerticalScroll');
        const cssClass = show ? CSS_CLASS_FORCE_VERTICAL_SCROLL : null;
        const allowVerticalScroll = _isDomLayout(this.gos, 'normal');
        this.comp.setAlwaysVerticalScrollClass(cssClass, show);
        return show || (allowVerticalScroll && _isVerticalScrollShowing(this.eBodyViewport));
    }

    private setupRowAnimationCssClass(): void {
        let initialSizeMeasurementComplete = this.environment.hasMeasuredSizes();

        const updateAnimationClass = () => {
            // we don't want to use row animation if scaling, as rows jump strangely as you scroll,
            // when scaling and doing row animation.
            const animateRows =
                initialSizeMeasurementComplete && _isAnimateRows(this.gos) && !this.rowContainerHeight.isStretching();
            const animateRowsCssClass: RowAnimationCssClasses = animateRows
                ? 'ag-row-animation'
                : 'ag-row-no-animation';
            this.comp.setRowAnimationCssOnBodyViewport(animateRowsCssClass, animateRows);
        };

        updateAnimationClass();

        this.addManagedEventListeners({ heightScaleChanged: updateAnimationClass });
        this.addManagedPropertyListener('animateRows', updateAnimationClass);

        this.addManagedEventListeners({
            gridStylesChanged: () => {
                if (!initialSizeMeasurementComplete && this.environment.hasMeasuredSizes()) {
                    initialSizeMeasurementComplete = true;
                    updateAnimationClass();
                }
            },
        });
    }

    public getGridBodyElement(): HTMLElement {
        return this.eGridBody;
    }

    private addBodyViewportListener(): void {
        // we want to listen for clicks directly on the eBodyViewport, so the user has a way of showing
        // the context menu if no rows or columns are displayed, or user simply clicks outside of a cell
        const listener = this.onBodyViewportContextMenu.bind(this);
        this.addManagedElementListeners(this.eBodyViewport, { contextmenu: listener });
        this.mockContextMenuForIPad(listener);

        this.addManagedElementListeners(this.eBodyViewport, { wheel: this.onBodyViewportWheel.bind(this) });
        this.addManagedElementListeners(this.eStickyTop, { wheel: this.onStickyWheel.bind(this) });
        this.addManagedElementListeners(this.eStickyBottom, { wheel: this.onStickyWheel.bind(this) });

        // allow mouseWheel on the Full Width Container to Scroll the Viewport
        this.addFullWidthContainerWheelListener();
    }

    private addFullWidthContainerWheelListener(): void {
        this.addManagedElementListeners(this.eFullWidthContainer, {
            wheel: (e: WheelEvent) => this.onFullWidthContainerWheel(e),
        });
    }

    private onFullWidthContainerWheel(e: WheelEvent): void {
        const { deltaX, deltaY, shiftKey } = e;
        const isHorizontalScroll = shiftKey || Math.abs(deltaX) > Math.abs(deltaY);

        if (isHorizontalScroll && this.mouseEventSvc.isEventFromThisGrid(e)) {
            this.scrollGridBodyToMatchEvent(e);
        }
    }

    private onStickyWheel(e: WheelEvent): void {
        const { deltaX, deltaY, shiftKey } = e;

        const isHorizontalScroll = shiftKey || Math.abs(deltaX) > Math.abs(deltaY);

        // we test for shift key because some devices will
        // only change deltaY even when scrolling horizontally
        const target = e.target as HTMLElement;
        if (!isHorizontalScroll) {
            e.preventDefault();
            this.scrollVertically(deltaY);
        } else if (
            this.eStickyTopFullWidthContainer.contains(target) ||
            this.eStickyBottomFullWidthContainer.contains(target)
        ) {
            this.scrollGridBodyToMatchEvent(e);
        }
    }

    private scrollGridBodyToMatchEvent(e: WheelEvent): void {
        const { deltaX, deltaY } = e;
        e.preventDefault();
        // if it is a horizontal scroll and deltaX is zero,
        // it means the OS has flipped the axis and it's using deltaY
        this.eCenterColsViewport.scrollBy({ left: deltaX || deltaY });
    }

    private onBodyViewportContextMenu(mouseEvent?: MouseEvent, touch?: Touch, touchEvent?: TouchEvent): void {
        if (!mouseEvent && !touchEvent) {
            return;
        }

        if (this.gos.get('preventDefaultOnContextMenu')) {
            const event = (mouseEvent || touchEvent)!;
            event.preventDefault();
        }

        const { target } = (mouseEvent || touch)!;

        if (target === this.eBodyViewport || target === this.ctrlsSvc.get('center').getViewportElement()) {
            // show it
            this.contextMenuSvc?.showContextMenu({
                mouseEvent,
                touchEvent: touchEvent!,
                value: null,
                anchorToElement: this.eGridBody,
            });
        }
    }

    private mockContextMenuForIPad(
        listener: (mouseListener?: MouseEvent, touch?: Touch, touchEvent?: TouchEvent) => void
    ): void {
        // we do NOT want this when not in iPad
        if (!_isIOSUserAgent()) {
            return;
        }

        const touchListener = new TouchListener(this.eBodyViewport);
        const longTapListener = (event: LongTapEvent) => {
            listener(undefined, event.touchStart, event.touchEvent);
        };

        this.addManagedListeners(touchListener, { longTap: longTapListener });
        this.addDestroyFunc(() => touchListener.destroy());
    }

    private onBodyViewportWheel(e: WheelEvent): void {
        if (!this.gos.get('suppressScrollWhenPopupsAreOpen')) {
            return;
        }

        if (this.popupSvc?.hasAnchoredPopup()) {
            e.preventDefault();
        }
    }

    public getGui(): HTMLElement {
        return this.eGridBody;
    }

    // called by rowDragFeature
    public scrollVertically(pixels: number): number {
        const oldScrollPosition = this.eBodyViewport.scrollTop;

        this.bodyScrollFeature.setVerticalScrollPosition(oldScrollPosition + pixels);
        return this.eBodyViewport.scrollTop - oldScrollPosition;
    }

    private addRowDragListener(): void {
        this.rowDragSvc?.setupRowDrag(this.eBodyViewport, this);
    }

    private setFloatingHeights(): void {
        const { pinnedRowModel } = this;

        const floatingTopHeight = pinnedRowModel?.getPinnedTopTotalHeight() ?? 0;
        const floatingBottomHeight = pinnedRowModel?.getPinnedBottomTotalHeight() ?? 0;
        this.comp.setTopHeight(floatingTopHeight);
        this.comp.setBottomHeight(floatingBottomHeight);
        this.comp.setTopDisplay(floatingTopHeight ? 'inherit' : 'none');
        this.comp.setBottomDisplay(floatingBottomHeight ? 'inherit' : 'none');
        this.setStickyTopOffsetTop();
        this.setStickyBottomOffsetBottom();
    }

    public setStickyTopHeight(height: number = 0): void {
        // console.log('setting sticky top height ' + height);
        this.comp.setStickyTopHeight(`${height}px`);
        this.stickyTopHeight = height;
    }

    public getStickyTopHeight(): number {
        return this.stickyTopHeight;
    }

    public setStickyBottomHeight(height: number = 0): void {
        this.comp.setStickyBottomHeight(`${height}px`);
        this.stickyBottomHeight = height;
    }

    public getStickyBottomHeight(): number {
        return this.stickyBottomHeight;
    }

    private setStickyWidth(vScrollVisible: boolean) {
        if (!vScrollVisible) {
            this.comp.setStickyTopWidth('100%');
            this.comp.setStickyBottomWidth('100%');
        } else {
            const scrollbarWidth = this.scrollVisibleSvc.getScrollbarWidth();
            this.comp.setStickyTopWidth(`calc(100% - ${scrollbarWidth}px)`);
            this.comp.setStickyBottomWidth(`calc(100% - ${scrollbarWidth}px)`);
        }
    }

    private onHeaderHeightChanged(): void {
        this.setStickyTopOffsetTop();
    }

    private setStickyTopOffsetTop(): void {
        const headerCtrl = this.ctrlsSvc.get('gridHeaderCtrl');
        const headerHeight = headerCtrl.getHeaderHeight() + (this.filterManager?.getHeaderHeight() ?? 0);
        const pinnedTopHeight = this.pinnedRowModel?.getPinnedTopTotalHeight() ?? 0;

        let height = 0;

        if (headerHeight > 0) {
            height += headerHeight;
        }
        if (pinnedTopHeight > 0) {
            height += pinnedTopHeight;
        }
        if (height > 0) {
            height += 1;
        }

        this.comp.setStickyTopTop(`${height}px`);
    }

    private setStickyBottomOffsetBottom(): void {
        const pinnedBottomHeight = this.pinnedRowModel?.getPinnedBottomTotalHeight() ?? 0;
        const hScrollShowing = this.scrollVisibleSvc.isHorizontalScrollShowing();
        const scrollbarWidth = hScrollShowing ? this.scrollVisibleSvc.getScrollbarWidth() || 0 : 0;
        const height = pinnedBottomHeight + scrollbarWidth;

        this.comp.setStickyBottomBottom(`${height}px`);
    }

    // + rangeService
    public addScrollEventListener(listener: () => void): void {
        this.eBodyViewport.addEventListener('scroll', listener, { passive: true });
    }

    // + focusService
    public removeScrollEventListener(listener: () => void): void {
        this.eBodyViewport.removeEventListener('scroll', listener);
    }
}
