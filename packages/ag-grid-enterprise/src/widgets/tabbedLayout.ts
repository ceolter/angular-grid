import type { BeanCollection, FocusService, IAfterGuiAttachedParams } from 'ag-grid-community';
import {
    KeyCode,
    RefPlaceholder,
    TabGuardComp,
    _clearElement,
    _createIconNoSpan,
    _getActiveDomElement,
    _getDocument,
    _setAriaLabel,
    _setAriaRole,
} from 'ag-grid-community';

import type { TabbedItem, TabbedLayoutParams } from './iTabbedLayout';

interface TabbedItemWrapper {
    tabbedItem: TabbedItem;
    eHeaderButton: HTMLElement;
}

function getTabbedLayoutTemplate(cssClass?: string) {
    return /* html */ `<div class="ag-tabs ${cssClass}">
        <div data-ref="eHeader"></div>
        <div data-ref="eBody" role="presentation" class="ag-tabs-body ${cssClass ? `${cssClass}-body` : ''}"></div>
    </div>`;
}

export class TabbedLayout extends TabGuardComp {
    private focusSvc: FocusService;

    public wireBeans(beans: BeanCollection): void {
        this.focusSvc = beans.focusSvc;
    }

    private readonly eHeader: HTMLElement = RefPlaceholder;
    private readonly eBody: HTMLElement = RefPlaceholder;

    private eTabHeader: HTMLElement;
    private eCloseButton?: HTMLElement;

    private params: TabbedLayoutParams;
    private afterAttachedParams: IAfterGuiAttachedParams;
    private items: TabbedItemWrapper[] = [];
    private activeItem: TabbedItemWrapper;
    private lastScrollListener: (() => null) | null | undefined;
    private readonly tabbedItemScrollMap = new Map<string, number>();

    constructor(params: TabbedLayoutParams) {
        super(getTabbedLayoutTemplate(params.cssClass));
        this.params = params;
    }

    public postConstruct() {
        this.setupHeader();

        if (this.params.items) {
            this.params.items.forEach((item) => this.addItem(item));
        }

        this.initialiseTabGuard({
            onTabKeyDown: this.onTabKeyDown.bind(this),
            handleKeyDown: this.handleKeyDown.bind(this),
            focusInnerElement: this.focusInnerElement.bind(this),
            focusTrapActive: true,
        });

        this.addDestroyFunc(() => this.activeItem?.tabbedItem?.afterDetachedCallback?.());
    }

    private setupHeader(): void {
        const { enableCloseButton, cssClass } = this.params;
        const addCssClasses = (el: HTMLElement, suffix: string) => {
            el.classList.add(`ag-tabs-${suffix}`);
            if (cssClass) {
                el.classList.add(`${cssClass}-${suffix}`);
            }
        };
        if (enableCloseButton) {
            this.setupCloseButton(addCssClasses);
            this.eTabHeader = _getDocument(this.gos).createElement('div');
            addCssClasses(this.eHeader, 'header-wrapper');
            _setAriaRole(this.eHeader, 'presentation');
            this.eHeader.appendChild(this.eTabHeader);
        } else {
            this.eTabHeader = this.eHeader;
        }
        _setAriaRole(this.eTabHeader, 'tablist');
        addCssClasses(this.eTabHeader, 'header');
    }

    private setupCloseButton(addCssClasses: (el: HTMLElement, suffix: string) => void): void {
        const eDocument = _getDocument(this.gos);
        const eCloseButton = eDocument.createElement('button');
        addCssClasses(eCloseButton, 'close-button');
        const eIcon = _createIconNoSpan('close', this.beans)!;
        _setAriaLabel(eCloseButton, this.params.closeButtonAriaLabel);
        eCloseButton.appendChild(eIcon);
        this.addManagedElementListeners(eCloseButton, { click: () => this.params.onCloseClicked?.() });
        const eCloseButtonWrapper = eDocument.createElement('div');
        addCssClasses(eCloseButtonWrapper, 'close-button-wrapper');
        _setAriaRole(eCloseButtonWrapper, 'presentation');
        eCloseButtonWrapper.appendChild(eCloseButton);
        this.eHeader.appendChild(eCloseButtonWrapper);
        this.eCloseButton = eCloseButton;
    }

    protected handleKeyDown(e: KeyboardEvent): void {
        switch (e.key) {
            case KeyCode.RIGHT:
            case KeyCode.LEFT: {
                if (!this.eTabHeader.contains(_getActiveDomElement(this.gos))) {
                    return;
                }
                const isRightKey = e.key === KeyCode.RIGHT;
                const isRtl = this.gos.get('enableRtl');
                const currentPosition = this.items.indexOf(this.activeItem);
                const nextPosition =
                    isRightKey !== isRtl
                        ? Math.min(currentPosition + 1, this.items.length - 1)
                        : Math.max(currentPosition - 1, 0);

                if (currentPosition === nextPosition) {
                    return;
                }

                e.preventDefault();

                const nextItem = this.items[nextPosition];

                this.showItemWrapper(nextItem);
                nextItem.eHeaderButton.focus();
                break;
            }
            case KeyCode.UP:
            case KeyCode.DOWN:
                e.stopPropagation();
                break;
        }
    }

