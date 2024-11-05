import { TabGuardClassNames, _FOCUS_MANAGED_CLASS, _findFocusableElements } from 'ag-grid-community';

export function findFocusableElementBeforeTabGuard(
    rootNode: HTMLElement,
    referenceElement?: HTMLElement
): HTMLElement | null {
    if (!referenceElement) {
        return null;
    }

    const focusableElements = _findFocusableElements(rootNode);
    const referenceIndex = focusableElements.indexOf(referenceElement);

    if (referenceIndex === -1) {
        return null;
    }

    let lastTabGuardIndex = -1;
    for (let i = referenceIndex - 1; i >= 0; i--) {
        if (focusableElements[i].classList.contains(TabGuardClassNames.TAB_GUARD_TOP)) {
            lastTabGuardIndex = i;
            break;
        }
    }

    if (lastTabGuardIndex <= 0) {
        return null;
    }

    return focusableElements[lastTabGuardIndex - 1];
}

export function isTargetUnderManagedComponent(rootNode: HTMLElement, target?: HTMLElement): boolean {
    if (!target) {
        return false;
    }

    const managedContainers = rootNode.querySelectorAll(`.${_FOCUS_MANAGED_CLASS}`);

    if (!managedContainers.length) {
        return false;
    }

    for (let i = 0; i < managedContainers.length; i++) {
        if (managedContainers[i].contains(target)) {
            return true;
        }
    }

    return false;
}
