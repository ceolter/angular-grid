import { KeyCode } from '../../constants/keyCode';
import type { GridOptions } from '../../entities/gridOptions';
import { _getActiveDomElement, _isNothingFocused } from '../../gridOptionsUtils';
import type { LayoutView, UpdateLayoutClassesParams } from '../../styling/layoutFeature';
import { LayoutCssClasses, LayoutFeature } from '../../styling/layoutFeature';
import { _last } from '../../utils/array';
import { _clearElement } from '../../utils/dom';
import { _isStopPropagationForAgGrid } from '../../utils/event';
import { _findNextFocusableElement, _focusInto, _focusNextGridCoreContainer } from '../../utils/focus';
import type { AgPromise } from '../../utils/promise';
import type { ComponentSelector } from '../../widgets/component';
import { Component, RefPlaceholder } from '../../widgets/component';
import type { IOverlayComp } from './overlayComponent';
import { overlayWrapperComponentCSS } from './overlayWrapperComponent.css-GENERATED';

export class OverlayWrapperComponent extends Component implements LayoutView {
    private readonly eOverlayWrapper: HTMLElement = RefPlaceholder;

    private activePromise: AgPromise<IOverlayComp> | null = null;
    private activeOverlay: IOverlayComp | null = null;
    private updateListenerDestroyFunc: (() => null) | null = null;
    private activeCssClass: string | null = null;
    private elToFocusAfter: HTMLElement | null = null;

    constructor() {
        // wrapping in outer div, and wrapper, is needed to center the loading icon
        super(/* html */ `
            <div class="ag-overlay" role="presentation">
                <div class="ag-overlay-panel" role="presentation">
                    <div class="ag-overlay-wrapper" data-ref="eOverlayWrapper" role="presentation"></div>
                </div>
            </div>`);
        this.registerCSS(overlayWrapperComponentCSS);
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (e.key !== KeyCode.TAB || e.defaultPrevented || _isStopPropagationForAgGrid(e)) {
            return;
        }

        const beans = this.beans;

        const nextEl = _findNextFocusableElement(beans, this.eOverlayWrapper, false, e.shiftKey);
        if (nextEl) {
            return;
        }

        let isFocused = false;
        if (e.shiftKey) {
            isFocused = beans.focusSvc.focusGridView(_last(beans.visibleCols.allCols), true, false);
        } else {
            isFocused = _focusNextGridCoreContainer(beans, false);
        }

        if (isFocused) {
            e.preventDefault();
        }
    }

    public updateLayoutClasses(cssClass: string, params: UpdateLayoutClassesParams): void {
        const overlayWrapperClassList = this.eOverlayWrapper.classList;
        const { AUTO_HEIGHT, NORMAL, PRINT } = LayoutCssClasses;
        overlayWrapperClassList.toggle(AUTO_HEIGHT, params.autoHeight);
        overlayWrapperClassList.toggle(NORMAL, params.normal);
        overlayWrapperClassList.toggle(PRINT, params.print);
    }

    public postConstruct(): void {
        this.createManagedBean(new LayoutFeature(this));
        this.setDisplayed(false, { skipAriaHidden: true });

        this.beans.overlays!.setOverlayWrapperComp(this);
        this.addManagedElementListeners(this.getFocusableElement(), { keydown: this.handleKeyDown.bind(this) });
    }

    private setWrapperTypeClass(overlayWrapperCssClass: string): void {
        const overlayWrapperClassList = this.eOverlayWrapper.classList;
        if (this.activeCssClass) {
            overlayWrapperClassList.toggle(this.activeCssClass, false);
        }
        this.activeCssClass = overlayWrapperCssClass;
        overlayWrapperClassList.toggle(overlayWrapperCssClass, true);
    }

    public showOverlay(
        overlayComponentPromise: AgPromise<IOverlayComp> | null,
        overlayWrapperCssClass: string,
        exclusive: boolean,
        gridOption?: keyof GridOptions
    ): void {
        this.setWrapperTypeClass(overlayWrapperCssClass);
        this.destroyActiveOverlay();

        this.elToFocusAfter = null;
        this.activePromise = overlayComponentPromise;

        if (!overlayComponentPromise) {
            return;
        }

        this.setDisplayed(true, { skipAriaHidden: true });

        if (exclusive && this.isGridFocused()) {
            const activeElement = _getActiveDomElement(this.beans);
            if (activeElement && !_isNothingFocused(this.beans)) {
                this.elToFocusAfter = activeElement as HTMLElement;
            }
        }

        overlayComponentPromise.then((comp) => {
            if (this.activePromise !== overlayComponentPromise) {
                // Another promise was started, we need to cancel this old operation
                if (this.activeOverlay !== comp) {
                    // We can destroy the component as it will not be used
                    this.destroyBean(comp);
                    comp = null;
                }
                return;
            }

            this.activePromise = null; // Promise completed, so we can reset this

            if (!comp) {
                return; // Error handling
            }

            if (this.activeOverlay !== comp) {
                this.eOverlayWrapper.appendChild(comp.getGui());
                this.activeOverlay = comp;

                if (gridOption) {
                    const component = comp;
                    this.updateListenerDestroyFunc = this.addManagedPropertyListener(gridOption, ({ currentValue }) => {
                        component.refresh?.(this.gos.addGridCommonParams({ ...(currentValue ?? {}) }));
                    });
                }
            }

            if (exclusive && this.isGridFocused()) {
                _focusInto(this.eOverlayWrapper);
            }
        });
    }

    public updateOverlayWrapperPaddingTop(padding: number): void {
        this.eOverlayWrapper.style.setProperty('padding-top', `${padding}px`);
    }

    private destroyActiveOverlay(): void {
        this.activePromise = null;

        const activeOverlay = this.activeOverlay;
        if (!activeOverlay) {
            return; // Nothing to destroy
        }

        let elementToFocus = this.elToFocusAfter;
        this.activeOverlay = null;
        this.elToFocusAfter = null;

        if (elementToFocus && !this.isGridFocused()) {
            elementToFocus = null;
        }

        const updateListenerDestroyFunc = this.updateListenerDestroyFunc;
        if (updateListenerDestroyFunc) {
            updateListenerDestroyFunc();
            this.updateListenerDestroyFunc = null;
        }

        this.destroyBean(activeOverlay);

        _clearElement(this.eOverlayWrapper);

        // Focus the element that was focused before the exclusive overlay was shown
        elementToFocus?.focus?.({ preventScroll: true });
    }

    public hideOverlay(): void {
        this.destroyActiveOverlay();
        this.setDisplayed(false, { skipAriaHidden: true });
    }

    private isGridFocused(): boolean {
        const activeEl = _getActiveDomElement(this.beans);
        return !!activeEl && this.beans.eGridDiv.contains(activeEl);
    }

    public override destroy(): void {
        this.elToFocusAfter = null;
        this.destroyActiveOverlay();
        this.beans.overlays!.setOverlayWrapperComp(undefined);
        super.destroy();
    }
}
export const OverlayWrapperSelector: ComponentSelector = {
    selector: 'AG-OVERLAY-WRAPPER',
    component: OverlayWrapperComponent,
};