    protected onTabKeyDown(e: KeyboardEvent) {
        if (e.defaultPrevented) {
            return;
        }

        const { focusSvc, eHeader, eBody, activeItem, params } = this;
        const { suppressTrapFocus, enableCloseButton } = params;

        const activeElement = _getActiveDomElement(this.gos);
        const target = e.target as HTMLElement;
        const backwards = e.shiftKey;

        if (eHeader.contains(activeElement)) {
            e.preventDefault();
            if (enableCloseButton && backwards && !this.eCloseButton?.contains(activeElement)) {
                this.eCloseButton?.focus();
            } else if (suppressTrapFocus && backwards) {
                this.focusSvc.findFocusableElementBeforeTabGuard(_getDocument(this.gos).body, target)?.focus();
            } else {
                // focus is in header, move into body of popup
                this.focusBody(e.shiftKey);
            }
            return;
        }

        let nextEl: HTMLElement | null = null;

        if (focusSvc.isTargetUnderManagedComponent(eBody, target)) {
            if (backwards) {
                nextEl = this.focusSvc.findFocusableElementBeforeTabGuard(eBody, target);
            }

            if (!nextEl && !suppressTrapFocus) {
                nextEl = activeItem.eHeaderButton;
            }
        }

        if (!nextEl && eBody.contains(activeElement)) {
            nextEl = focusSvc.findNextFocusableElement(eBody, false, backwards);

            if (!nextEl) {
                if (suppressTrapFocus && !backwards) {
                    this.forceFocusOutOfContainer(backwards);
                } else if (enableCloseButton && !backwards) {
                    e.preventDefault();
                    this.eCloseButton?.focus();
                } else {
                    e.preventDefault();
                    this.focusHeader();
                }
                return;
            }
        }

        if (nextEl) {
            e.preventDefault();
            nextEl.focus();
        }
    }

    private focusInnerElement(fromBottom?: boolean): void {
        if (fromBottom) {
            this.focusBody(true);
        } else {
            this.focusHeader();
        }
    }

    public focusHeader(preventScroll?: boolean): void {
        this.activeItem.eHeaderButton.focus({ preventScroll });
    }

    private focusBody(fromBottom?: boolean): void {
        this.focusSvc.focusInto(this.eBody, fromBottom);
    }

    public setAfterAttachedParams(params: IAfterGuiAttachedParams): void {
        this.afterAttachedParams = params;
    }

    public showFirstItem(): void {
        if (this.items.length > 0) {
            this.showItemWrapper(this.items[0]);
        }
    }

    private addItem(item: TabbedItem): void {
        const eHeaderButton = document.createElement('span');

        _setAriaRole(eHeaderButton, 'tab');
        eHeaderButton.setAttribute('tabindex', '-1');
        eHeaderButton.appendChild(item.title);
        eHeaderButton.classList.add('ag-tab');

        this.eTabHeader.appendChild(eHeaderButton);
        _setAriaLabel(eHeaderButton, item.titleLabel);

        const wrapper: TabbedItemWrapper = {
            tabbedItem: item,
            eHeaderButton: eHeaderButton,
        };
        this.items.push(wrapper);

        eHeaderButton.addEventListener('click', this.showItemWrapper.bind(this, wrapper));
    }

    public showItem(tabbedItem: TabbedItem): void {
        const itemWrapper = this.items.find((wrapper) => wrapper.tabbedItem === tabbedItem);

        if (itemWrapper) {
            this.showItemWrapper(itemWrapper);
        }
    }

    private showItemWrapper(wrapper: TabbedItemWrapper): void {
        const { tabbedItem, eHeaderButton } = wrapper;

        this.params.onItemClicked?.({ item: tabbedItem });

        if (this.activeItem === wrapper) {
            this.params.onActiveItemClicked?.();
            return;
        }

        if (this.lastScrollListener) {
            this.lastScrollListener = this.lastScrollListener();
        }

        _clearElement(this.eBody);

        tabbedItem.bodyPromise.then((body: HTMLElement) => {
            this.eBody.appendChild(body);
            const onlyUnmanaged = !this.focusSvc.isKeyboardMode();

            if (!this.params.suppressFocusBodyOnOpen) {
                this.focusSvc.focusInto(this.eBody, false, onlyUnmanaged);
            }

            if (tabbedItem.afterAttachedCallback) {
                tabbedItem.afterAttachedCallback(this.afterAttachedParams);
            }

            if (this.params.keepScrollPosition) {
                const scrollableContainer =
                    (tabbedItem.getScrollableContainer && tabbedItem.getScrollableContainer()) || body;
                [this.lastScrollListener] = this.addManagedElementListeners(scrollableContainer, {
                    scroll: () => {
                        this.tabbedItemScrollMap.set(tabbedItem.name, scrollableContainer.scrollTop);
                    },
                });
                const scrollPosition = this.tabbedItemScrollMap.get(tabbedItem.name);
                if (scrollPosition !== undefined) {
                    // Safari needs a small timeout or it will fire a scroll event to position 0
                    setTimeout(() => {
                        scrollableContainer.scrollTop = scrollPosition;
                    }, 0);
                }
            }
        });

        if (this.activeItem) {
            this.activeItem.eHeaderButton.classList.remove('ag-tab-selected');
            this.activeItem.tabbedItem.afterDetachedCallback?.();
        }

        eHeaderButton.classList.add('ag-tab-selected');

        this.activeItem = wrapper;
    }
}
