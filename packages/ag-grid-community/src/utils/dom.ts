import type { BeanCollection } from '../context/context';
import type { CellStyle } from '../entities/colDef';
import type { RowStyle } from '../entities/gridOptions';
import { _getWindow } from '../gridOptionsUtils';
import type { ICellRendererComp } from '../rendering/cellRenderers/iCellRenderer';
import { _setAriaHidden } from './aria';
import { _isBrowserChrome, _isBrowserSafari } from './browser';
import type { AgPromise } from './promise';

let rtlNegativeScroll: boolean;

/**
 * This method adds a class to an element and remove that class from all siblings.
 * Useful for toggling state.
 * @param {HTMLElement} element The element to receive the class
 * @param {string} elementClass The class to be assigned to the element
 * @param {boolean} otherElementClass The class to be assigned to siblings of the element, but not the element itself
 */
export function _radioCssClass(element: HTMLElement, elementClass: string | null, otherElementClass?: string | null) {
    const parent = element.parentElement;
    let sibling = parent && (parent.firstChild as HTMLElement);

    while (sibling) {
        if (elementClass) {
            sibling.classList.toggle(elementClass, sibling === element);
        }
        if (otherElementClass) {
            sibling.classList.toggle(otherElementClass, sibling !== element);
        }
        sibling = sibling.nextSibling as HTMLElement;
    }
}

export const FOCUSABLE_SELECTOR = '[tabindex], input, select, button, textarea, [href]';
export const FOCUSABLE_EXCLUDE = '[disabled], .ag-disabled:not(.ag-button), .ag-disabled *';

export function _isFocusableFormField(element: HTMLElement): boolean {
    const matches: (str: string) => boolean = Element.prototype.matches || (Element as any).prototype.msMatchesSelector;

    const inputSelector = 'input, select, button, textarea';
    const isFocusable = matches.call(element, inputSelector);
    const isNotFocusable = matches.call(element, FOCUSABLE_EXCLUDE);
    const isElementVisible = _isVisible(element);

    const focusable = isFocusable && !isNotFocusable && isElementVisible;

    return focusable;
}

export function _setDisplayed(element: Element, displayed: boolean, options: { skipAriaHidden?: boolean } = {}) {
    const { skipAriaHidden } = options;
    element.classList.toggle('ag-hidden', !displayed);
    if (!skipAriaHidden) {
        _setAriaHidden(element, !displayed);
    }
}

export function _setVisible(element: HTMLElement, visible: boolean, options: { skipAriaHidden?: boolean } = {}) {
    const { skipAriaHidden } = options;
    element.classList.toggle('ag-invisible', !visible);
    if (!skipAriaHidden) {
        _setAriaHidden(element, !visible);
    }
}

export function _setDisabled(element: HTMLElement, disabled: boolean) {
    const attributeName = 'disabled';
    const addOrRemoveDisabledAttribute = disabled
        ? (e: HTMLElement) => e.setAttribute(attributeName, '')
        : (e: HTMLElement) => e.removeAttribute(attributeName);

    addOrRemoveDisabledAttribute(element);

    _nodeListForEach(element.querySelectorAll('input'), (input) => addOrRemoveDisabledAttribute(input));
}

export function _isElementChildOfClass(
    element: HTMLElement | null,
    cls: string,
    maxNest?: HTMLElement | number
): boolean {
    let counter = 0;

    while (element) {
        if (element.classList.contains(cls)) {
            return true;
        }

        element = element.parentElement;

        if (typeof maxNest == 'number') {
            if (++counter > maxNest) {
                break;
            }
        } else if (element === maxNest) {
            break;
        }
    }

    return false;
}

