import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { FocusService } from '../focusService';
import { _getDocument } from '../gridOptionsUtils';
import { ManagedFocusFeature } from './managedFocusFeature';

export const TabGuardClassNames = {
    TAB_GUARD: 'ag-tab-guard',
    TAB_GUARD_TOP: 'ag-tab-guard-top',
    TAB_GUARD_BOTTOM: 'ag-tab-guard-bottom',
} as const;

export interface ITabGuard {
    setTabIndex(tabIndex?: string): void;
}

export class TabGuardCtrl extends BeanStub {
    private focusSvc: FocusService;

    public wireBeans(beans: BeanCollection): void {
        this.focusSvc = beans.focusSvc;
    }

    private readonly comp: ITabGuard;
    private readonly eTopGuard: HTMLElement;
    private readonly eBottomGuard: HTMLElement;

    private readonly eFocusableElement: HTMLElement;
    private readonly focusTrapActive: boolean;
    private readonly forceFocusOutWhenTabGuardsAreEmpty: boolean;
    // When true, this prevents the browser from tabbing into and out of the element.
    // Instead, focus must be handled manually
    private readonly isFocusableContainer: boolean;

    private readonly providedFocusInnerElement?: (fromBottom: boolean) => void;
    private readonly providedFocusIn?: (event: FocusEvent) => void;
    private readonly providedFocusOut?: (event: FocusEvent) => void;

    private readonly providedShouldStopEventPropagation?: () => boolean;
    private readonly providedOnTabKeyDown?: (e: KeyboardEvent) => void;
    private readonly providedHandleKeyDown?: (e: KeyboardEvent) => void;

    private skipTabGuardFocus: boolean = false;
    private forcingFocusOut: boolean = false;
    // Used when `isFocusableContainer` enabled
    private allowFocus: boolean = false;

    constructor(params: {
        comp: ITabGuard;
        eTopGuard: HTMLElement;
        eBottomGuard: HTMLElement;
        eFocusableElement: HTMLElement;
        focusTrapActive?: boolean;
        forceFocusOutWhenTabGuardsAreEmpty?: boolean;
        isFocusableContainer?: boolean;
        focusInnerElement?: (fromBottom: boolean) => void;
        onFocusIn?: (event: FocusEvent) => void;
        onFocusOut?: (event: FocusEvent) => void;
        shouldStopEventPropagation?: () => boolean;
        onTabKeyDown?: (e: KeyboardEvent) => void;
        handleKeyDown?: (e: KeyboardEvent) => void;
    }) {
        super();

        const {
            comp,
            eTopGuard,
            eBottomGuard,
            focusTrapActive,
            forceFocusOutWhenTabGuardsAreEmpty,
            isFocusableContainer,
            focusInnerElement,
            onFocusIn,
            onFocusOut,
            shouldStopEventPropagation,
            onTabKeyDown,
            handleKeyDown,
            eFocusableElement,
        } = params;

        this.comp = comp;

        this.eTopGuard = eTopGuard;
        this.eBottomGuard = eBottomGuard;
        this.providedFocusInnerElement = focusInnerElement;
        this.eFocusableElement = eFocusableElement;
        this.focusTrapActive = !!focusTrapActive;
        this.forceFocusOutWhenTabGuardsAreEmpty = !!forceFocusOutWhenTabGuardsAreEmpty;
        this.isFocusableContainer = !!isFocusableContainer;

        this.providedFocusIn = onFocusIn;
        this.providedFocusOut = onFocusOut;
        this.providedShouldStopEventPropagation = shouldStopEventPropagation;
        this.providedOnTabKeyDown = onTabKeyDown;
        this.providedHandleKeyDown = handleKeyDown;
    }

    public postConstruct() {
        this.createManagedBean(
            new ManagedFocusFeature(this.eFocusableElement, {
                shouldStopEventPropagation: () => this.shouldStopEventPropagation(),
                onTabKeyDown: (e) => this.onTabKeyDown(e),
                handleKeyDown: (e) => this.handleKeyDown(e),
                onFocusIn: (e) => this.onFocusIn(e),
                onFocusOut: (e) => this.onFocusOut(e),
            })
        );

        this.activateTabGuards();

        [this.eTopGuard, this.eBottomGuard].forEach((guard) =>
            this.addManagedElementListeners(guard, { focus: this.onFocus.bind(this) })
        );
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (this.providedHandleKeyDown) {
            this.providedHandleKeyDown(e);
        }
    }

    private tabGuardsAreActive(): boolean {
        return !!this.eTopGuard && this.eTopGuard.hasAttribute('tabIndex');
    }

    private shouldStopEventPropagation(): boolean {
        if (this.providedShouldStopEventPropagation) {
            return this.providedShouldStopEventPropagation();
        }
        return false;
    }

    private activateTabGuards(): void {
        // Do not activate tabs while focus is being forced out
        if (this.forcingFocusOut) {
            return;
        }
        const tabIndex = this.gos.get('tabIndex');
        this.comp.setTabIndex(tabIndex.toString());
    }

    private deactivateTabGuards(): void {
        this.comp.setTabIndex();
    }

