import { KeyCode } from '../constants/keyCode';
import type { BeanCollection } from '../context/context';
import { _getActiveDomElement, _getDocument } from '../gridOptionsUtils';
import type { Component } from '../widgets/component';
import { _last } from './array';
import { _getTabIndex } from './browser';
import { FOCUSABLE_EXCLUDE, FOCUSABLE_SELECTOR, _isVisible } from './dom';

let keyboardModeActive: boolean = false;
let instanceCount: number = 0;

function addKeyboardModeEvents(doc: Document): void {
    if (instanceCount > 0) {
        return;
    }
    doc.addEventListener('keydown', toggleKeyboardMode);
    doc.addEventListener('mousedown', toggleKeyboardMode);
}

function removeKeyboardModeEvents(doc: Document): void {
    if (instanceCount > 0) return;
    doc.removeEventListener('keydown', toggleKeyboardMode);
    doc.removeEventListener('mousedown', toggleKeyboardMode);
}

function toggleKeyboardMode(event: KeyboardEvent | MouseEvent | TouchEvent): void {
    const isKeyboardActive = keyboardModeActive;
    const isKeyboardEvent = event.type === 'keydown';

    if (isKeyboardEvent) {
        // the following keys should not toggle keyboard mode.
        if (event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }
    }

    if (isKeyboardActive === isKeyboardEvent) {
        return;
    }

    keyboardModeActive = isKeyboardEvent;
}

export function _registerKeyboardFocusEvents(beans: BeanCollection): () => void {
    const eDocument = _getDocument(beans);
    addKeyboardModeEvents(eDocument);

    instanceCount++;
    return () => {
        instanceCount--;
        removeKeyboardModeEvents(eDocument);
    };
}

export function _isKeyboardMode(): boolean {
    return keyboardModeActive;
}

export function _addFocusableContainerListener(beans: BeanCollection, comp: Component, eGui: HTMLElement): void {
    comp.addManagedElementListeners(eGui, {
        keydown: (e: KeyboardEvent) => {
            if (!e.defaultPrevented && e.key === KeyCode.TAB) {
                const backwards = e.shiftKey;
                if (!_findNextFocusableElement(beans, eGui, false, backwards)) {
                    if (_focusNextGridCoreContainer(beans, backwards)) {
                        e.preventDefault();
                    }
                }
            }
        },
    });
}

export function _findFocusableElements(
    rootNode: HTMLElement,
    exclude?: string | null,
    onlyUnmanaged = false
): HTMLElement[] {
    const focusableString = FOCUSABLE_SELECTOR;
    let excludeString = FOCUSABLE_EXCLUDE;

    if (exclude) {
        excludeString += ', ' + exclude;
    }

    if (onlyUnmanaged) {
        excludeString += ', [tabindex="-1"]';
    }

    const nodes = Array.prototype.slice
        .apply(rootNode.querySelectorAll(focusableString))
        .filter((node: HTMLElement) => {
            return _isVisible(node);
        }) as HTMLElement[];
    const excludeNodes = Array.prototype.slice.apply(rootNode.querySelectorAll(excludeString)) as HTMLElement[];

    if (!excludeNodes.length) {
        return nodes;
    }

    const diff = (a: HTMLElement[], b: HTMLElement[]) => a.filter((element) => b.indexOf(element) === -1);
    return diff(nodes, excludeNodes);
}

export function _focusInto(
    rootNode: HTMLElement,
    up = false,
    onlyUnmanaged = false,
    excludeTabGuards = false
): boolean {
    const focusableElements = _findFocusableElements(
        rootNode,
        excludeTabGuards ? '.ag-tab-guard' : null,
        onlyUnmanaged
    );
    const toFocus = up ? _last(focusableElements) : focusableElements[0];

    if (toFocus) {
        toFocus.focus({ preventScroll: true });
        return true;
    }

    return false;
}

export function _findNextFocusableElement(
    beans: BeanCollection,
    rootNode: HTMLElement,
    onlyManaged?: boolean | null,
    backwards?: boolean
): HTMLElement | null {
    const focusable = _findFocusableElements(rootNode, onlyManaged ? ':not([tabindex="-1"])' : null);
    const activeEl = _getActiveDomElement(beans) as HTMLElement;
    let currentIndex: number;

    if (onlyManaged) {
        currentIndex = focusable.findIndex((el) => el.contains(activeEl));
    } else {
        currentIndex = focusable.indexOf(activeEl);
    }

    const nextIndex = currentIndex + (backwards ? -1 : 1);

    if (nextIndex < 0 || nextIndex >= focusable.length) {
        return null;
    }

    return focusable[nextIndex];
}

export function _findTabbableParent(node: HTMLElement | null, limit: number = 5): HTMLElement | null {
    let counter = 0;

    while (node && _getTabIndex(node) === null && ++counter <= limit) {
        node = node.parentElement;
    }

    if (_getTabIndex(node) === null) {
        return null;
    }

    return node;
}

export function _focusGridInnerElement(beans: BeanCollection, fromBottom?: boolean): boolean {
    return beans.ctrlsSvc.get('gridCtrl').focusInnerElement(fromBottom);
}

export function _isHeaderFocusSuppressed(beans: BeanCollection): boolean {
    return beans.gos.get('suppressHeaderFocus') || !!beans.overlays?.isExclusive();
}

export function _isCellFocusSuppressed(beans: BeanCollection): boolean {
    return beans.gos.get('suppressCellFocus') || !!beans.overlays?.isExclusive();
}

export function _focusNextGridCoreContainer(
    beans: BeanCollection,
    backwards: boolean,
    forceOut: boolean = false
): boolean {
    const gridCtrl = beans.ctrlsSvc.get('gridCtrl');
    if (!forceOut && gridCtrl.focusNextInnerContainer(backwards)) {
        return true;
    }

    if (forceOut || (!backwards && !gridCtrl.isDetailGrid())) {
        gridCtrl.forceFocusOutOfContainer(backwards);
    }

    return false;
}
