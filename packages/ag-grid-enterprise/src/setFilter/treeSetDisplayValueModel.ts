import type { TextFormatter } from 'ag-grid-community';
import { _missing, _warn } from 'ag-grid-community';

import type { ISetDisplayValueModel, SetFilterModelTreeItem } from './iSetDisplayValueModel';
import { SET_FILTER_ADD_SELECTION_TO_FILTER, SET_FILTER_SELECT_ALL } from './iSetDisplayValueModel';

const DATE_TREE_LIST_PATH_GETTER = (date: Date | null) => {
    if (_missing(date)) {
        return null;
    }
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return ['NaN'];
    }
    return [String(date.getFullYear()), String(date.getMonth() + 1), String(date.getDate())];
};

export class TreeSetDisplayValueModel<V> implements ISetDisplayValueModel<V> {
    /** all displayed items in a tree structure */
    private allDisplayedItemsTree: SetFilterModelTreeItem[] = [];
    /** all displayed items flattened and filtered */
    private activeDisplayedItemsFlat: SetFilterModelTreeItem[] = [];

    private groupsExist: boolean;

    private readonly selectAllItem: SetFilterModelTreeItem = {
        depth: 0,
        filterPasses: true,
        available: true,
        treeKey: SET_FILTER_SELECT_ALL,
        children: this.allDisplayedItemsTree,
        expanded: true,
        key: SET_FILTER_SELECT_ALL,
        parentTreeKeys: [],
    };

    private readonly addSelectionToFilterItem: SetFilterModelTreeItem = {
        depth: 0,
        filterPasses: true,
        available: true,
        treeKey: SET_FILTER_ADD_SELECTION_TO_FILTER,
        expanded: true,
        key: SET_FILTER_ADD_SELECTION_TO_FILTER,
        parentTreeKeys: [],
    };

    constructor(
        private readonly formatter: TextFormatter,
        private readonly treeListPathGetter?: (value: V | null) => string[] | null,
        private treeListFormatter?: (
            pathKey: string | null,
            level: number,
            parentPathKeys: (string | null)[]
        ) => string,
        private readonly treeDataOrGrouping?: boolean
    ) {}

    public updateOnParamsChange(
        treeListFormatter?: (pathKey: string | null, level: number, parentPathKeys: (string | null)[]) => string
    ) {
        this.treeListFormatter = treeListFormatter;
    }

    public updateDisplayedValuesToAllAvailable(
        getValue: (key: string | null) => V | null,
        allKeys: Iterable<string | null> | undefined,
        availableKeys: Set<string | null>,
        source: 'reload' | 'otherFilter' | 'miniFilter'
    ): void {
        if (source === 'reload') {
            this.generateItemTree(getValue, allKeys!, availableKeys);
        } else if (source === 'otherFilter') {
            this.updateAvailable(availableKeys);
            this.updateExpandAll();
        } else if (source === 'miniFilter') {
            this.resetFilter();
            this.updateExpandAll();
        }

        this.flattenItems();
    }

    public updateDisplayedValuesToMatchMiniFilter(
        getValue: (key: string | null) => V | null,
        allKeys: Iterable<string | null> | undefined,
        availableKeys: Set<string | null>,
        matchesFilter: (valueToCheck: string | null) => boolean,
        nullMatchesFilter: boolean,
        source: 'reload' | 'otherFilter' | 'miniFilter'
    ): void {
        if (source === 'reload') {
            this.generateItemTree(getValue, allKeys!, availableKeys);
        } else if (source === 'otherFilter') {
            this.updateAvailable(availableKeys);
        }

        this.updateFilter(matchesFilter, nullMatchesFilter);
        this.updateExpandAll();

        this.flattenItems();
    }

