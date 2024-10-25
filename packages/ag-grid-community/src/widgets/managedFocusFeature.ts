import { KeyCode } from '../constants/keyCode';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { FocusService } from '../focusService';
import { _isStopPropagationForAgGrid, _stopPropagationForAgGrid } from '../utils/event';

export interface ManagedFocusCallbacks {
    shouldStopEventPropagation?: (e: KeyboardEvent) => boolean;
    onTabKeyDown?: (e: KeyboardEvent) => void;
    handleKeyDown?: (e: KeyboardEvent) => void;
    onFocusIn?: (e: FocusEvent) => void;
    onFocusOut?: (e: FocusEvent) => void;
}

export const FOCUS_MANAGED_CLASS = 'ag-focus-managed';

export class ManagedFocusFeature extends BeanStub {
    private focusSvc: FocusService;

    public wireBeans(beans: BeanCollection): void {
        this.focusSvc = beans.focusSvc;
    }

    constructor(
        private readonly eFocusableElement: HTMLElement,
        private callbacks: ManagedFocusCallbacks = {}
    ) {
        super();
        this.callbacks = {
            shouldStopEventPropagation: () => false,
            onTabKeyDown: (e: KeyboardEvent) => {
                if (e.defaultPrevented) {
                    return;
                }

                const nextRoot = this.focusSvc.findNextFocusableElement(this.eFocusableElement, false, e.shiftKey);

                if (!nextRoot) {
                    return;
                }

                nextRoot.focus();
                e.preventDefault();
            },
            ...callbacks,
        };
    }

    public postConstruct(): void {
        this.eFocusableElement.classList.add(FOCUS_MANAGED_CLASS);

        this.addKeyDownListeners(this.eFocusableElement);

        if (this.callbacks.onFocusIn) {
            this.addManagedElementListeners(this.eFocusableElement, { focusin: this.callbacks.onFocusIn });
        }

        if (this.callbacks.onFocusOut) {
            this.addManagedElementListeners(this.eFocusableElement, { focusout: this.callbacks.onFocusOut });
        }
    }

    private addKeyDownListeners(eGui: HTMLElement): void {
        this.addManagedElementListeners(eGui, {
            keydown: (e: KeyboardEvent) => {
                if (e.defaultPrevented || _isStopPropagationForAgGrid(e)) {
                    return;
                }

                if (this.callbacks.shouldStopEventPropagation!(e)) {
                    _stopPropagationForAgGrid(e);
                    return;
                }

                if (e.key === KeyCode.TAB) {
                    this.callbacks.onTabKeyDown!(e);
                } else if (this.callbacks.handleKeyDown) {
                    this.callbacks.handleKeyDown(e);
                }
            },
        });
    }
}
