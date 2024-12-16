import type { BeanCollection, Component, ComponentEvent, CssVariablesChanged, Environment } from 'ag-grid-community';
import {
    KeyCode,
    RefPlaceholder,
    TabGuardComp,
    _getAriaPosInSet,
    _observeResize,
    _requestAnimationFrame,
    _setAriaLabel,
    _setAriaPosInSet,
    _setAriaRole,
    _setAriaSetSize,
    _stopPropagationForAgGrid,
    _waitUntil,
    _warn,
} from 'ag-grid-community';

import type { VirtualListModel } from './iVirtualList';

interface VirtualListParams {
    cssIdentifier?: string;
    ariaRole?: string;
    listName?: string;
}

function getVirtualListTemplate(cssIdentifier: string) {
    return (
        /* html */
        `<div class="ag-virtual-list-viewport ag-${cssIdentifier}-virtual-list-viewport" role="presentation">
            <div class="ag-virtual-list-container ag-${cssIdentifier}-virtual-list-container" data-ref="eContainer"></div>
        </div>`
    );
}

export class VirtualList<
    C extends Component<any> = Component<any>,
    TEventType extends string = ComponentEvent,
> extends TabGuardComp<TEventType> {
    private environment: Environment;

    public wireBeans(beans: BeanCollection): void {
        this.environment = beans.environment;
    }

    private readonly cssIdentifier: string;
    private readonly ariaRole: string;
    private listName?: string;

    private model: VirtualListModel;
    private renderedRows = new Map<number, { rowComponent: C; eDiv: HTMLDivElement; value: any }>();
    private componentCreator: (value: any, listItemElement: HTMLElement) => C;
    private componentUpdater: (value: any, component: C) => void;
    private rowHeight = 20;
    private pageSize = -1;
    private isScrolling = false;
    private lastFocusedRowIndex: number | null;
    private isHeightFromTheme: boolean = true;
    private readonly eContainer: HTMLElement = RefPlaceholder;
    private awaitStableCallbacks: (() => void)[] = [];

    constructor(params?: VirtualListParams) {
        super(getVirtualListTemplate(params?.cssIdentifier || 'default'));

        const { cssIdentifier = 'default', ariaRole = 'listbox', listName } = params || {};

        this.cssIdentifier = cssIdentifier;
        this.ariaRole = ariaRole;
        this.listName = listName;
    }

    public postConstruct(): void {
        this.addScrollListener();
        this.rowHeight = this.getItemHeight();
        this.addResizeObserver();

        this.initialiseTabGuard({
            onFocusIn: (e: FocusEvent) => this.onFocusIn(e),
            onFocusOut: (e: FocusEvent) => this.onFocusOut(e),
            focusInnerElement: (fromBottom: boolean) => this.focusInnerElement(fromBottom),
            onTabKeyDown: (e) => this.onTabKeyDown(e),
            handleKeyDown: (e) => this.handleKeyDown(e),
        });

        this.setAriaProperties();
        this.addManagedEventListeners({ gridStylesChanged: this.onGridStylesChanged.bind(this) });
    }

    private onGridStylesChanged(e: CssVariablesChanged): void {
        if (e.listItemHeightChanged) {
            this.rowHeight = this.getItemHeight();
            this.refresh();
        }
    }

    private setAriaProperties(): void {
        const translate = this.getLocaleTextFunc();
        const listName = translate('ariaDefaultListName', this.listName || 'List');
        const ariaEl = this.eContainer;

        _setAriaRole(ariaEl, this.ariaRole);
        _setAriaLabel(ariaEl, listName);
    }

    private addResizeObserver(): void {
        // do this in an animation frame to prevent loops
        const listener = () => _requestAnimationFrame(this.beans, () => this.drawVirtualRows());
        const destroyObserver = _observeResize(this.beans, this.getGui(), listener);
        this.addDestroyFunc(destroyObserver);
    }

    protected focusInnerElement(fromBottom: boolean): boolean {
        this.focusRow(fromBottom ? this.model.getRowCount() - 1 : 0);
        return true;
    }

    protected onFocusIn(e: FocusEvent): void {
        const target = e.target as HTMLElement;

        if (target.classList.contains('ag-virtual-list-item')) {
            this.lastFocusedRowIndex = _getAriaPosInSet(target) - 1;
        }
    }

    protected onFocusOut(e: FocusEvent): void {
        if (!this.getFocusableElement().contains(e.relatedTarget as HTMLElement)) {
            this.lastFocusedRowIndex = null;
        }
    }

    protected handleKeyDown(e: KeyboardEvent): void {
        switch (e.key) {
            case KeyCode.UP:
            case KeyCode.DOWN:
                e.preventDefault();
                this.navigate(e.key === KeyCode.UP);
                break;
            case KeyCode.PAGE_HOME:
            case KeyCode.PAGE_END:
            case KeyCode.PAGE_UP:
            case KeyCode.PAGE_DOWN:
                if (this.navigateToPage(e.key) !== null) {
                    e.preventDefault();
                }
                break;
        }
    }

    protected onTabKeyDown(e: KeyboardEvent): void {
        _stopPropagationForAgGrid(e);
        this.forceFocusOutOfContainer(e.shiftKey);
    }

    private navigate(up: boolean): void {
        if (this.lastFocusedRowIndex == null) {
            return;
        }

        const nextRow = this.lastFocusedRowIndex + (up ? -1 : 1);

        if (nextRow < 0 || nextRow >= this.model.getRowCount()) {
            return;
        }

        this.focusRow(nextRow);
    }

    public navigateToPage(
        key: 'Home' | 'PageUp' | 'PageDown' | 'End',
        fromItem: number | 'focused' = 'focused'
    ): number | null {
        let hasFocus = false;

        if (fromItem === 'focused') {
            fromItem = this.getLastFocusedRow() as number;
            hasFocus = true;
        }

        const rowCount = this.model.getRowCount() - 1;

        let newIndex = -1;

        if (key === KeyCode.PAGE_HOME) {
            newIndex = 0;
        } else if (key === KeyCode.PAGE_END) {
            newIndex = rowCount;
        } else if (key === KeyCode.PAGE_DOWN) {
            newIndex = Math.min(fromItem + this.pageSize, rowCount);
        } else if (key === KeyCode.PAGE_UP) {
            newIndex = Math.max(fromItem - this.pageSize, 0);
        }

        if (newIndex === -1) {
            return null;
        }

        if (hasFocus) {
            this.focusRow(newIndex);
        } else {
            this.ensureIndexVisible(newIndex);
        }

        return newIndex;
    }

    public getLastFocusedRow(): number | null {
        return this.lastFocusedRowIndex;
    }

    public focusRow(rowNumber: number): void {
        if (this.isScrolling) {
            return;
        }
        this.isScrolling = true;

        this.ensureIndexVisible(rowNumber);

        _requestAnimationFrame(this.beans, () => {
            this.isScrolling = false;
            if (!this.isAlive()) {
                return;
            }
            const renderedRow = this.renderedRows.get(rowNumber);

            if (renderedRow) {
                renderedRow.eDiv.focus();
            }
        });
    }

    public getComponentAt(rowIndex: number): C | undefined {
        const comp = this.renderedRows.get(rowIndex);

        return comp && comp.rowComponent;
    }

    public forEachRenderedRow(func: (comp: C, idx: number) => void): void {
        this.renderedRows.forEach((value, key) => func(value.rowComponent, key));
    }

    private getItemHeight(): number {
        if (!this.isHeightFromTheme) {
            return this.rowHeight;
        }
        return this.environment.getDefaultListItemHeight();
    }

    /**
     * Returns true if the view had to be scrolled, otherwise, false.
     */
    public ensureIndexVisible(index: number, scrollPartialIntoView: boolean = true): boolean {
        const lastRow = this.model.getRowCount();

        if (typeof index !== 'number' || index < 0 || index >= lastRow) {
            _warn(229, { index });
            return false;
        }

        const rowTopPixel = index * this.rowHeight;
        const rowBottomPixel = rowTopPixel + this.rowHeight;
        const eGui = this.getGui();

        const viewportTopPixel = eGui.scrollTop;
        const viewportHeight = eGui.offsetHeight;
        const viewportBottomPixel = viewportTopPixel + viewportHeight;

        const diff = scrollPartialIntoView ? 0 : this.rowHeight;
        const viewportScrolledPastRow = viewportTopPixel > rowTopPixel + diff;
        const viewportScrolledBeforeRow = viewportBottomPixel < rowBottomPixel - diff;

        if (viewportScrolledPastRow) {
            // if row is before, scroll up with row at top
            eGui.scrollTop = rowTopPixel;
            return true;
        }

        if (viewportScrolledBeforeRow) {
            // if row is below, scroll down with row at bottom
            const newScrollPosition = rowBottomPixel - viewportHeight;
            eGui.scrollTop = newScrollPosition;
            return true;
        }

        return false;
    }

    public setComponentCreator(componentCreator: (value: any, listItemElement: HTMLElement) => C): void {
        this.componentCreator = componentCreator;
    }

    public setComponentUpdater(componentUpdater: (value: any, component: C) => void): void {
        this.componentUpdater = componentUpdater;
    }

    public getRowHeight(): number {
        return this.rowHeight;
    }

    public getScrollTop(): number {
        return this.getGui().scrollTop;
    }

    public setRowHeight(rowHeight: number): void {
        this.isHeightFromTheme = false;
        this.rowHeight = rowHeight;
        this.refresh();
    }

    public refresh(softRefresh?: boolean): void {
        if (this.model == null || !this.isAlive()) {
            return;
        }

        const rowCount = this.model.getRowCount();
        this.eContainer.style.height = `${rowCount * this.rowHeight}px`;

        // ensure height is applied before attempting to redraw rows
        this.awaitStable(() => {
            if (!this.isAlive()) {
                return;
            }

            if (this.canSoftRefresh(softRefresh)) {
                this.drawVirtualRows(true);
            } else {
                this.clearVirtualRows();
                this.drawVirtualRows();
            }
        });
    }

    public awaitStable(callback: () => void): void {
        this.awaitStableCallbacks.push(callback);
        if (this.awaitStableCallbacks.length > 1) {
            return;
        }
        const rowCount = this.model.getRowCount();
        _waitUntil(
            () => this.eContainer.clientHeight >= rowCount * this.rowHeight,
            () => {
                if (!this.isAlive()) {
                    return;
                }
                const callbacks = this.awaitStableCallbacks;
                this.awaitStableCallbacks = [];
                callbacks.forEach((c) => c());
            }
        );
    }

    private canSoftRefresh(softRefresh: boolean | undefined): boolean {
        return !!(
            softRefresh &&
            this.renderedRows.size &&
            typeof this.model.areRowsEqual === 'function' &&
            this.componentUpdater
        );
    }

    private clearVirtualRows() {
        this.renderedRows.forEach((_, rowIndex) => this.removeRow(rowIndex));
    }

    protected drawVirtualRows(softRefresh?: boolean) {
        if (!this.isAlive() || !this.model) {
            return;
        }

        const gui = this.getGui();
        const topPixel = gui.scrollTop;
        const bottomPixel = topPixel + gui.offsetHeight;
        const firstRow = Math.floor(topPixel / this.rowHeight);
        const lastRow = Math.floor(bottomPixel / this.rowHeight);
        this.pageSize = Math.floor((bottomPixel - topPixel) / this.rowHeight);

        this.ensureRowsRendered(firstRow, lastRow, softRefresh);
    }

    private ensureRowsRendered(start: number, finish: number, softRefresh?: boolean) {
        // remove any rows that are no longer required
        this.renderedRows.forEach((_, rowIndex) => {
            if ((rowIndex < start || rowIndex > finish) && rowIndex !== this.lastFocusedRowIndex) {
                this.removeRow(rowIndex);
            }
        });

        if (softRefresh) {
            // refresh any existing rows
            this.refreshRows();
        }

        // insert any required new rows
        for (let rowIndex = start; rowIndex <= finish; rowIndex++) {
            if (this.renderedRows.has(rowIndex)) {
                continue;
            }

            // check this row actually exists (in case overflow buffer window exceeds real data)
            if (rowIndex < this.model.getRowCount()) {
                this.insertRow(rowIndex);
            }
        }
    }

    private insertRow(rowIndex: number): void {
        const value = this.model.getRow(rowIndex);
        const eDiv = document.createElement('div');

        eDiv.classList.add('ag-virtual-list-item', `ag-${this.cssIdentifier}-virtual-list-item`);
        _setAriaRole(eDiv, this.ariaRole === 'tree' ? 'treeitem' : 'option');
        _setAriaSetSize(eDiv, this.model.getRowCount());
        _setAriaPosInSet(eDiv, rowIndex + 1);
        eDiv.setAttribute('tabindex', '-1');

        eDiv.style.height = `${this.rowHeight}px`;
        eDiv.style.top = `${this.rowHeight * rowIndex}px`;

        const rowComponent = this.componentCreator(value, eDiv);

        rowComponent.addGuiEventListener('focusin', () => (this.lastFocusedRowIndex = rowIndex));

        eDiv.appendChild(rowComponent.getGui());

        // keep the DOM order consistent with the order of the rows
        if (this.renderedRows.has(rowIndex - 1)) {
            this.renderedRows.get(rowIndex - 1)!.eDiv.insertAdjacentElement('afterend', eDiv);
        } else if (this.renderedRows.has(rowIndex + 1)) {
            this.renderedRows.get(rowIndex + 1)!.eDiv.insertAdjacentElement('beforebegin', eDiv);
        } else {
            this.eContainer.appendChild(eDiv);
        }

        this.renderedRows.set(rowIndex, { rowComponent, eDiv, value });
    }

    private removeRow(rowIndex: number) {
        const component = this.renderedRows.get(rowIndex)!;

        this.eContainer.removeChild(component.eDiv);
        this.destroyBean(component.rowComponent);
        this.renderedRows.delete(rowIndex);
    }

    private refreshRows(): void {
        const rowCount = this.model.getRowCount();
        this.renderedRows.forEach((row, rowIndex) => {
            if (rowIndex >= rowCount) {
                this.removeRow(rowIndex);
            } else {
                const newValue = this.model.getRow(rowIndex);
                if (this.model.areRowsEqual?.(row.value, newValue)) {
                    this.componentUpdater(newValue, row.rowComponent);
                } else {
                    // to be replaced later
                    this.removeRow(rowIndex);
                }
            }
        });
    }

    private addScrollListener() {
        this.addGuiEventListener('scroll', () => this.drawVirtualRows(), { passive: true });
    }

    public setModel(model: VirtualListModel): void {
        this.model = model;
    }

    public override getAriaElement(): Element {
        return this.eContainer;
    }

    public override destroy(): void {
        if (!this.isAlive()) {
            return;
        }

        this.clearVirtualRows();
        this.awaitStableCallbacks.length = 0;
        super.destroy();
    }
}
