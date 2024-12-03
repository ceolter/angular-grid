import type { SortDirection } from '../entities/colDef';
import type { LocaleTextFunc } from '../misc/locale/localeUtils';

export type ColumnSortState = 'ascending' | 'descending' | 'other' | 'none';

// ARIA HELPER FUNCTIONS
function _toggleAriaAttribute(element: Element, attribute: string, value?: number | boolean | string | null) {
    if (value == null || (typeof value === 'string' && value == '')) {
        _removeAriaAttribute(element, attribute);
    } else {
        _setAriaAttribute(element, attribute, value);
    }
}

function _setAriaAttribute(element: Element, attribute: string, value: number | boolean | string): void {
    element.setAttribute(_ariaAttributeName(attribute), value.toString());
}

function _removeAriaAttribute(element: Element, attribute: string): void {
    element.removeAttribute(_ariaAttributeName(attribute));
}

function _ariaAttributeName(attribute: string) {
    return `aria-${attribute}`;
}

export function _setAriaRole(element: Element, role?: string | null) {
    if (role) {
        element.setAttribute('role', role);
    } else {
        element.removeAttribute('role');
    }
}

export function _getAriaSortState(sortDirection: SortDirection | 'mixed'): ColumnSortState {
    let sort: ColumnSortState;

    if (sortDirection === 'asc') {
        sort = 'ascending';
    } else if (sortDirection === 'desc') {
        sort = 'descending';
    } else if (sortDirection === 'mixed') {
        sort = 'other';
    } else {
        sort = 'none';
    }

    return sort;
}

// ARIA ATTRIBUTE GETTERS
export function _getAriaLevel(element: Element): number {
    return parseInt(element.getAttribute('aria-level')!, 10);
}

export function _getAriaPosInSet(element: Element): number {
    return parseInt(element.getAttribute('aria-posinset')!, 10);
}

export function _getAriaLabel(element: Element): string | null {
    return element.getAttribute('aria-label');
}

// ARIA ATTRIBUTE SETTERS
export function _setAriaLabel(element: Element, label?: string | null): void {
    _toggleAriaAttribute(element, 'label', label);
}

export function _setAriaLabelledBy(element: Element, labelledBy?: string): void {
    _toggleAriaAttribute(element, 'labelledby', labelledBy);
}

export function _setAriaDescribedBy(element: Element, describedby?: string): void {
    _toggleAriaAttribute(element, 'describedby', describedby);
}

export function _setAriaLive(element: Element, live?: 'polite' | 'assertive' | 'off' | null) {
    _toggleAriaAttribute(element, 'live', live);
}

export function _setAriaAtomic(element: Element, atomic: boolean | null) {
    _toggleAriaAttribute(element, 'atomic', atomic);
}

export function _setAriaRelevant(
    element: Element,
    relevant: 'additions' | 'additions text' | 'all' | 'removals' | 'text' | null
) {
    _toggleAriaAttribute(element, 'relevant', relevant);
}

export function _setAriaLevel(element: Element, level: number): void {
    _toggleAriaAttribute(element, 'level', level);
}

export function _setAriaDisabled(element: Element, disabled: boolean): void {
    _toggleAriaAttribute(element, 'disabled', disabled);
}

export function _setAriaHidden(element: Element, hidden: boolean): void {
    _toggleAriaAttribute(element, 'hidden', hidden);
}

export function _setAriaActiveDescendant(element: Element, descendantId: string | null): void {
    _toggleAriaAttribute(element, 'activedescendant', descendantId);
}

export function _setAriaExpanded(element: Element, expanded: boolean): void {
    _setAriaAttribute(element, 'expanded', expanded);
}

export function _removeAriaExpanded(element: Element): void {
    _removeAriaAttribute(element, 'expanded');
}

export function _setAriaSetSize(element: Element, setsize: number): void {
    _setAriaAttribute(element, 'setsize', setsize);
}

export function _setAriaPosInSet(element: Element, position: number): void {
    _setAriaAttribute(element, 'posinset', position);
}

export function _setAriaMultiSelectable(element: Element, multiSelectable: boolean): void {
    _setAriaAttribute(element, 'multiselectable', multiSelectable);
}

export function _setAriaRowCount(element: Element, rowCount: number): void {
    _setAriaAttribute(element, 'rowcount', rowCount);
}

export function _setAriaRowIndex(element: Element, rowIndex: number): void {
    _setAriaAttribute(element, 'rowindex', rowIndex);
}

export function _setAriaColCount(element: Element, colCount: number): void {
    _setAriaAttribute(element, 'colcount', colCount);
}

export function _setAriaColIndex(element: Element, colIndex: number): void {
    _setAriaAttribute(element, 'colindex', colIndex);
}

export function _setAriaColSpan(element: Element, colSpan: number): void {
    _setAriaAttribute(element, 'colspan', colSpan);
}

export function _setAriaSort(element: Element, sort: ColumnSortState): void {
    _setAriaAttribute(element, 'sort', sort);
}

export function _removeAriaSort(element: Element): void {
    _removeAriaAttribute(element, 'sort');
}

export function _setAriaSelected(element: Element, selected?: boolean): void {
    _toggleAriaAttribute(element, 'selected', selected);
}

export function _setAriaChecked(element: Element, checked?: boolean) {
    _setAriaAttribute(element, 'checked', checked === undefined ? 'mixed' : checked);
}

export function _setAriaControls(controllerElement: Element, controlledElement: Element) {
    _toggleAriaAttribute(controllerElement, 'controls', controlledElement.id);
    _setAriaLabelledBy(controlledElement, controllerElement.id);
}

export function _getAriaCheckboxStateName(translate: LocaleTextFunc, state?: boolean): string {
    return state === undefined
        ? translate('ariaIndeterminate', 'indeterminate')
        : state === true
          ? translate('ariaChecked', 'checked')
          : translate('ariaUnchecked', 'unchecked');
}
