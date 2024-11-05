import type {
    AgColumn,
    AgEvent,
    AgInputTextField,
    BeanCollection,
    ColumnModel,
    ComponentSelector,
} from 'ag-grid-community';
import {
    AgInputTextFieldSelector,
    Component,
    RefPlaceholder,
    _createIconNoSpan,
    _debounce,
    _setDisplayed,
} from 'ag-grid-community';

import type { ToolPanelFiltersCompParams } from './filtersToolPanel';

export enum EXPAND_STATE {
    EXPANDED,
    COLLAPSED,
    INDETERMINATE,
}
export type AgFiltersToolPanelHeaderEvent = 'collapseAll' | 'expandAll' | 'searchChanged';
export class AgFiltersToolPanelHeader extends Component<AgFiltersToolPanelHeaderEvent> {
    private colModel: ColumnModel;

    public wireBeans(beans: BeanCollection) {
        this.colModel = beans.colModel;
    }

    private readonly eExpand: Element = RefPlaceholder;
    private readonly eFilterTextField: AgInputTextField = RefPlaceholder;

    private eExpandChecked: Element;
    private eExpandUnchecked: Element;
    private eExpandIndeterminate: Element;

    private onSearchTextChangedDebounced: () => void;

    private currentExpandState: EXPAND_STATE;

    private params: ToolPanelFiltersCompParams;

    public postConstruct(): void {
        this.setTemplate(
            /* html */
            `<div class="ag-filter-toolpanel-search" role="presentation">
                <div data-ref="eExpand" class="ag-filter-toolpanel-expand"></div>
                <ag-input-text-field data-ref="eFilterTextField" class="ag-filter-toolpanel-search-input"></ag-input-text-field>
            </div>`,
            [AgInputTextFieldSelector]
        );

        const translate = this.getLocaleTextFunc();

        this.eFilterTextField
            .setAutoComplete(false)
            .setInputAriaLabel(translate('ariaFilterColumnsInput', 'Filter Columns Input'))
            .onValueChange(this.onSearchTextChanged.bind(this));

        this.createExpandIcons();
        this.setExpandState(EXPAND_STATE.EXPANDED);
        this.addManagedElementListeners(this.eExpand, { click: this.onExpandClicked.bind(this) });
        this.addManagedEventListeners({ newColumnsLoaded: this.showOrHideOptions.bind(this) });
    }

    public init(params: ToolPanelFiltersCompParams): void {
        this.params = params;

        if (this.colModel.ready) {
            this.showOrHideOptions();
        }
    }

    private createExpandIcons() {
        this.eExpand.appendChild((this.eExpandChecked = _createIconNoSpan('accordionOpen', this.beans)!));
        this.eExpand.appendChild((this.eExpandUnchecked = _createIconNoSpan('accordionClosed', this.beans)!));
        this.eExpand.appendChild(
            (this.eExpandIndeterminate = _createIconNoSpan('accordionIndeterminate', this.beans)!)
        );
    }

    // we only show expand / collapse if we are showing filters
    private showOrHideOptions(): void {
        const showFilterSearch = !this.params.suppressFilterSearch;
        const showExpand = !this.params.suppressExpandAll;
        const translate = this.getLocaleTextFunc();

        this.eFilterTextField.setInputPlaceholder(translate('searchOoo', 'Search...'));

        const isFilterGroupPresent = (col: AgColumn) => col.getOriginalParent() && col.isFilterAllowed();
        const filterGroupsPresent = this.colModel.getCols().some(isFilterGroupPresent);

        _setDisplayed(this.eFilterTextField.getGui(), showFilterSearch);
        _setDisplayed(this.eExpand, showExpand && filterGroupsPresent);
    }

    private onSearchTextChanged(): void {
        if (!this.onSearchTextChangedDebounced) {
            this.onSearchTextChangedDebounced = _debounce(
                this,
                () => this.dispatchLocalEvent({ type: 'searchChanged', searchText: this.eFilterTextField.getValue() }),
                300
            );
        }

        this.onSearchTextChangedDebounced();
    }

    private onExpandClicked(): void {
        const event: AgEvent<AgFiltersToolPanelHeaderEvent> =
            this.currentExpandState === EXPAND_STATE.EXPANDED ? { type: 'collapseAll' } : { type: 'expandAll' };
        this.dispatchLocalEvent(event);
    }

    public setExpandState(state: EXPAND_STATE): void {
        this.currentExpandState = state;

        _setDisplayed(this.eExpandChecked, this.currentExpandState === EXPAND_STATE.EXPANDED);
        _setDisplayed(this.eExpandUnchecked, this.currentExpandState === EXPAND_STATE.COLLAPSED);
        _setDisplayed(this.eExpandIndeterminate, this.currentExpandState === EXPAND_STATE.INDETERMINATE);
    }
}

export const AgFiltersToolPanelHeaderSelector: ComponentSelector = {
    selector: 'AG-FILTERS-TOOL-PANEL-HEADER',
    component: AgFiltersToolPanelHeader,
};
