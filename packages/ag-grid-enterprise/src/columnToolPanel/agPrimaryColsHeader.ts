import type { AgCheckbox, AgInputTextField, ComponentSelector } from 'ag-grid-community';
import {
    AgCheckboxSelector,
    AgInputTextFieldSelector,
    Component,
    KeyCode,
    RefPlaceholder,
    _createIconNoSpan,
    _debounce,
    _setDisplayed,
} from 'ag-grid-community';

import type { ToolPanelColumnCompParams } from './columnToolPanel';

export enum ExpandState {
    EXPANDED,
    COLLAPSED,
    INDETERMINATE,
}

const DEBOUNCE_DELAY = 300;
export type AgPrimaryColsHeaderEvent = 'unselectAll' | 'selectAll' | 'collapseAll' | 'expandAll' | 'filterChanged';
export class AgPrimaryColsHeader extends Component<AgPrimaryColsHeaderEvent> {
    private readonly eExpand: Element = RefPlaceholder;
    private readonly eSelect: AgCheckbox = RefPlaceholder;
    private readonly eFilterTextField: AgInputTextField = RefPlaceholder;

    private eExpandChecked: Element;
    private eExpandUnchecked: Element;
    private eExpandIndeterminate: Element;

    private expandState: ExpandState;
    private selectState?: boolean;

    private onFilterTextChangedDebounced: () => void;

    private params: ToolPanelColumnCompParams;

    constructor() {
        super(
            /* html */ `<div class="ag-column-select-header" role="presentation">
            <div data-ref="eExpand" class="ag-column-select-header-icon"></div>
            <ag-checkbox data-ref="eSelect" class="ag-column-select-header-checkbox"></ag-checkbox>
            <ag-input-text-field class="ag-column-select-header-filter-wrapper" data-ref="eFilterTextField"></ag-input-text-field>
        </div>`,
            [AgCheckboxSelector, AgInputTextFieldSelector]
        );
    }

    public postConstruct(): void {
        this.createExpandIcons();

        this.addManagedListeners(this.eExpand, {
            click: this.onExpandClicked.bind(this),
            keydown: (e: KeyboardEvent) => {
                if (e.key === KeyCode.SPACE) {
                    e.preventDefault();
                    this.onExpandClicked();
                }
            },
        });

        this.addManagedElementListeners(this.eSelect.getInputElement(), { click: this.onSelectClicked.bind(this) });
        this.addManagedPropertyListener('functionsReadOnly', () => this.onFunctionsReadOnlyPropChanged());

        this.eFilterTextField.setAutoComplete(false).onValueChange(() => this.onFilterTextChanged());

        this.addManagedEventListeners({ newColumnsLoaded: this.showOrHideOptions.bind(this) });

        const translate = this.getLocaleTextFunc();

        this.eSelect.setInputAriaLabel(translate('ariaColumnSelectAll', 'Toggle All Columns Visibility'));
        this.eFilterTextField.setInputAriaLabel(translate('ariaFilterColumnsInput', 'Filter Columns Input'));

        this.activateTabIndex([this.eExpand]);
    }

    private onFunctionsReadOnlyPropChanged(): void {
        const readOnly = this.gos.get('functionsReadOnly');
        this.eSelect.setReadOnly(readOnly);
        this.eSelect.addOrRemoveCssClass('ag-column-select-column-readonly', readOnly);
    }

    public init(params: ToolPanelColumnCompParams): void {
        this.params = params;

        const readOnly = this.gos.get('functionsReadOnly');
        this.eSelect.setReadOnly(readOnly);
        this.eSelect.addOrRemoveCssClass('ag-column-select-column-readonly', readOnly);

        if (this.beans.colModel.ready) {
            this.showOrHideOptions();
        }
    }

    private createExpandIcons() {
        const beans = this.beans;
        this.eExpand.appendChild((this.eExpandChecked = _createIconNoSpan('columnSelectOpen', beans)!));

        this.eExpand.appendChild((this.eExpandUnchecked = _createIconNoSpan('columnSelectClosed', beans)!));

        this.eExpand.appendChild((this.eExpandIndeterminate = _createIconNoSpan('columnSelectIndeterminate', beans)!));

        this.setExpandState(ExpandState.EXPANDED);
    }

    // we only show expand / collapse if we are showing columns
    private showOrHideOptions(): void {
        const params = this.params;
        const showFilter = !params.suppressColumnFilter;
        const showSelect = !params.suppressColumnSelectAll;
        const showExpand = !params.suppressColumnExpandAll;
        const groupsPresent = !!this.beans.colModel.colDefCols?.treeDepth;
        const translate = this.getLocaleTextFunc();

        this.eFilterTextField.setInputPlaceholder(translate('searchOoo', 'Search...'));

        _setDisplayed(this.eFilterTextField.getGui(), showFilter);
        _setDisplayed(this.eSelect.getGui(), showSelect);
        _setDisplayed(this.eExpand, showExpand && groupsPresent);
    }

    private onFilterTextChanged(): void {
        if (!this.onFilterTextChangedDebounced) {
            this.onFilterTextChangedDebounced = _debounce(
                this,
                () => {
                    const filterText = this.eFilterTextField.getValue();
                    this.dispatchLocalEvent({ type: 'filterChanged', filterText: filterText });
                },
                DEBOUNCE_DELAY
            );
        }

        this.onFilterTextChangedDebounced();
    }

    private onSelectClicked(): void {
        this.dispatchLocalEvent({ type: this.selectState ? 'unselectAll' : 'selectAll' });
    }

    private onExpandClicked(): void {
        this.dispatchLocalEvent({ type: this.expandState === ExpandState.EXPANDED ? 'collapseAll' : 'expandAll' });
    }

    public setExpandState(state: ExpandState): void {
        this.expandState = state;

        _setDisplayed(this.eExpandChecked, state === ExpandState.EXPANDED);
        _setDisplayed(this.eExpandUnchecked, state === ExpandState.COLLAPSED);
        _setDisplayed(this.eExpandIndeterminate, state === ExpandState.INDETERMINATE);
    }

    public setSelectionState(state?: boolean): void {
        this.selectState = state;
        this.eSelect.setValue(this.selectState);
    }
}

export const AgPrimaryColsHeaderSelector: ComponentSelector = {
    selector: 'AG-PRIMARY-COLS-HEADER',
    component: AgPrimaryColsHeader,
};
