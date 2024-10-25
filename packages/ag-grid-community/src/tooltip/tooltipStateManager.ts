import { _getTooltipCompDetails } from '../components/framework/userCompUtils';
import type { UserComponentFactory } from '../components/framework/userComponentFactory';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import { _getActiveDomElement, _getDocument } from '../gridOptionsUtils';
import { _isIOSUserAgent } from '../utils/browser';
import { _exists } from '../utils/generic';
import type { PopupService } from '../widgets/popupService';
import type { ITooltipComp } from './tooltipComponent';
import type { ITooltipCtrl } from './tooltipFeature';

enum TooltipStates {
    NOTHING,
    WAITING_TO_SHOW,
    SHOWING,
}
enum TooltipTrigger {
    HOVER,
    FOCUS,
}

const SHOW_QUICK_TOOLTIP_DIFF = 1000;
const FADE_OUT_TOOLTIP_TIMEOUT = 1000;
const INTERACTIVE_HIDE_DELAY = 100;

// different instances of tooltipFeature use this to see when the
// last tooltip was hidden.
let lastTooltipHideTime: number;
let isLocked = false;

export class TooltipStateManager extends BeanStub {
    private popupSvc?: PopupService;
    private userCompFactory: UserComponentFactory;

    public wireBeans(beans: BeanCollection): void {
        this.popupSvc = beans.popupSvc;
        this.userCompFactory = beans.userCompFactory;
    }

    private showTooltipTimeoutId: number | undefined;
    private hideTooltipTimeoutId: number | undefined;
    private interactiveTooltipTimeoutId: number | undefined;

    private interactionEnabled = false;
    private isInteractingWithTooltip = false;

    private state = TooltipStates.NOTHING;

    private lastMouseEvent: MouseEvent | null;

    private tooltipComp: ITooltipComp | undefined;
    private tooltipPopupDestroyFunc: (() => void) | undefined;
    // when showing the tooltip, we need to make sure it's the most recent instance we request, as due to
    // async we could request two tooltips before the first instance returns, in which case we should
    // disregard the second instance.
    private tooltipInstanceCount = 0;
    private tooltipMouseTrack: boolean = false;
    private tooltipTrigger: TooltipTrigger;

    private tooltipMouseEnterListener: (() => null) | null;
    private tooltipMouseLeaveListener: (() => null) | null;
    private tooltipFocusInListener: (() => null) | null;
    private tooltipFocusOutListener: (() => null) | null;

    private onBodyScrollEventCallback: (() => null) | undefined;
    private onColumnMovedEventCallback: (() => null) | undefined;
    private onDocumentKeyDownCallback: (() => null) | undefined;

    constructor(
        private readonly tooltipCtrl: ITooltipCtrl,
        private readonly getTooltipValue: () => any
    ) {
        super();
    }

    public postConstruct(): void {
        if (this.gos.get('tooltipInteraction')) {
            this.interactionEnabled = true;
        }

        this.tooltipTrigger = this.getTooltipTrigger();
        this.tooltipMouseTrack = this.gos.get('tooltipMouseTrack');

        const el = this.tooltipCtrl.getGui();

        if (this.tooltipTrigger === TooltipTrigger.HOVER) {
            this.addManagedListeners(el, {
                mouseenter: this.onMouseEnter.bind(this),
                mouseleave: this.onMouseLeave.bind(this),
            });
        }

        if (this.tooltipTrigger === TooltipTrigger.FOCUS) {
            this.addManagedListeners(el, {
                focusin: this.onFocusIn.bind(this),
                focusout: this.onFocusOut.bind(this),
            });
        }

        this.addManagedListeners(el, { mousemove: this.onMouseMove.bind(this) });

        if (!this.interactionEnabled) {
            this.addManagedListeners(el, {
                mousedown: this.onMouseDown.bind(this),
                keydown: this.onKeyDown.bind(this),
            });
        }
    }

    private getGridOptionsTooltipDelay(delayOption: 'tooltipShowDelay' | 'tooltipHideDelay'): number {
        const delay = this.gos.get(delayOption);
        return Math.max(200, delay);
    }

    private getTooltipDelay(type: 'show' | 'hide'): number {
        if (type === 'show') {
            return (
                this.tooltipCtrl.getTooltipShowDelayOverride?.() ?? this.getGridOptionsTooltipDelay('tooltipShowDelay')!
            );
        }

        return this.tooltipCtrl.getTooltipHideDelayOverride?.() ?? this.getGridOptionsTooltipDelay('tooltipHideDelay')!;
    }

    public override destroy(): void {
        // if this component gets destroyed while tooltip is showing, need to make sure
        // we don't end with no mouseLeave event resulting in zombie tooltip
        this.setToDoNothing();
        super.destroy();
    }

