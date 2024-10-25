import type {
    AgColumn,
    AgInputTextField,
    BeanCollection,
    ComponentSelector,
    DataTypeService,
    FuncColsService,
    GetDataPath,
    IAfterGuiAttachedParams,
    IDoesFilterPassParams,
    IRowNode,
    ISetFilter,
    KeyCreatorParams,
    SetFilterModel,
    SetFilterModelValue,
    SetFilterParams,
    ValueFormatterParams,
    ValueService,
} from 'ag-grid-community';
import {
    AgInputTextFieldSelector,
    AgPromise,
    GROUP_AUTO_COLUMN_ID,
    KeyCode,
    ProvidedFilter,
    RefPlaceholder,
    _areEqual,
    _getActiveDomElement,
    _last,
    _makeNull,
    _setDisplayed,
    _toStringOrNull,
    _warn,
} from 'ag-grid-community';

import type { VirtualListModel } from '../widgets/iVirtualList';
import { VirtualList } from '../widgets/virtualList';
import type { SetFilterModelTreeItem } from './iSetDisplayValueModel';
import { SET_FILTER_ADD_SELECTION_TO_FILTER, SET_FILTER_SELECT_ALL } from './iSetDisplayValueModel';
import type { ISetFilterLocaleText } from './localeText';
import { DEFAULT_LOCALE_TEXT } from './localeText';
import type {
    SetFilterListItemExpandedChangedEvent,
    SetFilterListItemParams,
    SetFilterListItemSelectionChangedEvent,
} from './setFilterListItem';
import { SetFilterListItem } from './setFilterListItem';
import { SetFilterModelFormatter } from './setFilterModelFormatter';
import { processDataPath } from './setFilterUtils';
import { SetFilterModelValuesType, SetValueModel } from './setValueModel';

/** @param V type of value in the Set Filter */
export class SetFilter<V = string> extends ProvidedFilter<SetFilterModel, V> implements ISetFilter<V> {
    private funcColsService: FuncColsService;
    private valueService: ValueService;
    private dataTypeService?: DataTypeService;

    public override wireBeans(beans: BeanCollection) {
        super.wireBeans(beans);
        this.funcColsService = beans.funcColsService;
        this.valueService = beans.valueService;
        this.dataTypeService = beans.dataTypeService;
    }

    private readonly eMiniFilter: AgInputTextField = RefPlaceholder;
    private readonly eFilterLoading: HTMLElement = RefPlaceholder;
    private readonly eSetFilterList: HTMLElement = RefPlaceholder;
    private readonly eFilterNoMatches: HTMLElement = RefPlaceholder;

    private valueModel: SetValueModel<V> | null = null;
    private setFilterParams: SetFilterParams<any, V> | null = null;
    private virtualList: VirtualList<any> | null = null;
    private caseSensitive: boolean = false;
    private treeDataTreeList = false;
    private getDataPath?: GetDataPath<any>;
    private groupingTreeList = false;
    private hardRefreshVirtualList = false;
    private noValueFormatterSupplied = false;

    private createKey: (value: V | null | undefined, node?: IRowNode | null) => string | null;

    private valueFormatter?: (params: ValueFormatterParams) => string;
    private readonly filterModelFormatter = new SetFilterModelFormatter();

    constructor() {
        super('setFilter');
    }

    public override postConstruct() {
        super.postConstruct();
    }

    // unlike the simple filters, nothing in the set filter UI shows/hides.
    // maybe this method belongs in abstractSimpleFilter???
    protected updateUiVisibility(): void {}