// returns back sizes as doubles instead of strings. similar to
// getBoundingClientRect, however getBoundingClientRect does not:
// a) work with fractions (eg browser is zooming)
// b) has CSS transitions applied (eg CSS scale, browser zoom), which we don't want, we want the un-transitioned values
export function _getElementSize(el: HTMLElement): {
    height: number;
    width: number;
    borderTopWidth: number;
    borderRightWidth: number;
    borderBottomWidth: number;
    borderLeftWidth: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
    boxSizing: string;
} {
    const {
        height,
        width,
        borderTopWidth,
        borderRightWidth,
        borderBottomWidth,
        borderLeftWidth,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        boxSizing,
    } = window.getComputedStyle(el);

    return {
        height: parseFloat(height || '0'),
        width: parseFloat(width || '0'),
        borderTopWidth: parseFloat(borderTopWidth || '0'),
        borderRightWidth: parseFloat(borderRightWidth || '0'),
        borderBottomWidth: parseFloat(borderBottomWidth || '0'),
        borderLeftWidth: parseFloat(borderLeftWidth || '0'),
        paddingTop: parseFloat(paddingTop || '0'),
        paddingRight: parseFloat(paddingRight || '0'),
        paddingBottom: parseFloat(paddingBottom || '0'),
        paddingLeft: parseFloat(paddingLeft || '0'),
        marginTop: parseFloat(marginTop || '0'),
        marginRight: parseFloat(marginRight || '0'),
        marginBottom: parseFloat(marginBottom || '0'),
        marginLeft: parseFloat(marginLeft || '0'),
        boxSizing,
    };
}

export function _getInnerHeight(el: HTMLElement): number {
    const size = _getElementSize(el);

    if (size.boxSizing === 'border-box') {
        return size.height - size.paddingTop - size.paddingBottom;
    }

    return size.height;
}

export function _getInnerWidth(el: HTMLElement): number {
    const size = _getElementSize(el);

    if (size.boxSizing === 'border-box') {
        return size.width - size.paddingLeft - size.paddingRight;
    }

    return size.width;
}

export function _getAbsoluteHeight(el: HTMLElement): number {
    const { height, marginBottom, marginTop } = _getElementSize(el);

    return Math.floor(height + marginBottom + marginTop);
}

export function _getAbsoluteWidth(el: HTMLElement): number {
    const { width, marginLeft, marginRight } = _getElementSize(el);

    return Math.floor(width + marginLeft + marginRight);
}

export function _getElementRectWithOffset(el: HTMLElement): {
    top: number;
    left: number;
    right: number;
    bottom: number;
} {
    const offsetElementRect = el.getBoundingClientRect();
    const { borderTopWidth, borderLeftWidth, borderRightWidth, borderBottomWidth } = _getElementSize(el);

    return {
        top: offsetElementRect.top + (borderTopWidth || 0),
        left: offsetElementRect.left + (borderLeftWidth || 0),
        right: offsetElementRect.right + (borderRightWidth || 0),
        bottom: offsetElementRect.bottom + (borderBottomWidth || 0),
    };
}

export function _isRtlNegativeScroll(): boolean {
    if (typeof rtlNegativeScroll === 'boolean') {
        return rtlNegativeScroll;
    }

    const template = document.createElement('div');
    template.style.direction = 'rtl';
    template.style.width = '1px';
    template.style.height = '1px';
    template.style.position = 'fixed';
    template.style.top = '0px';
    template.style.overflow = 'hidden';
    template.dir = 'rtl';
    template.innerHTML =
        /* html */
        `<div style="width: 2px">
            <span style="display: inline-block; width: 1px"></span>
            <span style="display: inline-block; width: 1px"></span>
        </div>`;

    document.body.appendChild(template);

    template.scrollLeft = 1;
    rtlNegativeScroll = Math.floor(template.scrollLeft) === 0;
    document.body.removeChild(template);

    return rtlNegativeScroll;
}

export function _getScrollLeft(element: HTMLElement, rtl: boolean): number {
    let scrollLeft = element.scrollLeft;

    if (rtl) {
        // Absolute value - for FF that reports RTL scrolls in negative numbers
        scrollLeft = Math.abs(scrollLeft);

        if (_isBrowserChrome() && !_isRtlNegativeScroll()) {
            scrollLeft = element.scrollWidth - element.getBoundingClientRect().width - scrollLeft;
        }
    }

    return scrollLeft;
}

