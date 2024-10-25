import { KeyCode } from '../constants/keyCode';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { AgColumn } from '../entities/agColumn';
import type { FocusService } from '../focusService';
import { _isColumnMenuAnchoringEnabled, _isLegacyMenuEnabled } from '../gridOptionsUtils';
import type { ContainerType } from '../interfaces/iAfterGuiAttachedParams';
import type { IMenuFactory } from '../interfaces/iMenuFactory';
import { _setAriaRole } from '../utils/aria';
import { _isVisible } from '../utils/dom';
import type { PopupService } from '../widgets/popupService';
import { FilterWrapperComp } from './filterWrapperComp';

export class FilterMenuFactory extends BeanStub implements NamedBean, IMenuFactory {
    beanName = 'filterMenuFactory' as const;

    private popupSvc?: PopupService;
    private focusSvc: FocusService;
    private ctrlsSvc: CtrlsService;

    public wireBeans(beans: BeanCollection): void {
        this.popupSvc = beans.popupSvc;
        this.focusSvc = beans.focusSvc;
        this.ctrlsSvc = beans.ctrlsSvc;
    }

    private hidePopup: () => void;
    private tabListener: null | (() => null);
    private activeMenu?: FilterWrapperComp;

    public hideActiveMenu(): void {
        if (this.hidePopup) {
            this.hidePopup();
        }
    }

    public showMenuAfterMouseEvent(
        column: AgColumn | undefined,
        mouseEvent: MouseEvent | Touch,
        containerType: ContainerType
    ): void {
        this.showPopup(
            column,
            (eMenu) => {
                this.popupSvc?.positionPopupUnderMouseEvent({
                    column,
                    type: containerType,
                    mouseEvent,
                    ePopup: eMenu,
                });
            },
            containerType,
            mouseEvent.target as HTMLElement,
            _isLegacyMenuEnabled(this.gos)
        );
    }

    public showMenuAfterButtonClick(
        column: AgColumn | undefined,
        eventSource: HTMLElement,
        containerType: ContainerType
    ): void {
        let multiplier = -1;
        let alignSide: 'left' | 'right' = 'left';

        const isLegacyMenuEnabled = _isLegacyMenuEnabled(this.gos);
        if (!isLegacyMenuEnabled && this.gos.get('enableRtl')) {
            multiplier = 1;
            alignSide = 'right';
        }
        const nudgeX = isLegacyMenuEnabled ? undefined : 4 * multiplier;
        const nudgeY = isLegacyMenuEnabled ? undefined : 4;

        this.showPopup(
            column,
            (eMenu) => {
                this.popupSvc?.positionPopupByComponent({
                    type: containerType,
                    eventSource,
                    ePopup: eMenu,
                    nudgeX,
                    nudgeY,
                    alignSide,
                    keepWithinBounds: true,
                    position: 'under',
                    column,
                });
            },
            containerType,
            eventSource,
            isLegacyMenuEnabled
        );
    }

    private showPopup(
        column: AgColumn | undefined,
        positionCallback: (eMenu: HTMLElement) => void,
        containerType: ContainerType,
        eventSource: HTMLElement,
        isLegacyMenuEnabled: boolean
    ): void {
        const comp = column ? this.createBean(new FilterWrapperComp(column, 'COLUMN_MENU')) : undefined;
        this.activeMenu = comp;
        if (!comp?.hasFilter() || !column) {
            throw new Error('AG Grid - unable to show popup filter, filter instantiation failed');
        }

        const eMenu = document.createElement('div');

        _setAriaRole(eMenu, 'presentation');
        eMenu.classList.add('ag-menu');
        if (!isLegacyMenuEnabled) {
            eMenu.classList.add('ag-filter-menu');
        }

        [this.tabListener] = this.addManagedElementListeners(eMenu, {
            keydown: (e: KeyboardEvent) => this.trapFocusWithin(e, eMenu),
        });

        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        eMenu.appendChild(comp?.getGui()!);

        let hidePopup: () => void;

        const afterGuiDetached = () => comp?.afterGuiDetached();

        const anchorToElement = _isColumnMenuAnchoringEnabled(this.gos)
            ? eventSource ?? this.ctrlsSvc.getGridBodyCtrl().getGui()
            : undefined;
        const closedCallback = (e: MouseEvent | TouchEvent | KeyboardEvent) => {
            column.setMenuVisible(false, 'contextMenu');
            const isKeyboardEvent = e instanceof KeyboardEvent;

            if (this.tabListener) {
                this.tabListener = this.tabListener();
            }

            if (isKeyboardEvent && eventSource && _isVisible(eventSource)) {
                const focusableEl = this.focusSvc.findTabbableParent(eventSource);

                if (focusableEl) {
                    focusableEl.focus();
                }
            }
            afterGuiDetached();
            this.destroyBean(this.activeMenu);
            this.dispatchVisibleChangedEvent(false, containerType, column);
        };

        const translate = this.getLocaleTextFunc();

        const ariaLabel =
            isLegacyMenuEnabled && containerType !== 'columnFilter'
                ? translate('ariaLabelColumnMenu', 'Column Menu')
                : translate('ariaLabelColumnFilter', 'Column Filter');

        const addPopupRes = this.popupSvc?.addPopup({
            modal: true,
            eChild: eMenu,
            closeOnEsc: true,
            closedCallback,
            positionCallback: () => positionCallback(eMenu),
            anchorToElement,
            ariaLabel,
        });

        if (addPopupRes) {
            this.hidePopup = hidePopup = addPopupRes.hideFunc;
        }

        comp.afterInit().then(() => {
            // need to make sure the filter is present before positioning, as only
            // after filter it is visible can we find out what the width of it is
            positionCallback(eMenu);

            comp.afterGuiAttached({ container: containerType, hidePopup });
        });

        column.setMenuVisible(true, 'contextMenu');

        this.dispatchVisibleChangedEvent(true, containerType, column);
    }

    private trapFocusWithin(e: KeyboardEvent, menu: HTMLElement) {
        if (
            e.key !== KeyCode.TAB ||
            e.defaultPrevented ||
            this.focusSvc.findNextFocusableElement(menu, false, e.shiftKey)
        ) {
            return;
        }

        e.preventDefault();

        this.focusSvc.focusInto(menu, e.shiftKey);
    }

    private dispatchVisibleChangedEvent(visible: boolean, containerType: ContainerType, column?: AgColumn): void {
        this.eventSvc.dispatchEvent({
            type: 'columnMenuVisibleChanged',
            visible,
            switchingTab: false,
            key: containerType as 'columnMenu' | 'columnFilter' | 'floatingFilter',
            column: column ?? null,
            columnGroup: null,
        });
    }

    public isMenuEnabled(column: AgColumn): boolean {
        // for standard, we show menu if filter is enabled, and the menu is not suppressed by passing an empty array
        return column.isFilterAllowed() && (column.getColDef().menuTabs ?? ['filterMenuTab']).includes('filterMenuTab');
    }

    public showMenuAfterContextMenuEvent(): void {
        // not supported in standard menu
    }

    public override destroy(): void {
        this.destroyBean(this.activeMenu);
        super.destroy();
    }
}
