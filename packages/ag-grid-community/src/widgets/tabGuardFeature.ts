import { BeanStub } from '../context/beanStub';
import { _getDocument } from '../gridOptionsUtils';
import { _setAriaRole } from '../utils/aria';
import { _clearElement, _isNodeOrElement } from '../utils/dom';
import type { Component } from './component';
import type { ITabGuard } from './tabGuardCtrl';
import { TabGuardClassNames, TabGuardCtrl } from './tabGuardCtrl';

export interface TabGuardParams {
    focusInnerElement?: (fromBottom: boolean) => void;
    shouldStopEventPropagation?: () => boolean;
    /**
     * @return `true` to prevent the default onFocusIn behavior
     */
    onFocusIn?: (e: FocusEvent) => void;
    /**
     * @return `true` to prevent the default onFocusOut behavior
     */
    onFocusOut?: (e: FocusEvent) => void;
    onTabKeyDown?: (e: KeyboardEvent) => void;
    handleKeyDown?: (e: KeyboardEvent) => void;
    /**
     * Set to true to create a circular focus pattern when keyboard tabbing.
     */
    focusTrapActive?: boolean;
    /**
     * Set to true to find a focusable element outside of the TabGuards to focus
     */
    forceFocusOutWhenTabGuardsAreEmpty?: boolean;
    isFocusableContainer?: boolean;
}

export class TabGuardFeature extends BeanStub {
    private eTopGuard: HTMLElement;
    private eBottomGuard: HTMLElement;
    private eFocusableElement: HTMLElement;

    private tabGuardCtrl: TabGuardCtrl;

    constructor(private readonly comp: Component<any>) {
        super();
    }

    public initialiseTabGuard(params: TabGuardParams) {
        this.eTopGuard = this.createTabGuard('top');
        this.eBottomGuard = this.createTabGuard('bottom');
        this.eFocusableElement = this.comp.getFocusableElement();

        const { eTopGuard, eBottomGuard, eFocusableElement } = this;

        const tabGuards = [eTopGuard, eBottomGuard];

        const compProxy: ITabGuard = {
            setTabIndex: (tabIndex) => {
                tabGuards.forEach((tabGuard) =>
                    tabIndex != null
                        ? tabGuard.setAttribute('tabindex', tabIndex)
                        : tabGuard.removeAttribute('tabindex')
                );
            },
        };

        this.addTabGuards(eTopGuard, eBottomGuard);

        const {
            focusTrapActive = false,
            onFocusIn,
            onFocusOut,
            focusInnerElement,
            handleKeyDown,
            onTabKeyDown,
            shouldStopEventPropagation,
            forceFocusOutWhenTabGuardsAreEmpty,
            isFocusableContainer,
        } = params;

        this.tabGuardCtrl = this.createManagedBean(
            new TabGuardCtrl({
                comp: compProxy,
                focusTrapActive,
                eTopGuard,
                eBottomGuard,
                eFocusableElement,
                onFocusIn,
                onFocusOut,
                focusInnerElement,
                handleKeyDown,
                onTabKeyDown,
                shouldStopEventPropagation,
                forceFocusOutWhenTabGuardsAreEmpty,
                isFocusableContainer,
            })
        );
    }

    public getTabGuardCtrl(): TabGuardCtrl {
        return this.tabGuardCtrl;
    }

    private createTabGuard(side: 'top' | 'bottom'): HTMLElement {
        const tabGuard = _getDocument(this.beans).createElement('div');
        const cls = side === 'top' ? TabGuardClassNames.TAB_GUARD_TOP : TabGuardClassNames.TAB_GUARD_BOTTOM;

        tabGuard.classList.add(TabGuardClassNames.TAB_GUARD, cls);
        _setAriaRole(tabGuard, 'presentation');

        return tabGuard;
    }

    private addTabGuards(topTabGuard: HTMLElement, bottomTabGuard: HTMLElement): void {
        this.eFocusableElement.insertAdjacentElement('afterbegin', topTabGuard);
        this.eFocusableElement.insertAdjacentElement('beforeend', bottomTabGuard);
    }

    public removeAllChildrenExceptTabGuards(): void {
        const tabGuards: [HTMLElement, HTMLElement] = [this.eTopGuard, this.eBottomGuard];
        _clearElement(this.comp.getFocusableElement());
        this.addTabGuards(...tabGuards);
    }

    public forceFocusOutOfContainer(up: boolean = false): void {
        this.tabGuardCtrl.forceFocusOutOfContainer(up);
    }

    public appendChild(
        appendChild: (newChild: HTMLElement | Component<any>, container?: HTMLElement) => void,
        newChild: Component | HTMLElement,
        container?: HTMLElement | undefined
    ): void {
        if (!_isNodeOrElement(newChild)) {
            newChild = newChild.getGui();
        }

        const { eBottomGuard: bottomTabGuard } = this;

        if (bottomTabGuard) {
            bottomTabGuard.insertAdjacentElement('beforebegin', newChild as HTMLElement);
        } else {
            appendChild(newChild, container);
        }
    }
}
