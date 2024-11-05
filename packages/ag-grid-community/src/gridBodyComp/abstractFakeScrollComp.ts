import { _requestAnimationFrame } from '../misc/animationFrameService';
import { _isIOSUserAgent, _isInvisibleScrollbar, _isMacOsUserAgent } from '../utils/browser';
import { _isVisible } from '../utils/dom';
import { _waitUntil } from '../utils/function';
import { Component, RefPlaceholder } from '../widgets/component';
import type { ScrollPartner } from './gridBodyScrollFeature';

export abstract class AbstractFakeScrollComp extends Component implements ScrollPartner {
    public readonly eViewport: HTMLElement = RefPlaceholder;
    protected readonly eContainer: HTMLElement = RefPlaceholder;

    protected invisibleScrollbar: boolean;
    protected hideTimeout: number = 0;

    protected abstract setScrollVisible(): void;
    public abstract getScrollPosition(): number;
    public abstract setScrollPosition(value: number): void;

    constructor(
        template: string,
        private readonly direction: 'horizontal' | 'vertical'
    ) {
        super();
        this.setTemplate(template);
    }

    public postConstruct(): void {
        this.addManagedEventListeners({
            scrollVisibilityChanged: this.onScrollVisibilityChanged.bind(this),
        });
        this.onScrollVisibilityChanged();
        this.addOrRemoveCssClass('ag-apple-scrollbar', _isMacOsUserAgent() || _isIOSUserAgent());
    }

    public override destroy(): void {
        super.destroy();

        window.clearTimeout(this.hideTimeout);
    }

    protected initialiseInvisibleScrollbar(): void {
        if (this.invisibleScrollbar !== undefined) {
            return;
        }

        this.invisibleScrollbar = _isInvisibleScrollbar();

        if (this.invisibleScrollbar) {
            this.hideAndShowInvisibleScrollAsNeeded();
            this.addActiveListenerToggles();
        }
    }

    protected addActiveListenerToggles(): void {
        const eGui = this.getGui();
        const onActivate = () => this.addOrRemoveCssClass('ag-scrollbar-active', true);
        const onDeactivate = () => this.addOrRemoveCssClass('ag-scrollbar-active', false);
        this.addManagedListeners(eGui, {
            mouseenter: onActivate,
            mousedown: onActivate,
            touchstart: onActivate,
            mouseleave: onDeactivate,
            touchend: onDeactivate,
        });
    }

    protected onScrollVisibilityChanged(): void {
        // initialiseInvisibleScrollbar should only be called once, but the reason
        // this can't be inside `setComp` or `postConstruct` is the DOM might not
        // be ready, so we call it until eventually, it gets calculated.
        if (this.invisibleScrollbar === undefined) {
            this.initialiseInvisibleScrollbar();
        }

        _requestAnimationFrame(this.beans, () => this.setScrollVisible());
    }

    protected hideAndShowInvisibleScrollAsNeeded(): void {
        this.addManagedEventListeners({
            bodyScroll: (params) => {
                if (params.direction === this.direction) {
                    if (this.hideTimeout) {
                        window.clearTimeout(this.hideTimeout);
                        this.hideTimeout = 0;
                    }
                    this.addOrRemoveCssClass('ag-scrollbar-scrolling', true);
                }
            },
            bodyScrollEnd: () => {
                this.hideTimeout = window.setTimeout(() => {
                    this.addOrRemoveCssClass('ag-scrollbar-scrolling', false);
                    this.hideTimeout = 0;
                }, 400);
            },
        });
    }

    protected attemptSettingScrollPosition(value: number) {
        const viewport = this.eViewport;
        _waitUntil(
            () => _isVisible(viewport),
            () => this.setScrollPosition(value),
            100
        );
    }

    public onScrollCallback(fn: () => void): void {
        this.addManagedElementListeners(this.eViewport, { scroll: fn });
    }
}
