import type { AgColumn, FilterOpenedEvent, IFilterComp, IconName } from 'ag-grid-community';
import {
    Component,
    FilterWrapperComp,
    KeyCode,
    RefPlaceholder,
    _clearElement,
    _createIconNoSpan,
    _loadTemplate,
    _setAriaExpanded,
    _setDisplayed,
} from 'ag-grid-community';

export type ToolPanelFilterCompEvent = 'filterChanged';
export class ToolPanelFilterComp extends Component<ToolPanelFilterCompEvent> {
    private readonly eFilterToolPanelHeader: HTMLElement = RefPlaceholder;
    private readonly eFilterName: HTMLElement = RefPlaceholder;
    private readonly agFilterToolPanelBody: HTMLElement = RefPlaceholder;
    private readonly eFilterIcon: Element = RefPlaceholder;
    private readonly eExpand: Element = RefPlaceholder;

    private eExpandChecked: Element;
    private eExpandUnchecked: Element;
    private column: AgColumn;
    private expanded: boolean = false;
    private underlyingFilter: IFilterComp | null;
    private filterWrapperComp?: FilterWrapperComp;

    constructor(
        private hideHeader: boolean,
        private readonly expandedCallback: () => void
    ) {
        super(/* html */ `
            <div class="ag-filter-toolpanel-instance">
                <div class="ag-filter-toolpanel-header ag-filter-toolpanel-instance-header" data-ref="eFilterToolPanelHeader" role="button" aria-expanded="false">
                    <div data-ref="eExpand" class="ag-filter-toolpanel-expand"></div>
                    <span data-ref="eFilterName" class="ag-header-cell-text"></span>
                    <span data-ref="eFilterIcon" class="ag-header-icon ag-filter-icon ag-filter-toolpanel-instance-header-icon" aria-hidden="true"></span>
                </div>
                <div class="ag-filter-toolpanel-instance-body ag-filter" data-ref="agFilterToolPanelBody"></div>
            </div>`);
    }

    public postConstruct() {
        const { beans, eExpand } = this;
        const eExpandChecked = _createIconNoSpan('accordionOpen', beans)!;
        this.eExpandChecked = eExpandChecked;
        const eExpandUnchecked = _createIconNoSpan('accordionClosed', beans)!;
        this.eExpandUnchecked = eExpandUnchecked;
        eExpand.appendChild(eExpandChecked);
        eExpand.appendChild(eExpandUnchecked);
    }

    public setColumn(column: AgColumn): void {
        this.column = column;
        const { beans, eFilterToolPanelHeader, eFilterIcon, eExpandChecked, hideHeader } = this;
        this.eFilterName.innerText = beans.colNames.getDisplayNameForColumn(column, 'filterToolPanel', false) || '';
        this.addManagedListeners(eFilterToolPanelHeader, {
            click: this.toggleExpanded.bind(this),
            keydown: this.onKeyDown.bind(this),
        });
        this.addManagedEventListeners({ filterOpened: this.onFilterOpened.bind(this) });
        this.addInIcon('filterActive', eFilterIcon, column);

        _setDisplayed(eFilterIcon, this.isFilterActive(), { skipAriaHidden: true });
        _setDisplayed(eExpandChecked, false);

        if (hideHeader) {
            _setDisplayed(eFilterToolPanelHeader, false);
            eFilterToolPanelHeader.removeAttribute('tabindex');
        } else {
            eFilterToolPanelHeader.setAttribute('tabindex', '0');
        }

        this.addManagedListeners(column, { filterChanged: this.onFilterChanged.bind(this) });
    }

    private onKeyDown(e: KeyboardEvent): void {
        const { key } = e;
        const { ENTER, SPACE, LEFT, RIGHT } = KeyCode;

        if (key !== ENTER && key !== SPACE && key !== LEFT && key !== RIGHT) {
            return;
        }

        e.preventDefault();

        if (key === ENTER || key === SPACE) {
            this.toggleExpanded();
        } else if (key === KeyCode.LEFT) {
            this.collapse();
        } else {
            this.expand();
        }
    }

