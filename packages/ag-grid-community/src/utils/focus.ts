import { KeyCode } from '../constants/keyCode';
import type { FocusService } from '../focusService';
import type { Component } from '../widgets/component';

export function _addFocusableContainerListener(comp: Component, eGui: HTMLElement, focusSvc: FocusService): void {
    comp.addManagedElementListeners(eGui, {
        keydown: (e: KeyboardEvent) => {
            if (!e.defaultPrevented && e.key === KeyCode.TAB) {
                const backwards = e.shiftKey;
                if (!focusSvc.findNextFocusableElement(eGui, false, backwards)) {
                    if (focusSvc.focusNextGridCoreContainer(backwards)) {
                        e.preventDefault();
                    }
                }
            }
        },
    });
}