    private onFocus(e: FocusEvent): void {
        if (this.isFocusableContainer && !this.eFocusableElement.contains(e.relatedTarget as HTMLElement)) {
            if (!this.allowFocus) {
                this.findNextElementOutsideAndFocus(e.target === this.eBottomGuard);
                return;
            }
        }

        if (this.skipTabGuardFocus) {
            this.skipTabGuardFocus = false;
            return;
        }

        // when there are no focusable items within the TabGuard, focus gets stuck
        // in the TabGuard itself and has nowhere to go, so we need to manually find
        // the closest element to focus by calling `forceFocusOutWhenTabGuardAreEmpty`.
        if (this.forceFocusOutWhenTabGuardsAreEmpty) {
            const isEmpty = this.focusSvc.findFocusableElements(this.eFocusableElement, '.ag-tab-guard').length === 0;
            if (isEmpty) {
                this.findNextElementOutsideAndFocus(e.target === this.eBottomGuard);
                return;
            }
        }

        if (this.isFocusableContainer && this.eFocusableElement.contains(e.relatedTarget as HTMLElement)) {
            return;
        }

        const fromBottom = e.target === this.eBottomGuard;

        if (this.providedFocusInnerElement) {
            this.providedFocusInnerElement(fromBottom);
        } else {
            this.focusInnerElement(fromBottom);
        }
    }

    private findNextElementOutsideAndFocus(up: boolean) {
        const eDocument = _getDocument(this.gos);
        const focusableEls = this.focusSvc.findFocusableElements(eDocument.body, null, true);
        const index = focusableEls.indexOf(up ? this.eTopGuard : this.eBottomGuard);

        if (index === -1) {
            return;
        }

        let start: number;
        let end: number;
        if (up) {
            start = 0;
            end = index;
        } else {
            start = index + 1;
            end = focusableEls.length;
        }
        const focusableRange = focusableEls.slice(start, end);
        const targetTabIndex = this.gos.get('tabIndex');
        focusableRange.sort((a: HTMLElement, b: HTMLElement) => {
            const indexA = parseInt(a.getAttribute('tabindex') || '0');
            const indexB = parseInt(b.getAttribute('tabindex') || '0');

            if (indexB === targetTabIndex) {
                return 1;
            }
            if (indexA === targetTabIndex) {
                return -1;
            }

            if (indexA === 0) {
                return 1;
            }
            if (indexB === 0) {
                return -1;
            }

            return indexA - indexB;
        });

        focusableRange[up ? focusableRange.length - 1 : 0]?.focus();
    }

    private onFocusIn(e: FocusEvent): void {
        if (this.focusTrapActive || this.forcingFocusOut) {
            return;
        }

        if (this.providedFocusIn) {
            this.providedFocusIn(e);
        }

        if (!this.isFocusableContainer) {
            this.deactivateTabGuards();
        }
    }

    private onFocusOut(e: FocusEvent): void {
        if (this.focusTrapActive) {
            return;
        }

        if (this.providedFocusOut) {
            this.providedFocusOut(e);
        }

        if (!this.eFocusableElement.contains(e.relatedTarget as HTMLElement)) {
            this.activateTabGuards();
        }
    }

    public onTabKeyDown(e: KeyboardEvent): void {
        if (this.providedOnTabKeyDown) {
            this.providedOnTabKeyDown(e);
            return;
        }

        if (this.focusTrapActive) {
            return;
        }
        if (e.defaultPrevented) {
            return;
        }

        const tabGuardsAreActive = this.tabGuardsAreActive();

        if (tabGuardsAreActive) {
            this.deactivateTabGuards();
        }

        const nextRoot = this.getNextFocusableElement(e.shiftKey);

        if (tabGuardsAreActive) {
            // ensure the tab guards are only re-instated once the event has finished processing, to avoid the browser
            // tabbing to the tab guard from inside the component
            setTimeout(() => this.activateTabGuards(), 0);
        }

        if (!nextRoot) {
            return;
        }

        nextRoot.focus();
        e.preventDefault();
    }

    public focusInnerElement(fromBottom = false): void {
        const focusable = this.focusSvc.findFocusableElements(this.eFocusableElement);

        if (this.tabGuardsAreActive()) {
            // remove tab guards from this component from list of focusable elements
            focusable.splice(0, 1);
            focusable.splice(focusable.length - 1, 1);
        }

        if (!focusable.length) {
            return;
        }

        focusable[fromBottom ? focusable.length - 1 : 0].focus({ preventScroll: true });
    }

    public getNextFocusableElement(backwards?: boolean): HTMLElement | null {
        return this.focusSvc.findNextFocusableElement(this.eFocusableElement, false, backwards);
    }

    public forceFocusOutOfContainer(up: boolean = false): void {
        // avoid multiple calls to `forceFocusOutOfContainer`
        if (this.forcingFocusOut) {
            return;
        }

        const tabGuardToFocus = up ? this.eTopGuard : this.eBottomGuard;

        this.activateTabGuards();
        this.skipTabGuardFocus = true;
        this.forcingFocusOut = true;

        // this focus will set `this.skipTabGuardFocus` to false;
        tabGuardToFocus.focus();

        window.setTimeout(() => {
            this.forcingFocusOut = false;
            this.activateTabGuards();
        });
    }

    public isTabGuard(element: HTMLElement, bottom?: boolean): boolean {
        return (element === this.eTopGuard && !bottom) || (element === this.eBottomGuard && (bottom ?? true));
    }

    public setAllowFocus(allowFocus: boolean): void {
        this.allowFocus = allowFocus;
    }
}