    private generateItemTree(
        getValue: (key: string | null) => V | null,
        allKeys: Iterable<string | null>,
        availableKeys: Set<string | null>
    ): void {
        this.allDisplayedItemsTree = [];
        this.groupsExist = false;

        const treeListPathGetter = this.getTreeListPathGetter(getValue, availableKeys);
        for (const key of allKeys) {
            const value = getValue(key)!;
            const dataPath = treeListPathGetter(value) ?? [null];
            if (dataPath.length > 1) {
                this.groupsExist = true;
            }
            const available = availableKeys.has(key);
            let children: SetFilterModelTreeItem[] | undefined = this.allDisplayedItemsTree;
            let item: SetFilterModelTreeItem | undefined;
            let parentTreeKeys: (string | null)[] = [];
            dataPath.forEach((treeKey: string | null, depth: number) => {
                if (!children) {
                    children = [];
                    item!.children = children;
                }
                item = children.find((child) => child.treeKey?.toUpperCase() === treeKey?.toUpperCase());
                if (!item) {
                    item = { treeKey, depth, filterPasses: true, expanded: false, available, parentTreeKeys };
                    if (depth === dataPath.length - 1) {
                        item.key = key;
                    }
                    children.push(item);
                }
                children = item.children;
                parentTreeKeys = [...parentTreeKeys, treeKey];
            });
        }
        // update the parent availability based on the children
        this.updateAvailable(availableKeys);

        this.selectAllItem.children = this.allDisplayedItemsTree;
        this.selectAllItem.expanded = false;
    }

    private getTreeListPathGetter(
        getValue: (key: string | null) => V | null,
        availableKeys: Set<string | null>
    ): (value: V | null) => string[] | null {
        if (this.treeListPathGetter) {
            return this.treeListPathGetter;
        }
        if (this.treeDataOrGrouping) {
            return (value) => value as any;
        }
        // infer from data
        let isDate = false;
        for (const availableKey of availableKeys) {
            // find the first non-null value
            const value = getValue(availableKey);
            if (value instanceof Date) {
                isDate = true;
                break;
            } else if (value != null) {
                break;
            }
        }
        if (isDate) {
            return DATE_TREE_LIST_PATH_GETTER as any;
        }
        _warn(211);
        return (value) => [String(value)];
    }

    private flattenItems(): void {
        this.activeDisplayedItemsFlat = [];
        const recursivelyFlattenDisplayedItems = (items: SetFilterModelTreeItem[]) => {
            items.forEach((item) => {
                if (!item.filterPasses || !item.available) {
                    return;
                }
                this.activeDisplayedItemsFlat.push(item);
                if (item.children && item.expanded) {
                    recursivelyFlattenDisplayedItems(item.children);
                }
            });
        };
        recursivelyFlattenDisplayedItems(this.allDisplayedItemsTree);
    }

    private resetFilter(): void {
        const recursiveFilterReset = (item: SetFilterModelTreeItem) => {
            if (item.children) {
                item.children.forEach((child) => {
                    recursiveFilterReset(child);
                });
            }

            item.filterPasses = true;
        };

        this.allDisplayedItemsTree.forEach((item) => recursiveFilterReset(item));
    }

    private updateFilter(matchesFilter: (valueToCheck: string | null) => boolean, nullMatchesFilter: boolean): void {
        const passesFilter = (item: SetFilterModelTreeItem) => {
            if (!item.available) {
                return false;
            }
            if (item.treeKey == null) {
                return nullMatchesFilter;
            }

            return matchesFilter(
                this.formatter(
                    this.treeListFormatter
                        ? this.treeListFormatter(item.treeKey, item.depth, item.parentTreeKeys)
                        : item.treeKey
                )
            );
        };

        this.allDisplayedItemsTree.forEach((item) =>
            this.recursiveItemCheck(item, false, passesFilter, 'filterPasses')
        );
    }

    public getDisplayedValueCount(): number {
        return this.activeDisplayedItemsFlat.length;
    }

    public getDisplayedItem(index: number): SetFilterModelTreeItem | null {
        return this.activeDisplayedItemsFlat[index];
    }

