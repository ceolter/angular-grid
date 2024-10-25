import type { VisibleColsService } from '../columns/visibleColsService';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { PinnedRowModel } from '../pinnedRowModel/pinnedRowModel';
import { _getScrollLeft, _isVisible, _setFixedHeight, _setFixedWidth, _setScrollLeft } from '../utils/dom';
import type { ComponentSelector } from '../widgets/component';
import { RefPlaceholder } from '../widgets/component';
import { AbstractFakeScrollComp } from './abstractFakeScrollComp';
import { CenterWidthFeature } from './centerWidthFeature';
import type { ScrollVisibleService } from './scrollVisibleService';

export class FakeHScrollComp extends AbstractFakeScrollComp {
    private visibleCols: VisibleColsService;
    private pinnedRowModel?: PinnedRowModel;
    private ctrlsSvc: CtrlsService;
    private scrollVisibleSvc: ScrollVisibleService;

    public wireBeans(beans: BeanCollection): void {
        this.visibleCols = beans.visibleCols;
        this.pinnedRowModel = beans.pinnedRowModel;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.scrollVisibleSvc = beans.scrollVisibleSvc;
    }

    private readonly eLeftSpacer: HTMLElement = RefPlaceholder;
    private readonly eRightSpacer: HTMLElement = RefPlaceholder;

    private enableRtl: boolean;

    constructor() {
        super(
            /* html */ `<div class="ag-body-horizontal-scroll" aria-hidden="true">
            <div class="ag-horizontal-left-spacer" data-ref="eLeftSpacer"></div>
            <div class="ag-body-horizontal-scroll-viewport" data-ref="eViewport">
                <div class="ag-body-horizontal-scroll-container" data-ref="eContainer"></div>
            </div>
            <div class="ag-horizontal-right-spacer" data-ref="eRightSpacer"></div>
        </div>`,
            'horizontal'
        );
    }

    public override postConstruct(): void {
        super.postConstruct();

        // When doing printing, this changes whether cols are pinned or not
        const spacerWidthsListener = this.setFakeHScrollSpacerWidths.bind(this);

        this.addManagedEventListeners({
            displayedColumnsChanged: spacerWidthsListener,
            displayedColumnsWidthChanged: spacerWidthsListener,
            pinnedRowDataChanged: this.onPinnedRowDataChanged.bind(this),
        });

        this.addManagedPropertyListener('domLayout', spacerWidthsListener);

        this.ctrlsSvc.register('fakeHScrollComp', this);
        this.createManagedBean(new CenterWidthFeature((width) => (this.eContainer.style.width = `${width}px`)));

        this.addManagedPropertyListeners(['suppressHorizontalScroll'], this.onScrollVisibilityChanged.bind(this));
    }

    override destroy(): void {
        window.clearTimeout(this.setScrollVisibleDebounce);
        super.destroy();
    }

    protected override initialiseInvisibleScrollbar(): void {
        if (this.invisibleScrollbar !== undefined) {
            return;
        }

        this.enableRtl = this.gos.get('enableRtl');
        super.initialiseInvisibleScrollbar();

        if (this.invisibleScrollbar) {
            this.refreshCompBottom();
        }
    }

    private onPinnedRowDataChanged(): void {
        this.refreshCompBottom();
    }

    private refreshCompBottom(): void {
        if (!this.invisibleScrollbar) {
            return;
        }
        const bottomPinnedHeight = this.pinnedRowModel?.getPinnedBottomTotalHeight() ?? 0;

        this.getGui().style.bottom = `${bottomPinnedHeight}px`;
    }

    protected override onScrollVisibilityChanged(): void {
        super.onScrollVisibilityChanged();
        this.setFakeHScrollSpacerWidths();
    }

    private setFakeHScrollSpacerWidths(): void {
        const vScrollShowing = this.scrollVisibleSvc.isVerticalScrollShowing();

        // we pad the right based on a) if cols are pinned to the right and
        // b) if v scroll is showing on the right (normal position of scroll)
        let rightSpacing = this.visibleCols.getDisplayedColumnsRightWidth();
        const scrollOnRight = !this.enableRtl && vScrollShowing;
        const scrollbarWidth = this.scrollVisibleSvc.getScrollbarWidth();

        if (scrollOnRight) {
            rightSpacing += scrollbarWidth;
        }
        _setFixedWidth(this.eRightSpacer, rightSpacing);
        this.eRightSpacer.classList.toggle('ag-scroller-corner', rightSpacing <= scrollbarWidth);

        // we pad the left based on a) if cols are pinned to the left and
        // b) if v scroll is showing on the left (happens in LTR layout only)
        let leftSpacing = this.visibleCols.getColsLeftWidth();
        const scrollOnLeft = this.enableRtl && vScrollShowing;

        if (scrollOnLeft) {
            leftSpacing += scrollbarWidth;
        }

        _setFixedWidth(this.eLeftSpacer, leftSpacing);
        this.eLeftSpacer.classList.toggle('ag-scroller-corner', leftSpacing <= scrollbarWidth);
    }

    private setScrollVisibleDebounce = 0;

    protected setScrollVisible(): void {
        const hScrollShowing = this.scrollVisibleSvc.isHorizontalScrollShowing();
        const invisibleScrollbar = this.invisibleScrollbar;
        const isSuppressHorizontalScroll = this.gos.get('suppressHorizontalScroll');
        const scrollbarWidth = hScrollShowing ? this.scrollVisibleSvc.getScrollbarWidth() || 0 : 0;
        const adjustedScrollbarWidth = scrollbarWidth === 0 && invisibleScrollbar ? 16 : scrollbarWidth;
        const scrollContainerSize = !isSuppressHorizontalScroll ? adjustedScrollbarWidth : 0;

        // Avoid scrollbars flickering on as we resize the grid. Before showing
        // a scrollbar, give a little time for the grid to resize, after which a
        // scrollbar may no longer be required
        const apply = () => {
            this.setScrollVisibleDebounce = 0;
            this.addOrRemoveCssClass('ag-scrollbar-invisible', invisibleScrollbar);
            _setFixedHeight(this.getGui(), scrollContainerSize);
            _setFixedHeight(this.eViewport, scrollContainerSize);
            _setFixedHeight(this.eContainer, scrollContainerSize);
            this.setDisplayed(hScrollShowing, { skipAriaHidden: true });
        };
        window.clearTimeout(this.setScrollVisibleDebounce);
        if (!hScrollShowing) {
            apply();
        } else {
            this.setScrollVisibleDebounce = window.setTimeout(apply, 100);
        }
    }

    public getScrollPosition(): number {
        return _getScrollLeft(this.getViewportElement(), this.enableRtl);
    }

    public setScrollPosition(value: number): void {
        if (!_isVisible(this.getViewportElement())) {
            this.attemptSettingScrollPosition(value);
        }
        _setScrollLeft(this.getViewportElement(), value, this.enableRtl);
    }
}

export const FakeHScrollSelector: ComponentSelector = {
    selector: 'AG-FAKE-HORIZONTAL-SCROLL',
    component: FakeHScrollComp,
};