    private getTooltipTrigger(): TooltipTrigger {
        const trigger = this.gos.get('tooltipTrigger');

        if (!trigger || trigger === 'hover') {
            return TooltipTrigger.HOVER;
        }

        return TooltipTrigger.FOCUS;
    }

    public onMouseEnter(e: MouseEvent): void {
        // if `interactiveTooltipTimeoutId` is set, it means that this cell has a tooltip
        // and we are in the process of moving the cursor from the tooltip back to the cell
        // so we need to unlock this service here.
        if (this.interactionEnabled && this.interactiveTooltipTimeoutId) {
            this.unlockService();
            this.startHideTimeout();
        }

        if (_isIOSUserAgent()) {
            return;
        }

        if (isLocked) {
            this.showTooltipTimeoutId = window.setTimeout(() => {
                this.prepareToShowTooltip(e);
            }, INTERACTIVE_HIDE_DELAY);
        } else {
            this.prepareToShowTooltip(e);
        }
    }

    private onMouseMove(e: MouseEvent): void {
        // there is a delay from the time we mouseOver a component and the time the
        // tooltip is displayed, so we need to track mousemove to be able to correctly
        // position the tooltip when showTooltip is called.
        if (this.lastMouseEvent) {
            this.lastMouseEvent = e;
        }

        if (this.tooltipMouseTrack && this.state === TooltipStates.SHOWING && this.tooltipComp) {
            this.positionTooltip();
        }
    }

    private onMouseDown(): void {
        this.setToDoNothing();
    }

    private onMouseLeave(): void {
        // if interaction is enabled, we need to verify if the user is moving
        // the cursor from the cell onto the tooltip, so we lock the service
        // for 100ms to prevent other tooltips from being created while this is happening.
        if (this.interactionEnabled) {
            this.lockService();
        } else {
            this.setToDoNothing();
        }
    }

    private onFocusIn(): void {
        this.prepareToShowTooltip();
    }

    private onFocusOut(e: FocusEvent): void {
        const relatedTarget = e.relatedTarget as Element;
        const parentCompGui = this.tooltipCtrl.getGui();
        const tooltipGui = this.tooltipComp?.getGui();

        if (
            this.isInteractingWithTooltip ||
            parentCompGui.contains(relatedTarget) ||
            (this.interactionEnabled && tooltipGui?.contains(relatedTarget))
        ) {
            return;
        }

        this.setToDoNothing();
    }

    private onKeyDown(): void {
        // if the keydown happens outside of the tooltip, we cancel
        // the tooltip interaction and hide the tooltip.
        if (this.isInteractingWithTooltip) {
            this.isInteractingWithTooltip = false;
        }
        this.setToDoNothing();
    }

    private prepareToShowTooltip(mouseEvent?: MouseEvent): void {
        // every mouseenter should be following by a mouseleave, however for some unknown, it's possible for
        // mouseenter to be called twice in a row, which can happen if editing the cell. this was reported
        // in https://ag-grid.atlassian.net/browse/AG-4422. to get around this, we check the state, and if
        // state is != nothing, then we know mouseenter was already received.
        if (this.state != TooltipStates.NOTHING || isLocked) {
            return;
        }

        // if we are showing the tooltip because of focus, no delay at all
        // if another tooltip was hidden very recently, we only wait 200ms to show, not the normal waiting time
        let delay = 0;
        if (mouseEvent) {
            delay = this.isLastTooltipHiddenRecently() ? 200 : this.getTooltipDelay('show');
        }

        this.lastMouseEvent = mouseEvent || null;

        this.showTooltipTimeoutId = window.setTimeout(this.showTooltip.bind(this), delay);
        this.state = TooltipStates.WAITING_TO_SHOW;
    }

    private isLastTooltipHiddenRecently(): boolean {
        // return true if <1000ms since last time we hid a tooltip
        const now = new Date().getTime();
        const then = lastTooltipHideTime;

        return now - then < SHOW_QUICK_TOOLTIP_DIFF;
    }

    private setToDoNothing(fromHideTooltip?: boolean): void {
        if (!fromHideTooltip && this.state === TooltipStates.SHOWING) {
            this.hideTooltip();
        }

        if (this.onBodyScrollEventCallback) {
            this.onBodyScrollEventCallback();
            this.onBodyScrollEventCallback = undefined;
        }

        if (this.onColumnMovedEventCallback) {
            this.onColumnMovedEventCallback();
            this.onColumnMovedEventCallback = undefined;
        }

        if (this.onDocumentKeyDownCallback) {
            this.onDocumentKeyDownCallback();
            this.onDocumentKeyDownCallback = undefined;
        }

        this.clearTimeouts();
        this.state = TooltipStates.NOTHING;
        this.lastMouseEvent = null;
    }

