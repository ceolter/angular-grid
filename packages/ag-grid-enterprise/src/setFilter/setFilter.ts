import type {
    AgColumn,
    AgInputTextField,
    ComponentSelector,
    IAfterGuiAttachedParams,
    ISetFilter,
    SetFilterModel,
    SetFilterModelValue,
    SetFilterParams,
} from 'ag-grid-community';
import {
    AgInputTextFieldSelector,
    AgPromise,
    KeyCode,
    ProvidedFilter,
    RefPlaceholder,
    _areEqual,
    _getActiveDomElement,
    _last,
    _setDisplayed,
    _toStringOrNull,
} from 'ag-grid-community';

import type { VirtualListModel } from '../widgets/iVirtualList';
import { VirtualList } from '../widgets/virtualList';
import type { SetFilterModelTreeItem } from './iSetDisplayValueModel';
import { SET_FILTER_ADD_SELECTION_TO_FILTER, SET_FILTER_SELECT_ALL } from './iSetDisplayValueModel';
import type { SetFilterHelper } from './setFilterHelper';
import type {
    SetFilterListItemExpandedChangedEvent,
    SetFilterListItemParams,
    SetFilterListItemSelectionChangedEvent,
} from './setFilterListItem';
import { SetFilterListItem } from './setFilterListItem';
import { SetFilterModelFormatter } from './setFilterModelFormatter';
import type { SetFilterService } from './setFilterService';
import { applyExcelModeOptions, translateForSetFilter } from './setFilterUtils';
import { SetValueModel } from './setValueModel';
import { SetFilterModelValuesType } from './setValueModel';

