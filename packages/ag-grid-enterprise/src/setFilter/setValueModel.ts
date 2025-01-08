import type {
    AgColumn,
    RowNode,
    SetFilterModelValue,
    SetFilterParams,
    TextFormatter,
    ValueFormatterParams,
} from 'ag-grid-community';
import { AgPromise, BeanStub, _exists, _makeNull } from 'ag-grid-community';

import { FlatSetDisplayValueModel } from './flatSetDisplayValueModel';
import type { ISetDisplayValueModel, SetFilterModelTreeItem } from './iSetDisplayValueModel';
import type { ISetFilterLocaleText } from './localeText';
import type { SetFilterAllValues } from './setFilterAllValues';
import { TreeSetDisplayValueModel } from './treeSetDisplayValueModel';

export enum SetFilterModelValuesType {
    PROVIDED_LIST,
    PROVIDED_CALLBACK,
    TAKEN_FROM_GRID_VALUES,
}

export interface SetValueModelParams<V> {
    filterParams: SetFilterParams<any, V>;
    translate: (key: keyof ISetFilterLocaleText) => string;
    caseFormat: <T extends string | null>(valueToFormat: T) => typeof valueToFormat;
    getValueFormatter: () => ((params: ValueFormatterParams) => string) | undefined;
    treeDataTreeList?: boolean;
    groupingTreeList?: boolean;
    allValues: SetFilterAllValues<V>;
}

type SetValueModelEvent = 'availableValuesChanged' | 'loadingStart' | 'loadingEnd';
/** @param V type of value in the Set Filter */
export class SetValueModel<V> extends BeanStub<SetValueModelEvent> {
    private formatter: TextFormatter;
    private doesRowPassOtherFilters: (node: RowNode) => boolean;
    private displayValueModel: ISetDisplayValueModel<V>;
    private filterParams: SetFilterParams<any, V>;
    private translate: (key: keyof ISetFilterLocaleText) => string;
    private caseFormat: <T extends string | null>(valueToFormat: T) => typeof valueToFormat;

    private miniFilterText: string | null = null;

    /** When true, in excelMode = 'windows', it adds previously selected filter items to newly checked filter selection */
    private addCurrentSelectionToFilter: boolean = false;

    private allValues: SetFilterAllValues<V>;

    /** Remaining keys when filters from other columns have been applied. */
    private availableKeys = new Set<string | null>();

    /** Keys that have been selected for this filter. */
    private selectedKeys = new Set<string | null>();

    private initialised: boolean = false;

    constructor(private params: SetValueModelParams<V>) {
        super();
    }

    public postConstruct(): void {
        const {
            treeDataTreeList,
            groupingTreeList,
            filterParams,
            getValueFormatter,
            translate,
            caseFormat,
            allValues,
        } = this.params;
        const { column, textFormatter, treeList, treeListPathGetter, treeListFormatter, doesRowPassOtherFilter } =
            filterParams;

        this.filterParams = filterParams;
        this.allValues = allValues;
        this.translate = translate;
        this.caseFormat = caseFormat;
        this.formatter = textFormatter ?? ((value) => value ?? null);
        this.doesRowPassOtherFilters = doesRowPassOtherFilter;

        this.displayValueModel = treeList
            ? new TreeSetDisplayValueModel(
                  this.formatter,
                  treeListPathGetter,
                  treeListFormatter,
                  treeDataTreeList || groupingTreeList
              )
            : (new FlatSetDisplayValueModel<V>(
                  this.beans.valueSvc,
                  getValueFormatter,
                  this.formatter,
                  column as AgColumn
              ) as any);

        this.allValues.allValuesPromise.then((values) => {
            this.updateAvailableValues(values);
            this.resetSelectionState(values ?? []);
        });
    }

    public updateOnParamsChange(filterParams: SetFilterParams<any, V>): AgPromise<void> {
        return new AgPromise<void>((resolve) => {
            const { textFormatter } = filterParams;
            // const { values, textFormatter, suppressSorting, treeListFormatter } = filterParams;

            // const currentProvidedValues = this.providedValues;
            // const currentSuppressSorting = this.suppressSorting;

            this.filterParams = filterParams;
            this.formatter = textFormatter ?? ((value) => value ?? null);

            // this.suppressSorting = suppressSorting || false;
            // this.providedValues = values ?? null;

            // if (this.displayValueModel instanceof TreeSetDisplayValueModel) {
            //     this.displayValueModel.updateOnParamsChange(treeListFormatter);
            // }

            // // Rebuild values when values or their sort order changes
            // if (this.providedValues !== currentProvidedValues || this.suppressSorting !== currentSuppressSorting) {
            //     if (!values || values.length === 0) {
            //         this.valuesType = SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES;
            //         this.providedValues = null;
            //     } else {
            //         this.valuesType = Array.isArray(values)
            //             ? SetFilterModelValuesType.PROVIDED_LIST
            //             : SetFilterModelValuesType.PROVIDED_CALLBACK;
            //     }

            //     const currentModel = this.getModel();
            //     this.updateAllValues().then(() => {
            //         this.setModel(currentModel).then(() => resolve());
            //     });
            // } else {
            resolve();
            // }
        });
    }

