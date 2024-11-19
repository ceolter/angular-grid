import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { AgColumn } from '../entities/agColumn';
import type { GridBodyCtrl } from '../gridBodyComp/gridBodyCtrl';
import type { RowContainerEventsFeature } from '../gridBodyComp/rowContainer/rowContainerEventsFeature';
import type { HeaderComp } from '../headerRendering/cells/column/headerComp';
import type { HeaderGroupComp } from '../headerRendering/cells/columnGroup/headerGroupComp';
import type { GridHeaderCtrl } from '../headerRendering/gridHeaderCtrl';
import type { CellMouseListenerFeature } from '../rendering/cell/cellMouseListenerFeature';
import { _isIOSUserAgent } from '../utils/browser';
import { _isEventSupported } from '../utils/event';
import { _exists } from '../utils/generic';
import type { LongTapEvent, TapEvent, TouchListenerEvent } from '../widgets/touchListener';
import { TouchListener } from '../widgets/touchListener';

export class TouchService extends BeanStub implements NamedBean {
    beanName = 'touchSvc' as const;

    public mockBodyContextMenuForIPad(
        ctrl: GridBodyCtrl,
        listener: (mouseListener?: MouseEvent, touch?: Touch, touchEvent?: TouchEvent) => void
    ): void {
        this.mockContextMenuForIPad(ctrl, ctrl.eBodyViewport, listener);
    }

    public mockHeaderContextMenuForIPad(
        ctrl: GridHeaderCtrl,
        listener: (mouseListener?: MouseEvent, touch?: Touch, touchEvent?: TouchEvent) => void
    ): void {
        this.mockContextMenuForIPad(ctrl, ctrl.eGui, listener);
    }

    public mockRowContextMenuForIPad(ctrl: RowContainerEventsFeature): void {
        // we do NOT want this when not in iPad, otherwise we will be doing
        if (!_isIOSUserAgent()) {
            return;
        }

        const listener = (mouseListener?: MouseEvent, touch?: Touch, touchEvent?: TouchEvent) => {
            const { rowCtrl, cellCtrl } = ctrl.getControlsForEventTarget(touchEvent?.target ?? null);
            this.beans.contextMenuSvc?.handleContextMenuMouseEvent(undefined, touchEvent, rowCtrl, cellCtrl!);
        };
        this.mockContextMenuForIPad(ctrl, ctrl.element, listener);
    }

    public handleCellDoubleClickOnIPad(ctrl: CellMouseListenerFeature, mouseEvent: MouseEvent): boolean {
        const isDoubleClickOnIPad = () => {
            if (!_isIOSUserAgent() || _isEventSupported('dblclick')) {
                return false;
            }

            const nowMillis = new Date().getTime();
            const res = nowMillis - ctrl.lastIPadMouseClickEvent < 200;
            ctrl.lastIPadMouseClickEvent = nowMillis;

            return res;
        };
        if (isDoubleClickOnIPad()) {
            ctrl.onCellDoubleClicked(mouseEvent);
            mouseEvent.preventDefault(); // if we don't do this, then iPad zooms in

            return true;
        }
        return false;
    }

    public setupForHeader(comp: HeaderComp): void {
        const { gos, sortSvc } = this.beans;

        if (gos.get('suppressTouch')) {
            return;
        }
        const { params, eMenu, eFilterButton } = comp;

        const touchListener = new TouchListener(comp.getGui(), true);
        const suppressMenuHide = comp.shouldSuppressMenuHide();
        const tapMenuButton = suppressMenuHide && _exists(eMenu);
        const menuTouchListener = tapMenuButton ? new TouchListener(eMenu, true) : touchListener;

        if (params.enableMenu) {
            const eventType: TouchListenerEvent = tapMenuButton ? 'tap' : 'longTap';
            const showMenuFn = (event: TapEvent | LongTapEvent) =>
                params.showColumnMenuAfterMouseClick(event.touchStart);
            comp.addManagedListeners(menuTouchListener, { [eventType]: showMenuFn });
        }

        if (params.enableSorting) {
            const tapListener = (event: TapEvent) => {
                const target = event.touchStart.target as HTMLElement;
                // When suppressMenuHide is true, a tap on the menu icon or filter button will bubble up
                // to the header container, in that case we should not sort
                if (suppressMenuHide && (eMenu?.contains(target) || eFilterButton?.contains(target))) {
                    return;
                }

                sortSvc?.progressSort(params.column as AgColumn, false, 'uiColumnSorted');
            };

            comp.addManagedListeners(touchListener, { tap: tapListener });
        }

        if (params.enableFilterButton && eFilterButton) {
            const filterButtonTouchListener = new TouchListener(eFilterButton, true);
            comp.addManagedListeners(filterButtonTouchListener, {
                tap: () => params.showFilter(eFilterButton),
            });
            comp.addDestroyFunc(() => filterButtonTouchListener.destroy());
        }

        // if tapMenuButton is true `touchListener` and `menuTouchListener` are different
        // so we need to make sure to destroy both listeners here
        comp.addDestroyFunc(() => touchListener.destroy());

        if (tapMenuButton) {
            comp.addDestroyFunc(() => menuTouchListener.destroy());
        }
    }

    public setupForHeaderGroup(
        comp: HeaderGroupComp,
        eElement: HTMLElement,
        action: (event: MouseEvent) => void
    ): void {
        const touchListener = new TouchListener(eElement, true);

        comp.addManagedListeners(touchListener, { tap: action });
        comp.addDestroyFunc(() => touchListener.destroy());
    }

    private mockContextMenuForIPad(
        ctrl: BeanStub,
        element: HTMLElement,
        listener: (mouseListener?: MouseEvent, touch?: Touch, touchEvent?: TouchEvent) => void
    ): void {
        // we do NOT want this when not in iPad
        if (!_isIOSUserAgent()) {
            return;
        }

        const touchListener = new TouchListener(element);
        const longTapListener = (event: LongTapEvent) => {
            listener(undefined, event.touchStart, event.touchEvent);
        };

        ctrl.addManagedListeners(touchListener, { longTap: longTapListener });
        ctrl.addDestroyFunc(() => touchListener.destroy());
    }
}