    public getSelectAllItem(): SetFilterModelTreeItem {
        return this.selectAllItem;
    }

    public getAddSelectionToFilterItem(): string | SetFilterModelTreeItem {
        return this.addSelectionToFilterItem;
    }

    public getDisplayedKeys(): (string | null)[] {
        const displayedKeys: (string | null)[] = [];
        this.forEachDisplayedKey((key) => displayedKeys.push(key));
        return displayedKeys;
    }

    public forEachDisplayedKey(func: (key: string | null) => void): void {
        const recursiveForEachItem = (item: SetFilterModelTreeItem, topParentExpanded: boolean) => {
            if (item.children) {
                if (!item.expanded || !topParentExpanded) {
                    // if the parent is not expanded, we need to iterate the entire tree
                    item.children.forEach((child) => {
                        if (child.filterPasses) {
                            recursiveForEachItem(child, false);
                        }
                    });
                }
            } else {
                func(item.key!);
            }
        };

        this.activeDisplayedItemsFlat.forEach((item) => recursiveForEachItem(item, true));
    }

    public someDisplayedKey(func: (key: string | null) => boolean): boolean {
        const recursiveSomeItem = (item: SetFilterModelTreeItem, topParentExpanded: boolean): boolean => {
            if (item.children) {
                if (!item.expanded || !topParentExpanded) {
                    // if the parent is not expanded, we need to iterate the entire tree
                    return item.children.some((child) => {
                        if (child.filterPasses) {
                            return recursiveSomeItem(child, false);
                        }
                        return false;
                    });
                }
            } else {
                return func(item.key!);
            }
            return false;
        };

        return this.activeDisplayedItemsFlat.some((item) => recursiveSomeItem(item, true));
    }

    public hasGroups(): boolean {
        return this.groupsExist;
    }

    public refresh(): void {
        this.updateExpandAll();
        this.flattenItems();
    }

    private updateExpandAll(): void {
        const recursiveExpansionCheck = (
            items: SetFilterModelTreeItem[],
            someTrue: boolean,
            someFalse: boolean
        ): boolean | undefined => {
            for (const item of items) {
                if (!item.filterPasses || !item.available || !item.children) {
                    continue;
                }
                // indeterminate state only exists for expand all, so don't need to check for the current item
                someTrue = someTrue || !!item.expanded;
                someFalse = someFalse || !item.expanded;
                if (someTrue && someFalse) {
                    // already indeterminate. No need to check the children
                    return undefined;
                }
                const childExpanded = recursiveExpansionCheck(item.children, someTrue, someFalse);
                if (childExpanded === undefined) {
                    return undefined;
                } else if (childExpanded) {
                    someTrue = true;
                } else {
                    someFalse = true;
                }
            }
            return someTrue && someFalse ? undefined : someTrue;
        };

        const item = this.getSelectAllItem();
        item.expanded = recursiveExpansionCheck(item.children!, false, false);
    }

    private recursiveItemCheck(
        item: SetFilterModelTreeItem,
        parentPasses: boolean,
        checkFunction: (item: SetFilterModelTreeItem) => boolean,
        itemProp: 'filterPasses' | 'available'
    ): boolean {
        let atLeastOneChildPassed = false;
        if (item.children) {
            item.children.forEach((child) => {
                const childPasses = this.recursiveItemCheck(
                    child,
                    parentPasses || checkFunction(item),
                    checkFunction,
                    itemProp
                );
                atLeastOneChildPassed = atLeastOneChildPassed || childPasses;
            });
        }

        const itemPasses = parentPasses || atLeastOneChildPassed || checkFunction(item);
        item[itemProp] = itemPasses;
        return itemPasses;
    }

    private updateAvailable(availableKeys: Set<string | null>) {
        const isAvailable = (item: SetFilterModelTreeItem) => availableKeys.has(item.key!);

        this.allDisplayedItemsTree.forEach((item) => this.recursiveItemCheck(item, false, isAvailable, 'available'));
    }
}