    private showTooltip(): void {
        const value = this.getTooltipValue();
        const ctrl = this.tooltipCtrl;

        if (!_exists(value) || (ctrl.shouldDisplayTooltip && !ctrl.shouldDisplayTooltip())) {
            this.setToDoNothing();
            return;
        }

        const rowNode = ctrl.getRowNode?.();

        const params = {
            location: ctrl.getLocation?.() ?? 'UNKNOWN', //'cell',
            colDef: ctrl.getColDef?.(),
            column: ctrl.getColumn?.(),
            rowIndex: ctrl.getRowIndex?.(),
            node: rowNode,
            data: rowNode?.data,
            value,
            valueFormatted: ctrl.getValueFormatted?.(),
            hideTooltipCallback: () => this.hideTooltip(true),
            ...(ctrl.getAdditionalParams?.() ?? {}),
        };

        this.state = TooltipStates.SHOWING;
        this.tooltipInstanceCount++;

        // we pass in tooltipInstanceCount so the callback knows what the count was when
        // we requested the tooltip, so if another tooltip was requested in the mean time
        // we disregard it
        const callback = this.newTooltipComponentCallback.bind(this, this.tooltipInstanceCount);

        const userDetails = _getTooltipCompDetails(this.userCompFactory, params);
        userDetails.newAgStackInstance()!.then(callback);
    }

    public hideTooltip(forceHide?: boolean): void {
        if (!forceHide && this.isInteractingWithTooltip) {
            return;
        }
        // check if comp exists - due to async, although we asked for
        // one, the instance may not be back yet
        if (this.tooltipComp) {
            this.destroyTooltipComp();
            lastTooltipHideTime = new Date().getTime();
        }

        this.eventSvc.dispatchEvent({
            type: 'tooltipHide',
            parentGui: this.tooltipCtrl.getGui(),
        });

        if (forceHide) {
            this.isInteractingWithTooltip = false;
        }

        this.setToDoNothing(true);
    }

    private newTooltipComponentCallback(tooltipInstanceCopy: number, tooltipComp: ITooltipComp): void {
        const compNoLongerNeeded =
            this.state !== TooltipStates.SHOWING || this.tooltipInstanceCount !== tooltipInstanceCopy;

        if (compNoLongerNeeded) {
            this.destroyBean(tooltipComp);
            return;
        }

        const eGui = tooltipComp.getGui();

        this.tooltipComp = tooltipComp;

        if (!eGui.classList.contains('ag-tooltip')) {
            eGui.classList.add('ag-tooltip-custom');
        }

        if (this.tooltipTrigger === TooltipTrigger.HOVER) {
            eGui.classList.add('ag-tooltip-animate');
        }

        if (this.interactionEnabled) {
            eGui.classList.add('ag-tooltip-interactive');
        }

        const translate = this.getLocaleTextFunc();

        const addPopupRes = this.popupSvc?.addPopup({
            eChild: eGui,
            ariaLabel: translate('ariaLabelTooltip', 'Tooltip'),
        });
        if (addPopupRes) {
            this.tooltipPopupDestroyFunc = addPopupRes.hideFunc;
        }

        this.positionTooltip();

        if (this.tooltipTrigger === TooltipTrigger.FOCUS) {
            const listener = () => this.setToDoNothing();
            [this.onBodyScrollEventCallback, this.onColumnMovedEventCallback] = this.addManagedEventListeners({
                bodyScroll: listener,
                columnMoved: listener,
            });
        }

        if (this.interactionEnabled) {
            [this.tooltipMouseEnterListener, this.tooltipMouseLeaveListener] = this.addManagedElementListeners(eGui, {
                mouseenter: this.onTooltipMouseEnter.bind(this),
                mouseleave: this.onTooltipMouseLeave.bind(this),
            });

            [this.onDocumentKeyDownCallback] = this.addManagedElementListeners(_getDocument(this.gos), {
                keydown: (e) => {
                    if (!eGui.contains(e?.target as HTMLElement)) {
                        this.onKeyDown();
                    }
                },
            });

            if (this.tooltipTrigger === TooltipTrigger.FOCUS) {
                [this.tooltipFocusInListener, this.tooltipFocusOutListener] = this.addManagedElementListeners(eGui, {
                    focusin: this.onTooltipFocusIn.bind(this),
                    focusout: this.onTooltipFocusOut.bind(this),
                });
            }
        }

        this.eventSvc.dispatchEvent({
            type: 'tooltipShow',
            tooltipGui: eGui,
            parentGui: this.tooltipCtrl.getGui(),
        });

        this.startHideTimeout();
    }