    protected createBodyTemplate(): string {
        return /* html */ `
            <div class="ag-set-filter">
                <div data-ref="eFilterLoading" class="ag-filter-loading ag-hidden">${this.translateForSetFilter('loadingOoo')}</div>
                <ag-input-text-field class="ag-mini-filter" data-ref="eMiniFilter"></ag-input-text-field>
                <div data-ref="eFilterNoMatches" class="ag-filter-no-matches ag-hidden">${this.translateForSetFilter('noMatches')}</div>
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
        if (!this.setFilterParams) {
            return;
        }

        const { excelMode, readOnly } = this.setFilterParams || {};
        if (!excelMode || !!readOnly) {
            return;
        }

        e.preventDefault();

        // in Excel Mode, hitting Enter is the same as pressing the Apply button
        this.onBtApply(false, false, e);

        if (this.setFilterParams.excelMode === 'mac') {
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
        if (!this.eSetFilterList.contains(_getActiveDomElement(this.gos)) || !this.virtualList) {
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

        const { readOnly } = this.setFilterParams ?? {};
        if (readOnly) {
            return;
        }
        return component;
    }

    protected getCssIdentifier(): string {
        return 'set-filter';
    }

    public override setModel(model: SetFilterModel | null): AgPromise<void> {
        if (model == null && this.valueModel?.getModel() == null) {
            // refreshing is expensive. if new and old model are both null (e.g. nothing set), skip.
            // mini filter isn't contained within the model, so always reset
            this.setMiniFilter(null);
            return AgPromise.resolve();
        }
        return super.setModel(model);
    }

    override refresh(params: SetFilterParams<any, V>): boolean {
        this.applyExcelModeOptions(params);

        if (!super.refresh(params)) {
            return false;
        }

        const oldParams = this.setFilterParams;

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

        if (this.haveColDefParamsChanged(params)) {
            return false;
        }

        super.updateParams(params);
        this.updateSetFilterOnParamsChange(params);
        this.updateMiniFilter();

        if (params.suppressSelectAll !== oldParams?.suppressSelectAll) {
            this.createVirtualListModel(params);
        }

        this.valueModel?.updateOnParamsChange(params).then(() => {
            this.refreshFilterValues();
        });

        return true;
    }

    private haveColDefParamsChanged(params: SetFilterParams<any, V>): boolean {
        const { colDef, keyCreator } = params;
        const { colDef: existingColDef, keyCreator: existingKeyCreator } = this.setFilterParams ?? {};

        const currentKeyCreator = keyCreator ?? colDef.keyCreator;
        const previousKeyCreator = existingKeyCreator ?? existingColDef?.keyCreator;

        const filterValueGetterChanged = colDef.filterValueGetter !== existingColDef?.filterValueGetter;
        const keyCreatorChanged = currentKeyCreator !== previousKeyCreator;
        const valueFormatterIsKeyCreatorAndHasChanged =
            !!this.dataTypeService &&
            !!currentKeyCreator &&
            this.dataTypeService.getFormatValue(colDef.cellDataType as string) === currentKeyCreator &&
            colDef.valueFormatter !== existingColDef?.valueFormatter;

        return filterValueGetterChanged || keyCreatorChanged || valueFormatterIsKeyCreatorAndHasChanged;
    }

    private setModelAndRefresh(values: SetFilterModelValue | null): AgPromise<void> {
        return this.valueModel
            ? this.valueModel.setModel(values).then(() => {
                  if (this.isAlive()) {
                      // Async values could arrive after the grid has been destroyed
                      this.checkAndRefreshVirtualList();
                  }
              })
            : AgPromise.resolve();
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
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        const values = this.valueModel.getModel();

        if (!values) {
            return null;
        }

        return { values, filterType: this.getFilterType() };
    }

    public getFilterType(): 'set' {
        return 'set';
    }

    public getValueModel(): SetValueModel<V> | null {
        return this.valueModel;
    }

    protected areModelsEqual(a: SetFilterModel, b: SetFilterModel): boolean {
        // both are missing
        if (a == null && b == null) {
            return true;
        }

        return a != null && b != null && _areEqual(a.values, b.values);
    }

    private updateSetFilterOnParamsChange = (newParams: SetFilterParams<any, V>) => {
        this.setFilterParams = newParams;
        this.caseSensitive = !!newParams.caseSensitive;
        const keyCreator = newParams.keyCreator ?? newParams.colDef.keyCreator;
        this.setValueFormatter(newParams.valueFormatter, keyCreator, !!newParams.treeList, !!newParams.colDef.refData);
        const isGroupCol = newParams.column.getId().startsWith(GROUP_AUTO_COLUMN_ID);
        this.treeDataTreeList = this.gos.get('treeData') && !!newParams.treeList && isGroupCol;
        this.getDataPath = this.gos.get('getDataPath');
        this.groupingTreeList = !!this.funcColsService.rowGroupCols.length && !!newParams.treeList && isGroupCol;
        this.createKey = this.generateCreateKey(keyCreator, this.treeDataTreeList || this.groupingTreeList);
    };

    public override setParams(params: SetFilterParams<any, V>): void {
        this.applyExcelModeOptions(params);

        super.setParams(params);

        this.updateSetFilterOnParamsChange(params);

        const keyCreator = params.keyCreator ?? params.colDef.keyCreator;

        this.valueModel = new SetValueModel({
            filterParams: params,
            setIsLoading: (loading) => this.setIsLoading(loading),
            translate: (key) => this.translateForSetFilter(key),
            caseFormat: (v) => this.caseFormat(v),
            createKey: this.createKey,
            valueFormatter: this.valueFormatter,
            usingComplexObjects: !!keyCreator,
            gos: this.gos,
            funcColsService: this.funcColsService,
            valueService: this.valueService,
            treeDataTreeList: this.treeDataTreeList,
            groupingTreeList: this.groupingTreeList,
            addManagedEventListeners: (handlers) => this.addManagedEventListeners(handlers),
        });

        this.initialiseFilterBodyUi();

        this.addEventListenersForDataChanges();
    }

    private onAddCurrentSelectionToFilterChange(newValue: boolean) {
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        this.valueModel.setAddCurrentSelectionToFilter(newValue);
    }

    private setValueFormatter(
        providedValueFormatter: ((params: ValueFormatterParams) => string) | undefined,
        keyCreator: ((params: KeyCreatorParams<any, any>) => string) | undefined,
        treeList: boolean,
        isRefData: boolean
    ) {
        let valueFormatter = providedValueFormatter;
        if (!valueFormatter) {
            if (keyCreator && !treeList) {
                throw new Error('AG Grid: Must supply a Value Formatter in Set Filter params when using a Key Creator');
            }
            this.noValueFormatterSupplied = true;
            // ref data is handled by ValueService
            if (!isRefData) {
                valueFormatter = (params) => _toStringOrNull(params.value)!;
            }
        }
        this.valueFormatter = valueFormatter;
    }

    private generateCreateKey(
        keyCreator: ((params: KeyCreatorParams<any, any>) => string) | undefined,
        treeDataOrGrouping: boolean
    ): (value: V | null | undefined, node?: IRowNode | null) => string | null {
        if (treeDataOrGrouping && !keyCreator) {
            throw new Error(
                'AG Grid: Must supply a Key Creator in Set Filter params when `treeList = true` on a group column, and Tree Data or Row Grouping is enabled.'
            );
        }
        if (keyCreator) {
            return (value, node = null) => {
                const params = this.getKeyCreatorParams(value, node);
                return _makeNull(keyCreator!(params));
            };
        }
        return (value) => _makeNull(_toStringOrNull(value));
    }

    public getFormattedValue(key: string | null): string | null {
        let value: V | string | null = this.valueModel!.getValue(key);
        if (this.noValueFormatterSupplied && (this.treeDataTreeList || this.groupingTreeList) && Array.isArray(value)) {
            // essentially get back the cell value
            value = _last(value) as string;
        }

        const formattedValue = this.valueService.formatValue(
            this.setFilterParams!.column as AgColumn,
            null,
            value,
            this.valueFormatter,
            false
        );

        return (
            (formattedValue == null ? _toStringOrNull(value) : formattedValue) ?? this.translateForSetFilter('blanks')
        );
    }

    private applyExcelModeOptions(params: SetFilterParams<any, V>): void {
        // apply default options to match Excel behaviour, unless they have already been specified
        if (params.excelMode === 'windows') {
            if (!params.buttons) {
                params.buttons = ['apply', 'cancel'];
            }

            if (params.closeOnApply == null) {
                params.closeOnApply = true;
            }
        } else if (params.excelMode === 'mac') {
            if (!params.buttons) {
                params.buttons = ['reset'];
            }

            if (params.applyMiniFilterWhileTyping == null) {
                params.applyMiniFilterWhileTyping = true;
            }

            if (params.debounceMs == null) {
                params.debounceMs = 500;
            }
        }
        if (params.excelMode && params.defaultToNothingSelected) {
            params.defaultToNothingSelected = false;
            _warn(207);
        }
    }

    private addEventListenersForDataChanges(): void {
        if (!this.isValuesTakenFromGrid()) {
            return;
        }

        this.addManagedEventListeners({
            cellValueChanged: (event) => {
                // only interested in changes to do with this column
                if (this.setFilterParams && event.column === this.setFilterParams.column) {
                    this.syncAfterDataChange();
                }
            },
        });

        this.addManagedPropertyListeners(['treeData', 'getDataPath', 'groupAllowUnbalanced'], () => {
            this.syncAfterDataChange();
        });
    }

    private syncAfterDataChange(): AgPromise<void> {
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        const promise = this.valueModel.refreshValues();

        return promise.then(() => {
            this.checkAndRefreshVirtualList();
            if (!this.applyActive || this.areModelsEqual(this.getModel()!, this.getModelFromUi()!)) {
                this.onBtApply(false, true);
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
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        const translate = this.getLocaleTextFunc();
        const filterListName = translate('ariaFilterList', 'Filter List');
        const isTree = !!this.setFilterParams.treeList;

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

        const { cellHeight } = this.setFilterParams;

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

        this.createVirtualListModel(this.setFilterParams);
    }

    private createVirtualListModel(params: SetFilterParams<any, V>): void {
        if (!this.valueModel) {
            return;
        }

        let model: VirtualListModel;
        if (params.suppressSelectAll) {
            model = new ModelWrapper(this.valueModel);
        } else {
            model = new ModelWrapperWithSelectAll(this.valueModel, () => this.isSelectAllSelected());
        }
        if (params.treeList) {
            model = new TreeModelWrapper(model);
        }

        this.virtualList?.setModel(model);
    }

    private getSelectAllLabel(): string {
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        const key =
            this.valueModel.getMiniFilter() == null || !this.setFilterParams.excelMode
                ? 'selectAll'
                : 'selectAllSearchResults';

        return this.translateForSetFilter(key);
    }

    private getAddSelectionToFilterLabel(): string {
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        return this.translateForSetFilter('addCurrentSelectionToFilter');
    }

    private createSetListItem(
        item: SetFilterModelTreeItem | string | null,
        isTree: boolean,
        focusWrapper: HTMLElement
    ): SetFilterListItem<V | string | null> {
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        const groupsExist = this.valueModel.hasGroups();
        const { isSelected, isExpanded } = this.isSelectedExpanded(item);

        const { value, depth, isGroup, hasIndeterminateExpandState, selectedListener, expandedListener } =
            this.newSetListItemAttributes(item);

        const itemParams: SetFilterListItemParams<V | string | null> = {
            focusWrapper,
            value,
            params: this.setFilterParams,
            translate: (translateKey: any) => this.translateForSetFilter(translateKey),
            valueFormatter: this.valueFormatter,
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
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

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
                value:
                    this.setFilterParams.treeListFormatter?.(item.treeKey, item.depth, item.parentTreeKeys) ??
                    item.treeKey,
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
            value:
                this.setFilterParams.treeListFormatter?.(item.treeKey, item.depth, item.parentTreeKeys) ?? item.treeKey,
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
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

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
                isSelected = this.valueModel!.isAddCurrentSelectionToFilterChecked();
            } else if (item.children) {
                isSelected = this.areAllChildrenSelected(item);
            } else {
                isSelected = this.valueModel!.isKeySelected(item.key!);
            }
        } else {
            if (item === SET_FILTER_SELECT_ALL) {
                isSelected = this.isSelectAllSelected();
            } else if (item === SET_FILTER_ADD_SELECTION_TO_FILTER) {
                isSelected = this.valueModel!.isAddCurrentSelectionToFilterChecked();
            } else {
                isSelected = this.valueModel!.isKeySelected(item);
            }
        }
        return { isSelected, isExpanded };
    }

    private isSetFilterModelTreeItem(item: any): item is SetFilterModelTreeItem {
        return item?.treeKey !== undefined;
    }

    private initMiniFilter() {
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        const { eMiniFilter } = this;
        const translate = this.getLocaleTextFunc();

        eMiniFilter.setDisplayed(!this.setFilterParams.suppressMiniFilter);
        eMiniFilter.setValue(this.valueModel.getMiniFilter());
        eMiniFilter.onValueChange(() => this.onMiniFilterInput());
        eMiniFilter.setInputAriaLabel(translate('ariaSearchFilterValues', 'Search filter values'));

        this.addManagedElementListeners(eMiniFilter.getInputElement(), {
            keydown: (e) => this.onMiniFilterKeyDown(e!),
        });
    }

    private updateMiniFilter() {
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        const { eMiniFilter } = this;

        if (eMiniFilter.isDisplayed() !== !this.setFilterParams.suppressMiniFilter) {
            eMiniFilter.setDisplayed(!this.setFilterParams.suppressMiniFilter);
        }

        const miniFilterValue = this.valueModel.getMiniFilter();
        if (eMiniFilter.getValue() !== miniFilterValue) {
            eMiniFilter.setValue(miniFilterValue);
        }
    }

    // we need to have the GUI attached before we can draw the virtual rows, as the
    // virtual row logic needs info about the GUI state
    public override afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }

        super.afterGuiAttached(params);

        // collapse all tree list items (if tree list)
        this.resetExpansion();

        this.refreshVirtualList();

        const { eMiniFilter } = this;

        eMiniFilter.setInputPlaceholder(this.translateForSetFilter('searchOoo'));

        if (!params || !params.suppressFocus) {
            if (eMiniFilter.isDisplayed()) {
                eMiniFilter.getFocusableElement().focus();
            } else {
                this.virtualList?.awaitStable(() => this.virtualList?.focusRow(0));
            }
        }
    }

    public override afterGuiDetached(): void {
        super.afterGuiDetached();

        // discard any unapplied UI state (reset to model)
        if (this.setFilterParams?.excelMode) {
            this.resetMiniFilter();
        }
        const appliedModel = this.getModel();
        if (this.setFilterParams?.excelMode || !this.areModelsEqual(appliedModel!, this.getModelFromUi()!)) {
            this.resetUiToActiveModel(appliedModel);
            this.showOrHideResults();
        }
    }

    public override applyModel(source: 'api' | 'ui' | 'rowDataUpdated' = 'api'): boolean {
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        if (
            this.setFilterParams.excelMode &&
            source !== 'rowDataUpdated' &&
            this.valueModel.isEverythingVisibleSelected()
        ) {
            // In Excel, if the filter is applied with all visible values selected, then any active filter on the
            // column is removed. This ensures the filter is removed in this situation.
            this.valueModel.selectAllMatchingMiniFilter();
        }

        // Here we implement AG-9090 TC2
        // When 'Add current selection to filter' is visible and checked, but no filter is applied:
        // Do NOT apply the current selection as filter.
        const shouldKeepCurrentSelection =
            this.valueModel!.showAddCurrentSelectionToFilter() &&
            this.valueModel!.isAddCurrentSelectionToFilterChecked();
        if (shouldKeepCurrentSelection && !this.getModel()) {
            return false;
        }

        const result = super.applyModel(source);

        // keep appliedModelKeys in sync with the applied model
        const appliedModel = this.getModel();

        if (appliedModel) {
            if (!shouldKeepCurrentSelection) {
                this.valueModel.setAppliedModelKeys(new Set());
            }

            appliedModel.values.forEach((key) => {
                this.valueModel!.addToAppliedModelKeys(key);
            });
        } else {
            if (!shouldKeepCurrentSelection) {
                this.valueModel.setAppliedModelKeys(null);
            }
        }

        return result;
    }

    protected override isModelValid(model: SetFilterModel): boolean {
        return this.setFilterParams && this.setFilterParams.excelMode ? model == null || model.values.length > 0 : true;
    }

    public doesFilterPass(params: IDoesFilterPassParams): boolean {
        if (!this.setFilterParams || !this.valueModel || !this.valueModel.getCaseFormattedAppliedModelKeys()) {
            return true;
        }

        // if nothing selected, don't need to check value
        if (!this.valueModel.hasAnyAppliedModelKey()) {
            return false;
        }

        const { node, data } = params;
        if (this.treeDataTreeList) {
            return this.doesFilterPassForTreeData(node, data);
        }
        if (this.groupingTreeList) {
            return this.doesFilterPassForGrouping(node);
        }

        const value = this.getValueFromNode(node);

        if (value != null && Array.isArray(value)) {
            if (value.length === 0) {
                return this.valueModel!.hasAppliedModelKey(null);
            }
            return value.some((v) => this.isInAppliedModel(this.createKey(v, node)));
        }

        return this.isInAppliedModel(this.createKey(value, node));
    }

    private doesFilterPassForTreeData(node: IRowNode, data: any): boolean {
        if (node.childrenAfterGroup?.length) {
            // only perform checking on leaves. The core filtering logic for tree data won't work properly otherwise
            return false;
        }
        return this.isInAppliedModel(
            this.createKey(
                processDataPath(this.getDataPath!(data), true, this.gos.get('groupAllowUnbalanced')) as any
            ) as any
        );
    }

    private doesFilterPassForGrouping(node: IRowNode): boolean {
        const dataPath = this.funcColsService.rowGroupCols.map((groupCol) =>
            this.valueService.getKeyForNode(groupCol, node)
        );
        dataPath.push(this.getValueFromNode(node));
        return this.isInAppliedModel(
            this.createKey(processDataPath(dataPath, false, this.gos.get('groupAllowUnbalanced')) as any) as any
        );
    }

    private isInAppliedModel(key: string | null): boolean {
        return this.valueModel!.hasAppliedModelKey(key);
    }

    private getValueFromNode(node: IRowNode): V | null | undefined {
        return this.setFilterParams!.getValue(node);
    }

    private getKeyCreatorParams(value: V | null | undefined, node: IRowNode | null = null): KeyCreatorParams {
        return {
            value,
            colDef: this.setFilterParams!.colDef,
            column: this.setFilterParams!.column,
            node: node,
            data: node?.data,
            api: this.setFilterParams!.api,
            context: this.setFilterParams!.context,
        };
    }

    public override onNewRowsLoaded(): void {
        if (!this.isValuesTakenFromGrid()) {
            return;
        }
        this.syncAfterDataChange();
    }

    private isValuesTakenFromGrid(): boolean {
        if (!this.valueModel) {
            return false;
        }
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
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        this.valueModel.overrideValues(values).then(() => {
            this.checkAndRefreshVirtualList();
            this.onUiChanged();
        });
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * Public method provided so the user can reset the values of the filter once that it has started.
     */
    public resetFilterValues(): void {
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        this.valueModel.setValuesType(SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES);
        this.syncAfterDataChange();
    }

    public refreshFilterValues(): void {
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        // the model is still being initialised
        if (!this.valueModel.isInitialised()) {
            return;
        }

        this.valueModel.refreshValues().then(() => {
            this.hardRefreshVirtualList = true;
            this.checkAndRefreshVirtualList();
            this.onUiChanged();
        });
    }

    public onAnyFilterChanged(): void {
        // don't block the current action when updating the values for this filter
        setTimeout(() => {
            if (!this.isAlive()) {
                return;
            }

            if (!this.valueModel) {
                throw new Error('Value model has not been created.');
            }

            this.valueModel.refreshAfterAnyFilterChanged().then((refresh) => {
                if (refresh) {
                    this.checkAndRefreshVirtualList();
                    this.showOrHideResults();
                }
            });
        }, 0);
    }

    private onMiniFilterInput() {
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        if (!this.valueModel.setMiniFilter(this.eMiniFilter.getValue())) {
            return;
        }

        const { applyMiniFilterWhileTyping, readOnly } = this.setFilterParams || {};
        if (!readOnly && applyMiniFilterWhileTyping) {
            this.filterOnAllVisibleValues(false);
        } else {
            this.updateUiAfterMiniFilterChange();
        }
    }

    private updateUiAfterMiniFilterChange(): void {
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        const { excelMode, readOnly } = this.setFilterParams || {};
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
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }

        const hideResults = this.valueModel.getMiniFilter() != null && this.valueModel.getDisplayedValueCount() < 1;

        _setDisplayed(this.eFilterNoMatches, hideResults);
        _setDisplayed(this.eSetFilterList, !hideResults);
    }

    private resetMiniFilter(): void {
        this.eMiniFilter.setValue(null, true);
        this.valueModel?.setMiniFilter(null);
    }

    protected override resetUiToActiveModel(
        currentModel: SetFilterModel | null,
        afterUiUpdatedFunc?: () => void
    ): void {
        // override the default behaviour as we don't always want to clear the mini filter
        this.setModelAndRefresh(currentModel == null ? null : currentModel.values).then(() => {
            this.onUiChanged(false, 'prevent');

            afterUiUpdatedFunc?.();
        });
    }

    protected override handleCancelEnd(e: Event): void {
        this.setMiniFilter(null);
        super.handleCancelEnd(e);
    }

    private onMiniFilterKeyDown(e: KeyboardEvent): void {
        const { excelMode, readOnly } = this.setFilterParams || {};
        if (e.key === KeyCode.ENTER && !excelMode && !readOnly) {
            this.filterOnAllVisibleValues();
        }
    }

    private filterOnAllVisibleValues(applyImmediately = true): void {
        const { readOnly } = this.setFilterParams || {};

        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        if (readOnly) {
            throw new Error('Unable to filter in readOnly mode.');
        }

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
            if (!this.virtualList) {
                throw new Error('Virtual list has not been created.');
            }

            if (this.isAlive()) {
                this.virtualList.focusRow(rowIndex);
            }
        }, 0);
    }

    private onSelectAll(isSelected: boolean): void {
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        if (!this.virtualList) {
            throw new Error('Virtual list has not been created.');
        }

        if (isSelected) {
            this.valueModel.selectAllMatchingMiniFilter();
        } else {
            this.valueModel.deselectAllMatchingMiniFilter();
        }

        this.refreshAfterSelection();
    }

    private onGroupItemSelected(item: SetFilterModelTreeItem, isSelected: boolean): void {
        const recursiveGroupSelection = (i: SetFilterModelTreeItem) => {
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
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        if (!this.virtualList) {
            throw new Error('Virtual list has not been created.');
        }

        this.selectItem(key, isSelected);

        this.refreshAfterSelection();
    }

    private selectItem(key: string | null, isSelected: boolean): void {
        if (isSelected) {
            this.valueModel!.selectKey(key);
        } else {
            this.valueModel!.deselectKey(key);
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
        const focusedRow = this.virtualList!.getLastFocusedRow();

        this.valueModel!.updateDisplayedValues('expansion');

        this.checkAndRefreshVirtualList();
        this.focusRowIfAlive(focusedRow);
    }

    private refreshAfterSelection(): void {
        const focusedRow = this.virtualList!.getLastFocusedRow();

        this.checkAndRefreshVirtualList();
        this.onUiChanged();
        this.focusRowIfAlive(focusedRow);
    }

    public setMiniFilter(newMiniFilter: string | null): void {
        this.eMiniFilter.setValue(newMiniFilter);
        this.onMiniFilterInput();
    }

    public getMiniFilter(): string | null {
        return this.valueModel ? this.valueModel.getMiniFilter() : null;
    }

    private checkAndRefreshVirtualList() {
        if (!this.virtualList) {
            throw new Error('Virtual list has not been created.');
        }

        this.virtualList.refresh(!this.hardRefreshVirtualList);

        if (this.hardRefreshVirtualList) {
            this.hardRefreshVirtualList = false;
        }
    }

    public getFilterKeys(): SetFilterModelValue {
        return this.valueModel ? this.valueModel.getKeys() : [];
    }

    public getFilterValues(): (V | null)[] {
        return this.valueModel ? this.valueModel.getValues() : [];
    }

    public getValues(): SetFilterModelValue {
        return this.getFilterKeys();
    }

    public refreshVirtualList(): void {
        if (this.setFilterParams && this.setFilterParams.refreshValuesOnOpen) {
            this.refreshFilterValues();
        } else {
            this.checkAndRefreshVirtualList();
        }
    }

    private translateForSetFilter(key: keyof ISetFilterLocaleText): string {
        const translate = this.getLocaleTextFunc();

        return translate(key, DEFAULT_LOCALE_TEXT[key]);
    }

    private isSelectAllSelected(): boolean | undefined {
        if (!this.setFilterParams || !this.valueModel) {
            return false;
        }

        if (!this.setFilterParams.defaultToNothingSelected) {
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
                return this.valueModel!.isKeySelected(i.key!);
            }
        };

        if (!this.setFilterParams!.defaultToNothingSelected) {
            // everything selected by default
            return recursiveChildSelectionCheck(item);
        } else {
            // nothing selected by default
            return this.valueModel!.hasSelections() && recursiveChildSelectionCheck(item);
        }
    }

    public override destroy(): void {
        if (this.virtualList != null) {
            this.virtualList.destroy();
            this.virtualList = null;
        }

        super.destroy();
    }

    private caseFormat<T extends string | number | null>(valueToFormat: T): typeof valueToFormat {
        if (valueToFormat == null || typeof valueToFormat !== 'string') {
            return valueToFormat;
        }
        return this.caseSensitive ? valueToFormat : (valueToFormat.toUpperCase() as T);
    }

    private resetExpansion(): void {
        if (!this.setFilterParams?.treeList) {
            return;
        }

        const selectAllItem = this.valueModel?.getSelectAllItem();

        if (this.isSetFilterModelTreeItem(selectAllItem)) {
            const recursiveCollapse = (i: SetFilterModelTreeItem) => {
                if (i.children) {
                    i.children.forEach((childItem) => recursiveCollapse(childItem));
                    i.expanded = false;
                }
            };
            recursiveCollapse(selectAllItem);
            this.valueModel!.updateDisplayedValues('expansion');
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
