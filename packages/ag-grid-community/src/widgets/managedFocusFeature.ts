import { KeyCode } from '../constants/keyCode';
import { BeanStub } from '../context/beanStub';
import { _isStopPropagationForAgGrid, _stopPropagationForAgGrid } from '../utils/event';
import { _findNextFocusableElement } from '../utils/focus';

export interface ManagedFocusCallbacks {
    shouldStopEventPropagation?: (e: KeyboardEvent) => boolean;
    onTabKeyDown?: (e: KeyboardEvent) => void;
    handleKeyDown?: (e: KeyboardEvent) => void;
    onFocusIn?: (e: FocusEvent) => void;
    onFocusOut?: (e: FocusEvent) => void;
}

export const FOCUS_MANAGED_CLASS = 'ag-focus-managed';

export class ManagedFocusFeature extends BeanStub {
    constructor(
        private readonly eFocusable: HTMLElement,
        private callbacks: ManagedFocusCallbacks = {}
    ) {
        super();
        this.callbacks = {
            shouldStopEventPropagation: () => false,
            onTabKeyDown: (e: KeyboardEvent) => {
                if (e.defaultPrevented) {
                    return;
                }

                const nextRoot = _findNextFocusableElement(this.beans, this.eFocusable, false, e.shiftKey);

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
        const {
            eFocusable,
            callbacks: { onFocusIn, onFocusOut },
        } = this;
        eFocusable.classList.add(FOCUS_MANAGED_CLASS);

        this.addKeyDownListeners(eFocusable);

        if (onFocusIn) {
            this.addManagedElementListeners(eFocusable, { focusin: onFocusIn });
        }

        if (onFocusOut) {
            this.addManagedElementListeners(eFocusable, { focusout: onFocusOut });
        }
    }

    private addKeyDownListeners(eGui: HTMLElement): void {
        this.addManagedElementListeners(eGui, {
            keydown: (e: KeyboardEvent) => {
                if (e.defaultPrevented || _isStopPropagationForAgGrid(e)) {
                    return;
                }

                const { callbacks } = this;

                if (callbacks.shouldStopEventPropagation!(e)) {
                    _stopPropagationForAgGrid(e);
                    return;
                }

                if (e.key === KeyCode.TAB) {
                    callbacks.onTabKeyDown!(e);
                } else if (callbacks.handleKeyDown) {
                    callbacks.handleKeyDown(e);
                }
            },
        });
    }
}