    private onTooltipMouseEnter(): void {
        this.isInteractingWithTooltip = true;
        this.unlockService();
    }

    private onTooltipMouseLeave(): void {
        if (this.isTooltipFocused()) {
            return;
        }
        this.isInteractingWithTooltip = false;
        this.lockService();
    }

    private onTooltipFocusIn(): void {
        this.isInteractingWithTooltip = true;
    }

    private isTooltipFocused(): boolean {
        const tooltipGui = this.tooltipComp?.getGui();
        const activeEl = _getActiveDomElement(this.gos);

        return !!tooltipGui && tooltipGui.contains(activeEl);
    }

    private onTooltipFocusOut(e: FocusEvent): void {
        const parentGui = this.tooltipCtrl.getGui();

        // focusout is dispatched when inner elements lose focus
        // so we need to verify if focus is contained within the tooltip
        if (this.isTooltipFocused()) {
            return;
        }

        this.isInteractingWithTooltip = false;

        // if we move the focus from the tooltip back to the original cell
        // the tooltip should remain open, but we need to restart the hide timeout counter
        if (parentGui.contains(e.relatedTarget as Element)) {
            this.startHideTimeout();
        }
        // if the parent cell doesn't contain the focus, simply hide the tooltip
        else {
            this.hideTooltip();
        }
    }

    private positionTooltip(): void {
        const params = {
            type: 'tooltip',
            ePopup: this.tooltipComp!.getGui(),
            nudgeY: 18,
            skipObserver: this.tooltipMouseTrack,
        };

        if (this.lastMouseEvent) {
            this.popupSvc?.positionPopupUnderMouseEvent({
                ...params,
                mouseEvent: this.lastMouseEvent,
            });
        } else {
            this.popupSvc?.positionPopupByComponent({
                ...params,
                eventSource: this.tooltipCtrl.getGui(),
                position: 'under',
                keepWithinBounds: true,
                nudgeY: 5,
            });
        }
    }

    private destroyTooltipComp(): void {
        // add class to fade out the tooltip
        this.tooltipComp!.getGui().classList.add('ag-tooltip-hiding');

        // make local copies of these variables, as we use them in the async function below,
        // and we clear then to 'undefined' later, so need to take a copy before they are undefined.
        const tooltipPopupDestroyFunc = this.tooltipPopupDestroyFunc;
        const tooltipComp = this.tooltipComp;
        const delay = this.tooltipTrigger === TooltipTrigger.HOVER ? FADE_OUT_TOOLTIP_TIMEOUT : 0;

        window.setTimeout(() => {
            tooltipPopupDestroyFunc!();
            this.destroyBean(tooltipComp);
        }, delay);

        this.clearTooltipListeners();
        this.tooltipPopupDestroyFunc = undefined;
        this.tooltipComp = undefined;
    }

    private clearTooltipListeners(): void {
        [
            this.tooltipMouseEnterListener,
            this.tooltipMouseLeaveListener,
            this.tooltipFocusInListener,
            this.tooltipFocusOutListener,
        ].forEach((listener) => {
            if (listener) {
                listener();
            }
        });

        this.tooltipMouseEnterListener =
            this.tooltipMouseLeaveListener =
            this.tooltipFocusInListener =
            this.tooltipFocusOutListener =
                null;
    }

    private lockService(): void {
        isLocked = true;
        this.interactiveTooltipTimeoutId = window.setTimeout(() => {
            this.unlockService();
            this.setToDoNothing();
        }, INTERACTIVE_HIDE_DELAY);
    }

    private unlockService(): void {
        isLocked = false;
        this.clearInteractiveTimeout();
    }

    private startHideTimeout(): void {
        this.clearHideTimeout();
        this.hideTooltipTimeoutId = window.setTimeout(this.hideTooltip.bind(this), this.getTooltipDelay('hide'));
    }

    private clearShowTimeout(): void {
        if (!this.showTooltipTimeoutId) {
            return;
        }
        window.clearTimeout(this.showTooltipTimeoutId);
        this.showTooltipTimeoutId = undefined;
    }

    private clearHideTimeout(): void {
        if (!this.hideTooltipTimeoutId) {
            return;
        }
        window.clearTimeout(this.hideTooltipTimeoutId);
        this.hideTooltipTimeoutId = undefined;
    }

    private clearInteractiveTimeout(): void {
        if (!this.interactiveTooltipTimeoutId) {
            return;
        }
        window.clearTimeout(this.interactiveTooltipTimeoutId);
        this.interactiveTooltipTimeoutId = undefined;
    }

    private clearTimeouts(): void {
        this.clearShowTimeout();
        this.clearHideTimeout();
        this.clearInteractiveTimeout();
    }
}