export function _setScrollLeft(element: HTMLElement, value: number, rtl: boolean): void {
    if (rtl) {
        // Chrome and Safari when doing RTL have the END position of the scroll as zero, not the start
        if (_isRtlNegativeScroll()) {
            value *= -1;
        } else if (_isBrowserSafari() || _isBrowserChrome()) {
            value = element.scrollWidth - element.getBoundingClientRect().width - value;
        }
    }
    element.scrollLeft = value;
}

export function _clearElement(el: HTMLElement): void {
    while (el && el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

export function _removeFromParent(node: Element | null) {
    if (node && node.parentNode) {
        node.parentNode.removeChild(node);
    }
}

export function _isInDOM(element: HTMLElement): boolean {
    return !!element.offsetParent;
}

export function _isVisible(element: HTMLElement) {
    const el = element as any;
    if (el.checkVisibility) {
        return el.checkVisibility({ checkVisibilityCSS: true });
    }

    const isHidden = !_isInDOM(element) || window.getComputedStyle(element).visibility !== 'visible';
    return !isHidden;
}

/**
 * Loads the template and returns it as an element. makes up for no simple way in
 * the dom api to load html directly, eg we cannot do this: document.createElement(template)
 * @param {string} template
 * @returns {HTMLElement}
 */
export function _loadTemplate(template: string): HTMLElement {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = (template || '').trim();

    return tempDiv.firstChild as HTMLElement;
}

export function _ensureDomOrder(eContainer: HTMLElement, eChild: HTMLElement, eChildBefore?: HTMLElement | null): void {
    // if already in right order, do nothing
    if (eChildBefore && eChildBefore.nextSibling === eChild) {
        return;
    }

    if (eChildBefore) {
        if (eChildBefore.nextSibling) {
            // insert between the eRowBefore and the row after it
            eContainer.insertBefore(eChild, eChildBefore.nextSibling);
        } else {
            // if nextSibling is missing, means other row is at end, so just append new row at the end
            eContainer.appendChild(eChild);
        }
    } else {
        // otherwise put at start
        if (eContainer.firstChild && eContainer.firstChild !== eChild) {
            // insert it at the first location
            eContainer.insertAdjacentElement('afterbegin', eChild);
        }
    }
}

export function _setDomChildOrder(eContainer: HTMLElement, orderedChildren: (HTMLElement | null)[]): void {
    for (let i = 0; i < orderedChildren.length; i++) {
        const correctCellAtIndex = orderedChildren[i];
        const actualCellAtIndex = eContainer.children[i];

        if (actualCellAtIndex !== correctCellAtIndex) {
            eContainer.insertBefore(correctCellAtIndex!, actualCellAtIndex);
        }
    }
}

export function _insertWithDomOrder(
    eContainer: HTMLElement,
    eToInsert: HTMLElement,
    eChildBefore: HTMLElement | null
): void {
    if (eChildBefore) {
        // if previous element exists, just slot in after the previous element
        eChildBefore.insertAdjacentElement('afterend', eToInsert);
    } else {
        if (eContainer.firstChild) {
            // insert it at the first location
            eContainer.insertAdjacentElement('afterbegin', eToInsert);
        } else {
            // otherwise eContainer is empty, so just append it
            eContainer.appendChild(eToInsert);
        }
    }
}

/**
 * Converts a camelCase string into hyphenated string
 * @param {string} camelCase
 * @return {string}
 */
function _camelCaseToHyphenated(camelCase: string): string {
    return camelCase.replace(/[A-Z]/g, (s) => `-${s.toLocaleLowerCase()}`);
}

export function _addStylesToElement(eElement: any, styles: RowStyle | CellStyle | null | undefined) {
    if (!styles) {
        return;
    }

    for (const [key, value] of Object.entries(styles)) {
        if (!key || !key.length || value == null) {
            continue;
        }

        // changes the key from camelCase into a hyphenated-string
        const parsedKey = _camelCaseToHyphenated(key);
        const valueAsString = value.toString();
        const parsedValue = valueAsString.replace(/\s*!important/g, '');
        const priority = parsedValue.length != valueAsString.length ? 'important' : undefined;

        eElement.style.setProperty(parsedKey, parsedValue, priority);
    }
}

export function _isHorizontalScrollShowing(element: HTMLElement): boolean {
    return element.clientWidth < element.scrollWidth;
}

export function _isVerticalScrollShowing(element: HTMLElement): boolean {
    return element.clientHeight < element.scrollHeight;
}

export function _setElementWidth(element: HTMLElement, width: string | number) {
    if (width === 'flex') {
        element.style.removeProperty('width');
        element.style.removeProperty('minWidth');
        element.style.removeProperty('maxWidth');
        element.style.flex = '1 1 auto';
    } else {
        _setFixedWidth(element, width);
    }
}

export function _setFixedWidth(element: HTMLElement, width: string | number) {
    width = _formatSize(width);
    element.style.width = width.toString();
    element.style.maxWidth = width.toString();
    element.style.minWidth = width.toString();
}

export function _setElementHeight(element: HTMLElement, height: string | number) {
    if (height === 'flex') {
        element.style.removeProperty('height');
        element.style.removeProperty('minHeight');
        element.style.removeProperty('maxHeight');
        element.style.flex = '1 1 auto';
    } else {
        _setFixedHeight(element, height);
    }
}

export function _setFixedHeight(element: HTMLElement, height: string | number) {
    height = _formatSize(height);
    element.style.height = height.toString();
    element.style.maxHeight = height.toString();
    element.style.minHeight = height.toString();
}

export function _formatSize(size: number | string) {
    if (typeof size === 'number') {
        return `${size}px`;
    }

    return size;
}

export function _isNodeOrElement(o: any): o is Node | Element {
    return o instanceof Node || o instanceof HTMLElement;
}

/**
 * Makes a copy of a node list into a list
 * @param {NodeList} nodeList
 * @returns {Node[]}
 */
export function _copyNodeList(nodeList: NodeListOf<Node> | null): Node[] {
    if (nodeList == null) {
        return [];
    }

    const result: Node[] = [];

    _nodeListForEach(nodeList, (node) => result.push(node));

    return result;
}

export function _iterateNamedNodeMap(map: NamedNodeMap, callback: (key: string, value: string) => void): void {
    if (!map) {
        return;
    }

    for (let i = 0; i < map.length; i++) {
        const attr = map[i];
        callback(attr.name, attr.value);
    }
}

export function _addOrRemoveAttribute(element: HTMLElement, name: string, value: string | number | null | undefined) {
    if (value == null || value === '') {
        element.removeAttribute(name);
    } else {
        element.setAttribute(name, value.toString());
    }
}

export function _nodeListForEach<T extends Node>(nodeList: NodeListOf<T> | null, action: (value: T) => void): void {
    if (nodeList == null) {
        return;
    }

    for (let i = 0; i < nodeList.length; i++) {
        action(nodeList[i]);
    }
}

/**
 * cell renderers are used in a few places. they bind to dom slightly differently to other cell renders as they
 * can return back strings (instead of html element) in the getGui() method. common code placed here to handle that.
 * @param {AgPromise<ICellRendererComp>} cellRendererPromise
 * @param {HTMLElement} eTarget
 */
export function _bindCellRendererToHtmlElement(
    cellRendererPromise: AgPromise<ICellRendererComp>,
    eTarget: HTMLElement
) {
    cellRendererPromise.then((cellRenderer) => {
        const gui: HTMLElement | string = cellRenderer!.getGui();

        if (gui != null) {
            if (typeof gui === 'object') {
                eTarget.appendChild(gui);
            } else {
                eTarget.innerHTML = gui;
            }
        }
    });
}

export function _observeResize(beans: BeanCollection, element: HTMLElement, callback: () => void): () => void {
    const win = _getWindow(beans);
    const ResizeObserverImpl = win.ResizeObserver;
    const resizeObserver = ResizeObserverImpl ? new ResizeObserverImpl(callback) : null;
    resizeObserver?.observe(element);
    return () => resizeObserver?.disconnect();
}
