import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import { _isVisible, _setFixedWidth } from '../utils/dom';
import type { ComponentSelector } from '../widgets/component';
import { AbstractFakeScrollComp } from './abstractFakeScrollComp';
import { SetHeightFeature } from './rowContainer/setHeightFeature';
import type { ScrollVisibleService } from './scrollVisibleService';

export class FakeVScrollComp extends AbstractFakeScrollComp {
    private ctrlsSvc: CtrlsService;
    private scrollVisibleSvc: ScrollVisibleService;

    public wireBeans(beans: BeanCollection) {
        this.ctrlsSvc = beans.ctrlsSvc;
        this.scrollVisibleSvc = beans.scrollVisibleSvc;
    }

    constructor() {
        super(
            /* html */ `<div class="ag-body-vertical-scroll" aria-hidden="true">
            <div class="ag-body-vertical-scroll-viewport" data-ref="eViewport">
                <div class="ag-body-vertical-scroll-container" data-ref="eContainer"></div>
            </div>
        </div>`,
            'vertical'
        );
    }

    public override postConstruct(): void {
        super.postConstruct();

        this.createManagedBean(new SetHeightFeature(this.eContainer));
        this.ctrlsSvc.register('fakeVScrollComp', this);

        this.addManagedEventListeners({ rowContainerHeightChanged: this.onRowContainerHeightChanged.bind(this) });
    }

    protected setScrollVisible(): void {
        const vScrollShowing = this.scrollVisibleSvc.isVerticalScrollShowing();
        const invisibleScrollbar = this.invisibleScrollbar;

        const scrollbarWidth = vScrollShowing ? this.scrollVisibleSvc.getScrollbarWidth() || 0 : 0;
        const adjustedScrollbarWidth = scrollbarWidth === 0 && invisibleScrollbar ? 16 : scrollbarWidth;

        this.addOrRemoveCssClass('ag-scrollbar-invisible', invisibleScrollbar);
        _setFixedWidth(this.getGui(), adjustedScrollbarWidth);
        _setFixedWidth(this.eViewport, adjustedScrollbarWidth);
        _setFixedWidth(this.eContainer, adjustedScrollbarWidth);
        this.setDisplayed(vScrollShowing, { skipAriaHidden: true });
    }

    private onRowContainerHeightChanged(): void {
        const { ctrlsSvc } = this;
        const gridBodyCtrl = ctrlsSvc.getGridBodyCtrl();
        const gridBodyViewportEl = gridBodyCtrl.getBodyViewportElement();

        const eViewportScrollTop = this.getScrollPosition();
        const gridBodyViewportScrollTop = gridBodyViewportEl.scrollTop;

        if (eViewportScrollTop != gridBodyViewportScrollTop) {
            this.setScrollPosition(gridBodyViewportScrollTop, true);
        }
    }

    public getScrollPosition(): number {
        return this.getViewportElement().scrollTop;
    }

    public setScrollPosition(value: number, force?: boolean): void {
        if (!force && !_isVisible(this.getViewportElement())) {
            this.attemptSettingScrollPosition(value);
        }
        this.getViewportElement().scrollTop = value;
    }
}

export const FakeVScrollSelector: ComponentSelector = {
    selector: 'AG-FAKE-VERTICAL-SCROLL',
    component: FakeVScrollComp,
};
