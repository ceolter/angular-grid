import type { Component, RichSelectParams } from 'ag-grid-community';
import {
    KeyCode,
    _getDocument,
    _requestAnimationFrame,
    _setAriaActiveDescendant,
    _setAriaControls,
    _setAriaLabel,
} from 'ag-grid-community';

import { RichSelectRow } from './agRichSelectRow';
import { VirtualList } from './virtualList';

export type AgRichSelectListEvent = 'fieldPickerValueSelected' | 'richSelectListRowSelected';

const LIST_COMPONENT_NAME = 'ag-rich-select-list';
const ROW_COMPONENT_NAME = 'ag-rich-select-row';

export class AgRichSelectList<TValue, TEventType extends string = AgRichSelectListEvent> extends VirtualList<
    Component<TEventType | AgRichSelectListEvent>,
    TEventType | AgRichSelectListEvent
> {
    private eLoading: HTMLElement | undefined;
    private lastRowHovered: number = -1;
    private currentList: TValue[] | undefined;
    private selectedItems: Set<TValue> = new Set<TValue>();

    constructor(
        private readonly params: RichSelectParams,
        private readonly richSelectWrapper: HTMLElement,
        private readonly getSearchString: () => string
    ) {
        super({ cssIdentifier: 'rich-select' });
        this.params = params;
        this.setComponentCreator(this.createRowComponent.bind(this));
        /* nothing to update but method required to soft refresh */
        this.setComponentUpdater(() => {});
    }

    public override postConstruct(): void {
        super.postConstruct();
        this.createLoadingElement();

        const { cellRowHeight, pickerAriaLabelKey, pickerAriaLabelValue } = this.params;

        if (cellRowHeight) {
            this.setRowHeight(cellRowHeight);
        }

        const eGui = this.getGui();
        const eListAriaEl = this.getAriaElement();

        this.addManagedListeners(eGui, {
            mousemove: this.onMouseMove.bind(this),
            mouseout: this.onMouseOut.bind(this),
            mousedown: this.onMouseDown.bind(this),
            click: this.onClick.bind(this),
        });

        eGui.classList.add(LIST_COMPONENT_NAME);

        const listId = `${LIST_COMPONENT_NAME}-${this.getCompId()}`;
        eListAriaEl.setAttribute('id', listId);
        const translate = this.getLocaleTextFunc();
        const ariaLabel = translate(pickerAriaLabelKey, pickerAriaLabelValue);

        _setAriaLabel(eListAriaEl, ariaLabel);
        _setAriaControls(this.richSelectWrapper, eListAriaEl);
    }

    public override navigateToPage(key: 'PageUp' | 'PageDown' | 'Home' | 'End'): number | null {
        const newIndex = super.navigateToPage(key, this.lastRowHovered);

        if (newIndex != null) {
            _requestAnimationFrame(this.beans, () => {
                if (!this.isAlive()) {
                    return null;
                }
                this.highlightIndex(newIndex);
            });
        }

        return newIndex;
    }

    protected override drawVirtualRows(softRefresh?: boolean | undefined): void {
        super.drawVirtualRows(softRefresh);

        this.refreshSelectedItems();
    }

    public highlightFilterMatch(searchString: string): void {
        this.forEachRenderedRow((cmp: RichSelectRow<TValue>) => {
            cmp.highlightString(searchString);
        });
    }

    public onNavigationKeyDown(key: string, announceItem: () => void): void {
        _requestAnimationFrame(this.beans, () => {
            if (!this.currentList || !this.isAlive()) {
                return;
            }
            const len = this.currentList.length;
            const oldIndex = this.lastRowHovered;

            const diff = key === KeyCode.DOWN ? 1 : -1;
            const newIndex = Math.min(Math.max(oldIndex === -1 ? 0 : oldIndex + diff, 0), len - 1);
            this.highlightIndex(newIndex);
            announceItem();
        });
    }

    public selectValue(value?: TValue[] | TValue): boolean {
        if (!this.currentList) {
            if (this.eLoading) {
                this.appendChild(this.eLoading);
            }
            return false;
        }

        if (this.eLoading?.offsetParent) {
            this.eLoading.parentElement?.removeChild(this.eLoading);
        }

        if (value == null) {
            return false;
        }

        const selectedPositions = this.getIndicesForValues(value);

        const refresh = selectedPositions.length > 0;

        if (refresh) {
            // make sure the virtual list has been sized correctly
            this.refresh();
            this.ensureIndexVisible(selectedPositions[0]);
            // this second call to refresh is necessary to force scrolled elements
            // to be rendered with the correct index info.
            this.refresh(true);
        }

        this.selectListItems(Array.isArray(value) ? value : [value]);

        return refresh;
    }

    private selectListItems(values: TValue[], append = false): void {
        if (!append) {
            this.selectedItems.clear();
        }

        for (let i = 0; i < values.length; i++) {
            const currentItem = values[i];
            if (this.selectedItems.has(currentItem)) {
                continue;
            }
            this.selectedItems.add(currentItem);
        }

        this.refreshSelectedItems();
    }

    public getCurrentList(): TValue[] | undefined {
        return this.currentList;
    }

    public setCurrentList(list: TValue[]): void {
        this.currentList = list;

        this.setModel({
            getRowCount: () => list.length,
            getRow: (index: number) => list[index],
            areRowsEqual: (oldRow, newRow) => oldRow === newRow,
        });
    }

    public getSelectedItems(): Set<TValue> {
        return this.selectedItems;
    }

    public getLastItemHovered(): TValue {
        return this.currentList![this.lastRowHovered];
    }

    public highlightIndex(index: number, preventUnnecessaryScroll?: boolean): void {
        if (!this.currentList) {
            return;
        }

        if (index < 0 || index >= this.currentList.length) {
            this.lastRowHovered = -1;
        } else {
            this.lastRowHovered = index;

            const wasScrolled = this.ensureIndexVisible(index, !preventUnnecessaryScroll);

            if (wasScrolled && !preventUnnecessaryScroll) {
                this.refresh(true);
            }
        }

        this.forEachRenderedRow((cmp: RichSelectRow<TValue>, idx: number) => {
            const highlighted = index === idx;

            cmp.toggleHighlighted(highlighted);

            if (highlighted) {
                const idForParent = `${ROW_COMPONENT_NAME}-${cmp.getCompId()}`;
                _setAriaActiveDescendant(this.richSelectWrapper, idForParent);
                this.richSelectWrapper.setAttribute('data-active-option', idForParent);
            }
        });
    }

    public getIndicesForValues(values?: TValue[] | TValue): number[] {
        const { currentList } = this;

        if (!currentList || currentList.length === 0 || values == null) {
            return [];
        }

        if (!Array.isArray(values)) {
            values = [values] as TValue[];
        }

        if (values.length === 0) {
            return [];
        }

        const positions: number[] = [];

        for (let i = 0; i < values.length; i++) {
            const idx = currentList.indexOf(values[i]);
            if (idx >= 0) {
                positions.push(idx);
            }
        }

        return positions;
    }

    public toggleListItemSelection(value: TValue): void {
        if (this.selectedItems.has(value)) {
            this.selectedItems.delete(value);
        } else {
            this.selectedItems.add(value);
        }

        this.refreshSelectedItems();
        this.dispatchValueSelected();
    }

    private refreshSelectedItems(): void {
        this.forEachRenderedRow((cmp: RichSelectRow<TValue>) => {
            const selected = this.selectedItems.has(cmp.getValue());
            cmp.updateSelected(selected);
        });
    }

    private createLoadingElement(): void {
        const eDocument = _getDocument(this.beans);
        const translate = this.getLocaleTextFunc();
        const el = eDocument.createElement('div');

        el.classList.add('ag-loading-text');
        // eslint-disable-next-line no-restricted-properties -- Could swap to textContent, but could be a breaking change
        el.innerText = translate('loadingOoo', 'Loading...');
        this.eLoading = el;
    }

    private createRowComponent(value: TValue, listItemElement: HTMLElement): Component<AgRichSelectListEvent> {
        const row = new RichSelectRow<TValue>(this.params);
        listItemElement.setAttribute('id', `${ROW_COMPONENT_NAME}-${row.getCompId()}`);
        row.setParentComponent(this);
        this.createBean(row);
        row.setState(value);

        const { highlightMatch, searchType = 'fuzzy' } = this.params;

        if (highlightMatch && searchType !== 'fuzzy') {
            row.highlightString(this.getSearchString());
        }

        return row;
    }

    private getRowForMouseEvent(e: MouseEvent): number {
        const eGui = this.getGui();
        const rect = eGui.getBoundingClientRect();
        const scrollTop = this.getScrollTop();
        const mouseY = e.clientY - rect.top + scrollTop;

        return Math.floor(mouseY / this.getRowHeight());
    }

    private onMouseMove(e: MouseEvent): void {
        const row = this.getRowForMouseEvent(e);

        if (row !== -1 && row != this.lastRowHovered) {
            this.lastRowHovered = row;
            this.highlightIndex(row, true);
        }
    }

    private onMouseDown(e: MouseEvent): void {
        // this prevents the list from receiving focus as it
        // should be controlled by the agRichSelect component
        e.preventDefault();
    }

    private onMouseOut(e: MouseEvent): void {
        if (!this.getGui().contains(e.relatedTarget as HTMLElement)) {
            this.highlightIndex(-1);
        }
    }

    private onClick(e: MouseEvent): void {
        const { multiSelect } = this.params;

        if (!this.currentList) {
            return;
        }

        const row = this.getRowForMouseEvent(e);
        const item = this.currentList[row];

        if (multiSelect) {
            this.toggleListItemSelection(item);
        } else {
            this.selectListItems([item]);
            this.dispatchValueSelected();
        }
    }

    private dispatchValueSelected(): void {
        this.dispatchLocalEvent({
            type: 'richSelectListRowSelected',
            fromEnterKey: false,
            value: this.selectedItems,
        });
    }

    public override destroy(): void {
        super.destroy();
        this.eLoading = undefined;
    }
}