/** @param V type of value in the Set Filter */
export class SetFilter<V = string>
    extends ProvidedFilter<SetFilterModel, V, SetFilterParams<any, V>>
    implements ISetFilter<V>
{
    protected filterType = 'set' as const;

    private readonly eMiniFilter: AgInputTextField = RefPlaceholder;
    private readonly eFilterLoading: HTMLElement = RefPlaceholder;
    private readonly eSetFilterList: HTMLElement = RefPlaceholder;
    private readonly eFilterNoMatches: HTMLElement = RefPlaceholder;

    private valueModel: SetValueModel<V>;
    private virtualList: VirtualList<any>;
    private hardRefreshVirtualList = false;

    private readonly filterModelFormatter = new SetFilterModelFormatter();

    private helper: SetFilterHelper<V>;

    constructor() {
        super('setFilter');
    }

    public doesFilterPass(): boolean {
        // TODO remove
        return true;
    }

    // unlike the simple filters, nothing in the set filter UI shows/hides.
    // maybe this method belongs in abstractSimpleFilter???
    protected updateUiVisibility(): void {}

    protected createBodyTemplate(): string {
        return /* html */ `
            <div class="ag-set-filter">
                <div data-ref="eFilterLoading" class="ag-filter-loading ag-hidden">${translateForSetFilter(this, 'loadingOoo')}</div>
                <ag-input-text-field class="ag-mini-filter" data-ref="eMiniFilter"></ag-input-text-field>
                <div data-ref="eFilterNoMatches" class="ag-filter-no-matches ag-hidden">${translateForSetFilter(this, 'noMatches')}</div>
                <div data-ref="eSetFilterList" class="ag-set-filter-list" role="presentation"></div>
            </div>`;
    }
    protected getAgComponents(): ComponentSelector[] {
        return [AgInputTextFieldSelector];
    }

    protected override handleKeyDown(e: KeyboardEvent): void {
        super.handleKeyDown(e);

        if (e.defaultPrevented) {
            return;
        }

        switch (e.key) {
            case KeyCode.SPACE:
                this.handleKeySpace(e);
                break;
            case KeyCode.ENTER:
                this.handleKeyEnter(e);
                break;
            case KeyCode.LEFT:
                this.handleKeyLeft(e);
                break;
            case KeyCode.RIGHT:
                this.handleKeyRight(e);
                break;
        }
    }

    private handleKeySpace(e: KeyboardEvent): void {
        this.getComponentForKeyEvent(e)?.toggleSelected();
    }

    private handleKeyEnter(e: KeyboardEvent): void {
        const { excelMode, readOnly } = this.params;
        if (!excelMode || !!readOnly) {
            return;
        }

        e.preventDefault();

        // in Excel Mode, hitting Enter is the same as pressing the Apply button
        this.onBtApply(false, false, e);

        if (this.params.excelMode === 'mac') {
            // in Mac version, select all the input text
            this.eMiniFilter.getInputElement().select();
        }
    }

    private handleKeyLeft(e: KeyboardEvent): void {
        this.getComponentForKeyEvent(e)?.setExpanded(false);
    }

    private handleKeyRight(e: KeyboardEvent): void {
        this.getComponentForKeyEvent(e)?.setExpanded(true);
    }

    private getComponentForKeyEvent(e: KeyboardEvent): SetFilterListItem<V> | undefined {
        if (!this.eSetFilterList.contains(_getActiveDomElement(this.beans))) {
            return;
        }

        const currentItem = this.virtualList.getLastFocusedRow();
        if (currentItem == null) {
            return;
        }

        const component = this.virtualList.getComponentAt(currentItem) as SetFilterListItem<V>;
        if (component == null) {
            return;
        }

        e.preventDefault();

        const { readOnly } = this.params;
        if (readOnly) {
            return;
        }
        return component;
    }

    protected getCssIdentifier(): string {
        return 'set-filter';
    }

    public override setModel(model: SetFilterModel | null): AgPromise<void> {
        if (model == null && this.valueModel.getModel() == null) {
            // refreshing is expensive. if new and old model are both null (e.g. nothing set), skip.
            // mini filter isn't contained within the model, so always reset
            this.setMiniFilter(null);
            return AgPromise.resolve();
        }
        return super.setModel(model);
    }

    override refresh(params: SetFilterParams<any, V>): boolean {
        const oldParams = this.params;

        applyExcelModeOptions(params);

        if (!super.refresh(params)) {
            return false;
        }

        // Those params have a large impact and should trigger a reload when they change.
        const paramsThatForceReload: (keyof SetFilterParams<any, V>)[] = [
            'treeList',
            'treeListPathGetter',
            'caseSensitive',
            'comparator',
            'excelMode',
        ];

        if (paramsThatForceReload.some((param) => params[param] !== oldParams?.[param])) {
            return false;
        }

        if (this.helper.haveColDefParamsChanged(params)) {
            return false;
        }

        super.updateParams(params);
        this.helper.refresh(params);
        this.updateMiniFilter();

        if (params.suppressSelectAll !== oldParams?.suppressSelectAll) {
            this.createVirtualListModel(params);
        }

        this.valueModel.updateOnParamsChange(params).then(() => {
            if (this.isAlive()) {
                this.refreshFilterValues();
            }
        });

        return true;
    }

    private setModelAndRefresh(values: SetFilterModelValue | null): AgPromise<void> {
        return this.valueModel.setModel(values).then(() => {
            if (this.isAlive()) {
                // Async values could arrive after the grid has been destroyed
                this.checkAndRefreshVirtualList();
            }
        });
    }

    protected resetUiToDefaults(): AgPromise<void> {
        this.setMiniFilter(null);

        return this.setModelAndRefresh(null);
    }

    protected setModelIntoUi(model: SetFilterModel | null): AgPromise<void> {
        this.setMiniFilter(null);

        const values = model == null ? null : model.values;
        return this.setModelAndRefresh(values);
    }

    public getModelFromUi(): SetFilterModel | null {
        const values = this.valueModel.getModel();

        if (!values) {
            return null;
        }

        return { values, filterType: this.filterType };
    }

    public getValueModel(): SetValueModel<V> {
        return this.valueModel;
    }

    protected areModelsEqual(a: SetFilterModel, b: SetFilterModel): boolean {
        // both are missing
        if (a == null && b == null) {
            return true;
        }

        return a != null && b != null && _areEqual(a.values, b.values);
    }

    public override setParams(params: SetFilterParams<any, V>): void {
        applyExcelModeOptions(params);

        super.setParams(params);

        this.helper = (this.beans.setFilterSvc as SetFilterService).getHelper(params);

        this.valueModel = this.createManagedBean(
            new SetValueModel({
                filterParams: params,
                translate: (key) => translateForSetFilter(this, key),
                caseFormat: (v) => this.helper.caseFormat(v),
                createKey: this.helper.createKey,
                getValueFormatter: () => this.helper.valueFormatter,
                usingComplexObjects: !!(params.keyCreator ?? params.colDef.keyCreator),
                treeDataTreeList: this.helper.treeDataTreeList,
                groupingTreeList: this.helper.groupingTreeList,
                filteringKeys: this.helper.filteringKeys,
            })
        );

        const setIsLoading = this.setIsLoading.bind(this);
        this.addManagedListeners(this.valueModel, {
            loadingStart: () => setIsLoading(true),
            loadingEnd: () => setIsLoading(false),
        });

        this.initialiseFilterBodyUi();

        this.addEventListenersForDataChanges();
    }

    private onAddCurrentSelectionToFilterChange(newValue: boolean) {
        this.valueModel.setAddCurrentSelectionToFilter(newValue);
    }

    public getFormattedValue(key: string | null): string | null {
        let value: V | string | null = this.valueModel.getValue(key);
        if (
            this.helper.noValueFormatterSupplied &&
            (this.helper.treeDataTreeList || this.helper.groupingTreeList) &&
            Array.isArray(value)
        ) {
            // essentially get back the cell value
            value = _last(value) as string;
        }

        const formattedValue = this.beans.valueSvc.formatValue(
            this.params.column as AgColumn,
            null,
            value,
            this.helper.valueFormatter,
            false
        );

        return (
            (formattedValue == null ? _toStringOrNull(value) : formattedValue) ?? translateForSetFilter(this, 'blanks')
        );
    }

    private addEventListenersForDataChanges(): void {
        if (!this.isValuesTakenFromGrid()) {
            return;
        }

        this.addManagedPropertyListeners(['groupAllowUnbalanced'], () => {
            this.syncAfterDataChange();
        });

        this.addManagedEventListeners({
            cellValueChanged: (event) => {
                // only interested in changes to do with this column
                if (event.column === this.params.column) {
                    this.syncAfterDataChange();
                }
            },
        });
    }

    private syncAfterDataChange(): AgPromise<void> {
        const doApply = !this.applyActive || this.areModelsEqual(this.getModel()!, this.getModelFromUi()!);
        const promise = this.valueModel.refreshValues();

        return promise.then(() => {
            if (this.isAlive()) {
                this.checkAndRefreshVirtualList();
                if (doApply) {
                    this.onBtApply(false, true);
                }
            }
        });
    }

    private setIsLoading(isLoading: boolean): void {
        _setDisplayed(this.eFilterLoading, isLoading);
        if (!isLoading) {
            // hard refresh when async data received
            this.hardRefreshVirtualList = true;
        }
    }

    private initialiseFilterBodyUi(): void {
        this.initVirtualList();
        this.initMiniFilter();
    }

    private initVirtualList(): void {
        const translate = this.getLocaleTextFunc();
        const filterListName = translate('ariaFilterList', 'Filter List');
        const isTree = !!this.params.treeList;

        const virtualList = (this.virtualList = this.createBean(
            new VirtualList({
                cssIdentifier: 'filter',
                ariaRole: isTree ? 'tree' : 'listbox',
                listName: filterListName,
            })
        ));
        const eSetFilterList = this.eSetFilterList;

        if (isTree) {
            eSetFilterList.classList.add('ag-set-filter-tree-list');
        }

        if (eSetFilterList) {
            eSetFilterList.appendChild(virtualList.getGui());
        }

        const { cellHeight } = this.params;

        if (cellHeight != null) {
            virtualList.setRowHeight(cellHeight);
        }

        const componentCreator = (item: SetFilterModelTreeItem | string | null, listItemElement: HTMLElement) =>
            this.createSetListItem(item, isTree, listItemElement);
        virtualList.setComponentCreator(componentCreator);

        const componentUpdater = (
            item: SetFilterModelTreeItem | string | null,
            component: SetFilterListItem<V | string | null>
        ) => this.updateSetListItem(item, component);
        virtualList.setComponentUpdater(componentUpdater);

        this.createVirtualListModel(this.params);
    }

    private createVirtualListModel(params: SetFilterParams<any, V>): void {
        let model: VirtualListModel;
        if (params.suppressSelectAll) {
            model = new ModelWrapper(this.valueModel);
        } else {
            model = new ModelWrapperWithSelectAll(this.valueModel, () => this.isSelectAllSelected());
        }
        if (params.treeList) {
            model = new TreeModelWrapper(model);
        }

        this.virtualList.setModel(model);
    }

    private getSelectAllLabel(): string {
        const key =
            this.valueModel.getMiniFilter() == null || !this.params.excelMode ? 'selectAll' : 'selectAllSearchResults';

        return translateForSetFilter(this, key);
    }

    private getAddSelectionToFilterLabel(): string {
        return translateForSetFilter(this, 'addCurrentSelectionToFilter');
    }

    private createSetListItem(
        item: SetFilterModelTreeItem | string | null,
        isTree: boolean,
        focusWrapper: HTMLElement
    ): SetFilterListItem<V | string | null> {
        const groupsExist = this.valueModel.hasGroups();
        const { isSelected, isExpanded } = this.isSelectedExpanded(item);

        const { value, depth, isGroup, hasIndeterminateExpandState, selectedListener, expandedListener } =
            this.newSetListItemAttributes(item);

        const itemParams: SetFilterListItemParams<V | string | null> = {
            focusWrapper,
            value,
            params: this.params,
            translate: (translateKey: any) => translateForSetFilter(this, translateKey),
            valueFormatter: this.helper.valueFormatter,
            item,
            isSelected,
            isTree,
            depth,
            groupsExist,
            isGroup,
            isExpanded,
            hasIndeterminateExpandState,
        };
        const listItem = this.createBean(new SetFilterListItem<V | string | null>(itemParams));

        listItem.addEventListener('selectionChanged', selectedListener as any);
        if (expandedListener) {
            listItem.addEventListener('expandedChanged', expandedListener as any);
        }

        return listItem;
    }

    private newSetTreeItemAttributes(item: SetFilterModelTreeItem): {
        value: V | string | (() => string) | null;
        depth?: number | undefined;
        isGroup?: boolean | undefined;
        hasIndeterminateExpandState?: boolean | undefined;
        selectedListener: (e: SetFilterListItemSelectionChangedEvent) => void;
        expandedListener?: (e: SetFilterListItemExpandedChangedEvent) => void;
    } {
        const groupsExist = this.valueModel.hasGroups();

        // Select all option
        if (item.key === SET_FILTER_SELECT_ALL) {
            return {
                value: () => this.getSelectAllLabel(),
                isGroup: groupsExist,
                depth: item.depth,
                hasIndeterminateExpandState: true,
                selectedListener: (e: SetFilterListItemSelectionChangedEvent) => this.onSelectAll(e.isSelected),
                expandedListener: (e: SetFilterListItemExpandedChangedEvent<SetFilterModelTreeItem>) =>
                    this.onExpandAll(e.item, e.isExpanded),
            };
        }

        // Add selection to filter option
        if (item.key === SET_FILTER_ADD_SELECTION_TO_FILTER) {
            return {
                value: () => this.getAddSelectionToFilterLabel(),
                depth: item.depth,
                isGroup: false,
                hasIndeterminateExpandState: false,
                selectedListener: (e: SetFilterListItemSelectionChangedEvent) => {
                    this.onAddCurrentSelectionToFilterChange(e.isSelected);
                },
            };
        }

        // Group
        if (item.children) {
            return {
                value: this.params.treeListFormatter?.(item.treeKey, item.depth, item.parentTreeKeys) ?? item.treeKey,
                depth: item.depth,
                isGroup: true,
                selectedListener: (e: SetFilterListItemSelectionChangedEvent<SetFilterModelTreeItem>) =>
                    this.onGroupItemSelected(e.item, e.isSelected),
                expandedListener: (e: SetFilterListItemExpandedChangedEvent<SetFilterModelTreeItem>) =>
                    this.onExpandedChanged(e.item, e.isExpanded),
            };
        }

        // Leaf
        return {
            value: this.params.treeListFormatter?.(item.treeKey, item.depth, item.parentTreeKeys) ?? item.treeKey,
            depth: item.depth,
            selectedListener: (e: SetFilterListItemSelectionChangedEvent<SetFilterModelTreeItem>) =>
                this.onItemSelected(e.item.key!, e.isSelected),
        };
    }

    private newSetListItemAttributes(item: SetFilterModelTreeItem | string | null): {
        value: V | string | (() => string) | null;
        depth?: number | undefined;
        isGroup?: boolean | undefined;
        hasIndeterminateExpandState?: boolean | undefined;
        selectedListener: (e: SetFilterListItemSelectionChangedEvent) => void;
        expandedListener?: (e: SetFilterListItemExpandedChangedEvent) => void;
    } {
        // Tree item
        if (this.isSetFilterModelTreeItem(item)) {
            return this.newSetTreeItemAttributes(item);
        }

        // List item - 'Select All'
        if (item === SET_FILTER_SELECT_ALL) {
            return {
                value: () => this.getSelectAllLabel(),
                selectedListener: (e: SetFilterListItemSelectionChangedEvent<string>) => this.onSelectAll(e.isSelected),
            };
        }

        // List item - 'Add selection to filter'
        if (item === SET_FILTER_ADD_SELECTION_TO_FILTER) {
            return {
                value: () => this.getAddSelectionToFilterLabel(),
                selectedListener: (e: SetFilterListItemSelectionChangedEvent<string | null>) => {
                    this.onAddCurrentSelectionToFilterChange(e.isSelected);
                },
            };
        }

        // List item
        return {
            value: this.valueModel.getValue(item),
            selectedListener: (e: SetFilterListItemSelectionChangedEvent<string | null>) =>
                this.onItemSelected(e.item, e.isSelected),
        };
    }

    private updateSetListItem(
        item: SetFilterModelTreeItem | string | null,
        component: SetFilterListItem<V | string | null>
    ): void {
        const { isSelected, isExpanded } = this.isSelectedExpanded(item);
        component.refresh(item, isSelected, isExpanded);
    }

    private isSelectedExpanded(item: SetFilterModelTreeItem | string | null): {
        isSelected: boolean | undefined;
        isExpanded: boolean | undefined;
    } {
        let isSelected: boolean | undefined;
        let isExpanded: boolean | undefined;
        if (this.isSetFilterModelTreeItem(item)) {
            isExpanded = item.expanded;
            if (item.key === SET_FILTER_SELECT_ALL) {
                isSelected = this.isSelectAllSelected();
            } else if (item.key === SET_FILTER_ADD_SELECTION_TO_FILTER) {
                isSelected = this.valueModel.isAddCurrentSelectionToFilterChecked();
            } else if (item.children) {
                isSelected = this.areAllChildrenSelected(item);
            } else {
                isSelected = this.valueModel.isKeySelected(item.key!);
            }
        } else {
            if (item === SET_FILTER_SELECT_ALL) {
                isSelected = this.isSelectAllSelected();
            } else if (item === SET_FILTER_ADD_SELECTION_TO_FILTER) {
                isSelected = this.valueModel.isAddCurrentSelectionToFilterChecked();
            } else {
                isSelected = this.valueModel.isKeySelected(item);
            }
        }
        return { isSelected, isExpanded };
    }

    private isSetFilterModelTreeItem(item: any): item is SetFilterModelTreeItem {
        return item?.treeKey !== undefined;
    }

    private initMiniFilter() {
        const { eMiniFilter } = this;
        const translate = this.getLocaleTextFunc();

        eMiniFilter.setDisplayed(!this.params.suppressMiniFilter);
        eMiniFilter.setValue(this.valueModel.getMiniFilter());
        eMiniFilter.onValueChange(() => this.onMiniFilterInput());
        eMiniFilter.setInputAriaLabel(translate('ariaSearchFilterValues', 'Search filter values'));

        this.addManagedElementListeners(eMiniFilter.getInputElement(), {
            keydown: (e) => this.onMiniFilterKeyDown(e!),
        });
    }

    private updateMiniFilter() {
        const { eMiniFilter } = this;

        if (eMiniFilter.isDisplayed() !== !this.params.suppressMiniFilter) {
            eMiniFilter.setDisplayed(!this.params.suppressMiniFilter);
        }

        const miniFilterValue = this.valueModel.getMiniFilter();
        if (eMiniFilter.getValue() !== miniFilterValue) {
            eMiniFilter.setValue(miniFilterValue);
        }
    }

    // we need to have the GUI attached before we can draw the virtual rows, as the
    // virtual row logic needs info about the GUI state
    public override afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        super.afterGuiAttached(params);

        // collapse all tree list items (if tree list)
        this.resetExpansion();

        this.refreshVirtualList();

        const { eMiniFilter } = this;

        eMiniFilter.setInputPlaceholder(translateForSetFilter(this, 'searchOoo'));

        if (!params || !params.suppressFocus) {
            if (eMiniFilter.isDisplayed()) {
                eMiniFilter.getFocusableElement().focus();
            } else {
                this.virtualList.awaitStable(() => this.virtualList.focusRow(0));
            }
        }
    }

    public override afterGuiDetached(): void {
        super.afterGuiDetached();

        // discard any unapplied UI state (reset to model)
        if (this.params.excelMode) {
            this.resetMiniFilter();
        }
        const appliedModel = this.getModel();
        if (this.params.excelMode || !this.areModelsEqual(appliedModel!, this.getModelFromUi()!)) {
            this.resetUiToActiveModel(appliedModel);
            this.showOrHideResults();
        }
    }

    public override applyModel(source: 'api' | 'ui' | 'rowDataUpdated' = 'api'): boolean {
        if (this.params.excelMode && source !== 'rowDataUpdated' && this.valueModel.isEverythingVisibleSelected()) {
            // In Excel, if the filter is applied with all visible values selected, then any active filter on the
            // column is removed. This ensures the filter is removed in this situation.
            this.valueModel.selectAllMatchingMiniFilter();
        }

        // Here we implement AG-9090 TC2
        // When 'Add current selection to filter' is visible and checked, but no filter is applied:
        // Do NOT apply the current selection as filter.
        const shouldKeepCurrentSelection =
            this.valueModel.showAddCurrentSelectionToFilter() && this.valueModel.isAddCurrentSelectionToFilterChecked();
        if (shouldKeepCurrentSelection && !this.getModel()) {
            return false;
        }

        const result = super.applyModel(source, (appliedModel) => {
            // keep appliedModelKeys in sync with the applied model
            if (appliedModel) {
                if (!shouldKeepCurrentSelection) {
                    this.helper.filteringKeys.setFilteringKeys(new Set());
                }

                appliedModel.values.forEach((key) => {
                    this.helper.filteringKeys.addFilteringKey(key);
                });
            } else {
                if (!shouldKeepCurrentSelection) {
                    this.helper.filteringKeys.setFilteringKeys(null);
                }
            }
        });

        return result;
    }

    protected override isModelValid(model: SetFilterModel): boolean {
        return this.params.excelMode ? model == null || model.values.length > 0 : true;
    }

    public override onNewRowsLoaded(): void {
        if (this.isValuesTakenFromGrid()) {
            this.syncAfterDataChange();
        }
    }

    private isValuesTakenFromGrid(): boolean {
        const valuesType = this.valueModel.getValuesType();
        return valuesType === SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES;
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * Public method provided so the user can change the value of the filter once
     * the filter has been already started
     * @param values The values to use.
     */
    public setFilterValues(values: (V | null)[]): void {
        this.valueModel.overrideValues(values).then(() => {
            if (this.isAlive()) {
                this.checkAndRefreshVirtualList();
                this.onUiChanged();
            }
        });
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * Public method provided so the user can reset the values of the filter once that it has started.
     */
    public resetFilterValues(): void {
        this.valueModel.setValuesType(SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES);
        this.syncAfterDataChange();
    }

    public refreshFilterValues(): void {
        // the model is still being initialised
        if (!this.valueModel.isInitialised()) {
            return;
        }

        this.valueModel.refreshValues().then(() => {
            if (this.isAlive()) {
                this.hardRefreshVirtualList = true;
                this.checkAndRefreshVirtualList();
                this.onUiChanged();
            }
        });
    }

    public onAnyFilterChanged(): void {
        // don't block the current action when updating the values for this filter
        setTimeout(() => {
            if (!this.isAlive()) {
                return;
            }

            this.valueModel.refreshAfterAnyFilterChanged().then((refresh) => {
                if (refresh && this.isAlive()) {
                    this.checkAndRefreshVirtualList();
                    this.showOrHideResults();
                }
            });
        }, 0);
    }

    private onMiniFilterInput() {
        if (!this.valueModel.setMiniFilter(this.eMiniFilter.getValue())) {
            return;
        }

        const { applyMiniFilterWhileTyping, readOnly } = this.params;
        if (!readOnly && applyMiniFilterWhileTyping) {
            this.filterOnAllVisibleValues(false);
        } else {
            this.updateUiAfterMiniFilterChange();
        }
    }

    private updateUiAfterMiniFilterChange(): void {
        const { excelMode, readOnly } = this.params;
        if (excelMode == null || !!readOnly) {
            this.checkAndRefreshVirtualList();
        } else if (this.valueModel.getMiniFilter() == null) {
            this.resetUiToActiveModel(this.getModel());
        } else {
            this.valueModel.selectAllMatchingMiniFilter(true);
            this.checkAndRefreshVirtualList();
            this.onUiChanged();
        }

        this.showOrHideResults();
    }

    private showOrHideResults(): void {
        const hideResults = this.valueModel.getMiniFilter() != null && this.valueModel.getDisplayedValueCount() < 1;

        _setDisplayed(this.eFilterNoMatches, hideResults);
        _setDisplayed(this.eSetFilterList, !hideResults);
    }

    private resetMiniFilter(): void {
        this.eMiniFilter.setValue(null, true);
        this.valueModel.setMiniFilter(null);
    }

    protected override resetUiToActiveModel(
        currentModel: SetFilterModel | null,
        afterUiUpdatedFunc?: () => void
    ): void {
        // override the default behaviour as we don't always want to clear the mini filter
        this.setModelAndRefresh(currentModel == null ? null : currentModel.values).then(() => {
            if (this.isAlive()) {
                this.onUiChanged(false, 'prevent');

                afterUiUpdatedFunc?.();
            }
        });
    }

    protected override handleCancelEnd(e: Event): void {
        this.setMiniFilter(null);
        super.handleCancelEnd(e);
    }

    private onMiniFilterKeyDown(e: KeyboardEvent): void {
        const { excelMode, readOnly } = this.params;
        if (e.key === KeyCode.ENTER && !excelMode && !readOnly) {
            this.filterOnAllVisibleValues();
        }
    }

    private filterOnAllVisibleValues(applyImmediately = true): void {
        this.valueModel.selectAllMatchingMiniFilter(true);
        this.checkAndRefreshVirtualList();
        this.onUiChanged(false, applyImmediately ? 'immediately' : 'debounce');
        this.showOrHideResults();
    }

    private focusRowIfAlive(rowIndex: number | null): void {
        if (rowIndex == null) {
            return;
        }

        window.setTimeout(() => {
            if (this.isAlive()) {
                this.virtualList.focusRow(rowIndex);
            }
        }, 0);
    }

    private onSelectAll(isSelected: boolean): void {
        if (isSelected) {
            this.valueModel.selectAllMatchingMiniFilter();
        } else {
            this.valueModel.deselectAllMatchingMiniFilter();
        }

        this.refreshAfterSelection();
    }

    private onGroupItemSelected(item: SetFilterModelTreeItem, isSelected: boolean): void {
        const recursiveGroupSelection = (i: SetFilterModelTreeItem) => {
            if (!i.filterPasses) {
                return;
            }
            if (i.children) {
                i.children.forEach((childItem) => recursiveGroupSelection(childItem));
            } else {
                this.selectItem(i.key!, isSelected);
            }
        };

        recursiveGroupSelection(item);

        this.refreshAfterSelection();
    }

    private onItemSelected(key: string | null, isSelected: boolean): void {
        this.selectItem(key, isSelected);

        this.refreshAfterSelection();
    }

    private selectItem(key: string | null, isSelected: boolean): void {
        if (isSelected) {
            this.valueModel.selectKey(key);
        } else {
            this.valueModel.deselectKey(key);
        }
    }

    private onExpandAll(item: SetFilterModelTreeItem, isExpanded: boolean): void {
        const recursiveExpansion = (i: SetFilterModelTreeItem) => {
            if (i.filterPasses && i.available && i.children) {
                i.children.forEach((childItem) => recursiveExpansion(childItem));
                i.expanded = isExpanded;
            }
        };

        recursiveExpansion(item);

        this.refreshAfterExpansion();
    }

    private onExpandedChanged(item: SetFilterModelTreeItem, isExpanded: boolean): void {
        item.expanded = isExpanded;

        this.refreshAfterExpansion();
    }

    private refreshAfterExpansion(): void {
        const focusedRow = this.virtualList.getLastFocusedRow();

        this.valueModel.updateDisplayedValues('expansion');

        this.checkAndRefreshVirtualList();
        this.focusRowIfAlive(focusedRow);
    }

    private refreshAfterSelection(): void {
        const focusedRow = this.virtualList.getLastFocusedRow();

        this.checkAndRefreshVirtualList();
        this.onUiChanged();
        this.focusRowIfAlive(focusedRow);
    }

    public setMiniFilter(newMiniFilter: string | null): void {
        this.eMiniFilter.setValue(newMiniFilter);
        this.onMiniFilterInput();
    }

    public getMiniFilter(): string | null {
        return this.valueModel.getMiniFilter();
    }

    private checkAndRefreshVirtualList() {
        this.virtualList.refresh(!this.hardRefreshVirtualList);

        if (this.hardRefreshVirtualList) {
            this.hardRefreshVirtualList = false;
        }
    }

    public getFilterKeys(): SetFilterModelValue {
        return this.valueModel.getKeys();
    }

    public getFilterValues(): (V | null)[] {
        return this.valueModel.getValues();
    }

    public getValues(): SetFilterModelValue {
        return this.getFilterKeys();
    }

    public refreshVirtualList(): void {
        if (this.params.refreshValuesOnOpen) {
            this.refreshFilterValues();
        } else {
            this.checkAndRefreshVirtualList();
        }
    }

    private isSelectAllSelected(): boolean | undefined {
        if (!this.params.defaultToNothingSelected) {
            // everything selected by default
            if (this.valueModel.hasSelections() && this.valueModel.isNothingVisibleSelected()) {
                return false;
            }

            if (this.valueModel.isEverythingVisibleSelected()) {
                return true;
            }
        } else {
            // nothing selected by default
            if (this.valueModel.hasSelections() && this.valueModel.isEverythingVisibleSelected()) {
                return true;
            }

            if (this.valueModel.isNothingVisibleSelected()) {
                return false;
            }
        }
        // returning `undefined` means the checkbox status is indeterminate.
        return undefined;
    }

    private areAllChildrenSelected(item: SetFilterModelTreeItem): boolean | undefined {
        const recursiveChildSelectionCheck = (i: SetFilterModelTreeItem): boolean | undefined => {
            if (i.children) {
                let someTrue = false;
                let someFalse = false;
                const mixed = i.children.some((child) => {
                    if (!child.filterPasses || !child.available) {
                        return false;
                    }
                    const childSelected = recursiveChildSelectionCheck(child);
                    if (childSelected === undefined) {
                        return true;
                    }
                    if (childSelected) {
                        someTrue = true;
                    } else {
                        someFalse = true;
                    }
                    return someTrue && someFalse;
                });
                // returning `undefined` means the checkbox status is indeterminate.
                // if not mixed and some true, all must be true
                return mixed ? undefined : someTrue;
            } else {
                return this.valueModel.isKeySelected(i.key!);
            }
        };

        if (!this.params.defaultToNothingSelected) {
            // everything selected by default
            return recursiveChildSelectionCheck(item);
        } else {
            // nothing selected by default
            return this.valueModel.hasSelections() && recursiveChildSelectionCheck(item);
        }
    }

    public override destroy(): void {
        (this.virtualList as any) = this.destroyBean(this.virtualList);

        super.destroy();
    }

    private resetExpansion(): void {
        if (!this.params.treeList) {
            return;
        }

        const selectAllItem = this.valueModel.getSelectAllItem();

        if (this.isSetFilterModelTreeItem(selectAllItem)) {
            const recursiveCollapse = (i: SetFilterModelTreeItem) => {
                if (i.children) {
                    i.children.forEach((childItem) => recursiveCollapse(childItem));
                    i.expanded = false;
                }
            };
            recursiveCollapse(selectAllItem);
            this.valueModel.updateDisplayedValues('expansion');
        }
    }

    public getModelAsString(model: SetFilterModel): string {
        return this.filterModelFormatter.getModelAsString(model, this);
    }

    protected override getPositionableElement(): HTMLElement {
        return this.eSetFilterList;
    }
}

class ModelWrapper<V> implements VirtualListModel {
    constructor(private readonly model: SetValueModel<V>) {}

    public getRowCount(): number {
        return this.model.getDisplayedValueCount();
    }

    public getRow(index: number): string | null {
        return this.model.getDisplayedItem(index) as any;
    }

    public areRowsEqual(oldRow: string | null, newRow: string | null): boolean {
        return oldRow === newRow;
    }
}

class ModelWrapperWithSelectAll<V> implements VirtualListModel {
    constructor(
        private readonly model: SetValueModel<V>,
        private readonly isSelectAllSelected: () => boolean | undefined
    ) {}

    public getRowCount(): number {
        const showAddCurrentSelectionToFilter = this.model.showAddCurrentSelectionToFilter();
        const outboundItems = showAddCurrentSelectionToFilter ? 2 : 1;
        return this.model.getDisplayedValueCount() + outboundItems;
    }

    public getRow(index: number): string | null {
        if (index === 0) {
            return this.model.getSelectAllItem() as any;
        }

        const showAddCurrentSelectionToFilter = this.model.showAddCurrentSelectionToFilter();
        const outboundItems = showAddCurrentSelectionToFilter ? 2 : 1;
        if (index === 1 && showAddCurrentSelectionToFilter) {
            return this.model.getAddSelectionToFilterItem() as any;
        }

        return this.model.getDisplayedItem(index - outboundItems) as any;
    }

    public areRowsEqual(oldRow: string | null, newRow: string | null): boolean {
        return oldRow === newRow;
    }
}

// isRowSelected is used by VirtualList to add aria tags for flat lists. We want to suppress this when using trees
class TreeModelWrapper implements VirtualListModel {
    constructor(private readonly model: VirtualListModel) {}

    public getRowCount(): number {
        return this.model.getRowCount();
    }

    public getRow(index: number): SetFilterModelTreeItem | null {
        return this.model.getRow(index);
    }

    public areRowsEqual(oldRow: SetFilterModelTreeItem | null, newRow: SetFilterModelTreeItem | null): boolean {
        if (oldRow == null && newRow == null) {
            return true;
        }
        return oldRow != null && newRow != null && oldRow.treeKey === newRow.treeKey && oldRow.depth === newRow.depth;
    }
}