    public getColumn(): AgColumn {
        return this.column;
    }

    public getColumnFilterName(): string | null {
        return this.beans.colNames.getDisplayNameForColumn(this.column, 'filterToolPanel', false);
    }

    public addCssClassToTitleBar(cssClass: string) {
        this.eFilterToolPanelHeader.classList.add(cssClass);
    }

    private addInIcon(iconName: IconName, eParent: Element, column: AgColumn): void {
        if (eParent == null) {
            return;
        }

        const eIcon = _createIconNoSpan(iconName, this.beans, column)!;
        eParent.appendChild(eIcon);
    }

    public isFilterActive(): boolean {
        return !!this.beans.filterManager?.isFilterActive(this.column);
    }

    private onFilterChanged(): void {
        _setDisplayed(this.eFilterIcon, this.isFilterActive(), { skipAriaHidden: true });
        this.dispatchLocalEvent({ type: 'filterChanged' });
    }

    public toggleExpanded(): void {
        this.expanded ? this.collapse() : this.expand();
    }

    public expand(): void {
        if (this.expanded) {
            return;
        }

        this.expanded = true;
        _setAriaExpanded(this.eFilterToolPanelHeader, true);

        _setDisplayed(this.eExpandChecked, true);
        _setDisplayed(this.eExpandUnchecked, false);

        this.addFilterElement();

        this.expandedCallback();
    }

    private addFilterElement(suppressFocus?: boolean): void {
        const filterPanelWrapper = _loadTemplate(/* html */ `<div class="ag-filter-toolpanel-instance-filter"></div>`);
        const comp = this.createManagedBean(new FilterWrapperComp(this.column, 'TOOLBAR'));
        this.filterWrapperComp = comp;

        if (!comp.hasFilter()) {
            return;
        }

        comp.getFilter()?.then((filter) => {
            this.underlyingFilter = filter;

            if (!filter) {
                return;
            }
            filterPanelWrapper.appendChild(comp.getGui());

            this.agFilterToolPanelBody.appendChild(filterPanelWrapper);

            comp.afterGuiAttached({ container: 'toolPanel', suppressFocus });
        });
    }

    public collapse(): void {
        if (!this.expanded) {
            return;
        }

        this.expanded = false;
        _setAriaExpanded(this.eFilterToolPanelHeader, false);
        this.removeFilterElement();

        _setDisplayed(this.eExpandChecked, false);
        _setDisplayed(this.eExpandUnchecked, true);

        const filterWrapperComp = this.filterWrapperComp;
        filterWrapperComp?.afterGuiDetached();
        this.destroyBean(filterWrapperComp);

        this.expandedCallback();
    }

    private removeFilterElement(): void {
        _clearElement(this.agFilterToolPanelBody);
    }

    public isExpanded(): boolean {
        return this.expanded;
    }

    public refreshFilter(isDisplayed: boolean): void {
        if (!this.expanded) {
            return;
        }

        const filter = this.underlyingFilter as any;

        if (!filter) {
            return;
        }

        if (isDisplayed) {
            // set filters should be updated when the filter has been changed elsewhere, i.e. via api. Note that we can't
            // use 'afterGuiAttached' to refresh the virtual list as it also focuses on the mini filter which changes the
            // scroll position in the filter list panel
            if (typeof filter.refreshVirtualList === 'function') {
                filter.refreshVirtualList();
            }
        } else {
            filter.afterGuiDetached?.();
        }
    }

    private onFilterOpened(event: FilterOpenedEvent): void {
        if (event.source !== 'COLUMN_MENU') {
            return;
        }
        if (event.column !== this.column) {
            return;
        }
        if (!this.expanded) {
            return;
        }

        this.collapse();
    }
}