    /**
     * Re-fetches the values used in the filter from the value source.
     * If keepSelection is false, the filter selection will be reset to everything selected,
     * otherwise the current selection will be preserved.
     */
    public refreshValues(): AgPromise<void> {
        return new AgPromise<void>((resolve) => {
            // don't get the model until values are resolved, as there could be queued setModel calls
            this.allValues.allValuesPromise.then(() => {
                const currentModel = this.getModel();

                this.allValues.updateAllValues().then((values) => {
                    this.updateAvailableValues(values);
                    // ensure model is updated for new values
                    this.setModel(currentModel).then(() => resolve());
                });
            });
        });
    }

    /**
     * Overrides the current values being used for the set filter.
     * If keepSelection is false, the filter selection will be reset to everything selected,
     * otherwise the current selection will be preserved.
     */
    public overrideValues(valuesToUse: (V | null)[]): AgPromise<void> {
        return new AgPromise<void>((resolve) => {
            // wait for any existing values to be populated before overriding
            this.allValues.overrideValues(valuesToUse).then(() => {
                this.refreshValues().then(() => resolve());
            });
        });
    }

    /** @return has anything been updated */
    public refreshAfterAnyFilterChanged(): AgPromise<boolean> {
        if (this.showAvailableOnly()) {
            return this.allValues.allValuesPromise.then((keys) => {
                this.updateAvailableKeys(keys ?? [], 'otherFilter');
                return true;
            });
        }
        return AgPromise.resolve(false);
    }

    public isInitialised(): boolean {
        return this.initialised;
    }

    private updateAllValues(): AgPromise<(string | null)[]> {
        return this.allValues.updateAllValues().then((values) => {
            this.updateAvailableValues(values);
            return values ?? [];
        });
    }

    private updateAvailableValues(values: (string | null)[] | null): void {
        this.updateAvailableKeys(values || [], 'reload');
        this.initialised = true;
    }

    public isKeyAvailable(key: string | null): boolean {
        return this.availableKeys.has(key);
    }

    private showAvailableOnly(): boolean {
        return this.allValues.valuesType === SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES;
    }

    private updateAvailableKeys(allKeys: (string | null)[], source: 'reload' | 'otherFilter'): void {
        const availableKeys = this.showAvailableOnly()
            ? this.allValues.getAvailableValues((node) => this.doesRowPassOtherFilters(node))
            : allKeys;

        this.availableKeys = new Set(availableKeys);
        this.dispatchLocalEvent({ type: 'availableValuesChanged' });

        this.updateDisplayedValues(source, allKeys);
    }

    /** Sets mini filter value. Returns true if it changed from last value, otherwise false. */
    public setMiniFilter(value?: string | null): boolean {
        value = _makeNull(value);

        if (this.miniFilterText === value) {
            //do nothing if filter has not changed
            return false;
        }

        if (value === null) {
            // Reset 'Add current selection to filter' checkbox when clearing mini filter
            this.setAddCurrentSelectionToFilter(false);
        }

        this.miniFilterText = value;
        this.updateDisplayedValues('miniFilter');

        return true;
    }

    public getMiniFilter(): string | null {
        return this.miniFilterText;
    }

    public updateDisplayedValues(
        source: 'reload' | 'otherFilter' | 'miniFilter' | 'expansion',
        allKeys?: (string | null)[]
    ): void {
        if (source === 'expansion') {
            this.displayValueModel.refresh();
            return;
        }

        // if no filter, just display all available values
        if (this.miniFilterText == null) {
            this.displayValueModel.updateDisplayedValuesToAllAvailable(
                (key: string | null) => this.getValue(key),
                allKeys,
                this.availableKeys,
                source
            );
            return;
        }

        // if filter present, we filter down the list
        // to allow for case insensitive searches, upper-case both filter text and value
        const formattedFilterText = this.caseFormat(this.formatter(this.miniFilterText) || '');

        const matchesFilter = (valueToCheck: string | null): boolean =>
            valueToCheck != null && this.caseFormat(valueToCheck).indexOf(formattedFilterText) >= 0;

        const nullMatchesFilter = !!this.filterParams.excelMode && matchesFilter(this.translate('blanks'));

        this.displayValueModel.updateDisplayedValuesToMatchMiniFilter(
            (key: string | null) => this.getValue(key),
            allKeys,
            this.availableKeys,
            matchesFilter,
            nullMatchesFilter,
            source
        );
    }

    public getDisplayedValueCount(): number {
        return this.displayValueModel.getDisplayedValueCount();
    }

    public getDisplayedItem(index: number): string | SetFilterModelTreeItem | null {
        return this.displayValueModel.getDisplayedItem(index);
    }

    public getSelectAllItem(): string | SetFilterModelTreeItem {
        return this.displayValueModel.getSelectAllItem();
    }

    public getAddSelectionToFilterItem(): string | SetFilterModelTreeItem {
        return this.displayValueModel.getAddSelectionToFilterItem();
    }

    public hasSelections(): boolean {
        return this.filterParams.defaultToNothingSelected
            ? this.selectedKeys.size > 0
            : this.allValues.allValues.size !== this.selectedKeys.size;
    }

    public getKeys(): SetFilterModelValue {
        return Array.from(this.allValues.allValues.keys());
    }

    public getValues(): (V | null)[] {
        return Array.from(this.allValues.allValues.values());
    }

    public getValue(key: string | null): V | null {
        return this.allValues.allValues.get(key)!;
    }

    public setAddCurrentSelectionToFilter(value: boolean) {
        this.addCurrentSelectionToFilter = value;
    }

    private isInWindowsExcelMode(): boolean {
        return this.filterParams.excelMode === 'windows';
    }

    public isAddCurrentSelectionToFilterChecked(): boolean {
        return this.isInWindowsExcelMode() && this.addCurrentSelectionToFilter;
    }

    public showAddCurrentSelectionToFilter(): boolean {
        // We only show the 'Add current selection to filter' option
        // when excel mode is enabled with 'windows' mode
        // and when the users types a value in the mini filter.
        return this.isInWindowsExcelMode() && _exists(this.miniFilterText) && this.miniFilterText.length > 0;
    }

    public selectAllMatchingMiniFilter(clearExistingSelection = false): void {
        if (this.miniFilterText == null) {
            // ensure everything is selected
            this.selectedKeys = new Set(this.allValues.allValues.keys());
        } else {
            // ensure everything that matches the mini filter is selected
            if (clearExistingSelection) {
                this.selectedKeys.clear();
            }

            this.displayValueModel.forEachDisplayedKey((key) => this.selectedKeys.add(key));
        }
    }

    public deselectAllMatchingMiniFilter(): void {
        if (this.miniFilterText == null) {
            // ensure everything is deselected
            this.selectedKeys.clear();
        } else {
            // ensure everything that matches the mini filter is deselected
            this.displayValueModel.forEachDisplayedKey((key) => this.selectedKeys.delete(key));
        }
    }

    public selectKey(key: string | null): void {
        this.selectedKeys.add(key);
    }

    public deselectKey(key: string | null): void {
        if (this.filterParams.excelMode && this.isEverythingVisibleSelected()) {
            // ensure we're starting from the correct "everything selected" state
            this.resetSelectionState(this.displayValueModel.getDisplayedKeys());
        }

        this.selectedKeys.delete(key);
    }

    public isKeySelected(key: string | null): boolean {
        return this.selectedKeys.has(key);
    }

    public isEverythingVisibleSelected(): boolean {
        return !this.displayValueModel.someDisplayedKey((it) => !this.isKeySelected(it));
    }

    public isNothingVisibleSelected(): boolean {
        return !this.displayValueModel.someDisplayedKey((it) => this.isKeySelected(it));
    }

    public getModel(): SetFilterModelValue | null {
        if (!this.hasSelections()) {
            return null;
        }

        // When excelMode = 'windows' and the user has ticked 'Add current selection to filter'
        // the filtering keys can be different from the selected keys, and they should be included
        // in the model.
        const filteringKeys = this.isAddCurrentSelectionToFilterChecked() ? this.filterParams.model?.values : undefined;

        if (filteringKeys?.length) {
            if (this.selectedKeys) {
                // When existing filtering keys are present along with selected keys,
                // we combine them and return the result.
                // We use a set structure to avoid duplicates
                const modelKeys = new Set<string | null>([...filteringKeys, ...this.selectedKeys]);
                return Array.from(modelKeys);
            }

            return Array.from(filteringKeys);
        }

        // No extra filtering keys are present - so just return the selected keys
        return Array.from(this.selectedKeys);
    }

    public setModel(model: SetFilterModelValue | null): AgPromise<void> {
        return this.allValues.allValuesPromise.then((keys) => {
            if (model == null) {
                this.resetSelectionState(keys ?? []);
            } else {
                // select all values from the model that exist in the filter
                this.selectedKeys.clear();

                const existingFormattedKeys: Map<string | null, string | null> = new Map();
                this.allValues.allValues.forEach((_value, key) => {
                    existingFormattedKeys.set(this.caseFormat(key), key);
                });

                model.forEach((unformattedKey) => {
                    const formattedKey = this.caseFormat(_makeNull(unformattedKey));
                    const existingUnformattedKey = existingFormattedKeys.get(formattedKey);
                    if (existingUnformattedKey !== undefined) {
                        this.selectKey(existingUnformattedKey);
                    }
                });
            }
        });
    }

    private resetSelectionState(keys: (string | null)[]): void {
        if (this.filterParams.defaultToNothingSelected) {
            this.selectedKeys.clear();
        } else {
            this.selectedKeys = new Set(keys);
        }
    }

    public hasGroups(): boolean {
        return this.displayValueModel.hasGroups();
    }
}
