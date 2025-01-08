import type { AgColumn, IClientSideRowModel, RowNode } from 'ag-grid-community';
import { AgPromise, _makeNull } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

import { processDataPath } from './setFilterUtils';

/** @param V type of value in the Set Filter */
export class ClientSideValuesExtractor<V> extends BeanStub {
    constructor(
        private readonly createKey: (value: V | null | undefined, node?: RowNode) => string | null,
        private readonly caseFormat: <T extends string | null>(valueToFormat: T) => typeof valueToFormat,
        private readonly getValue: (node: RowNode) => V | null | undefined,
        private readonly isTreeDataOrGrouping: () => boolean,
        private readonly isTreeData: () => boolean
    ) {
        super();
    }

    public extractUniqueValuesAsync(
        predicate: (node: RowNode) => boolean,
        existingValues?: Map<string | null, V | null>
    ): AgPromise<Map<string | null, V | null>> {
        return new AgPromise((resolve) => {
            if ((this.beans.rowModel as IClientSideRowModel).isRowDataLoaded()) {
                resolve(this.extractUniqueValues(predicate, existingValues));
            } else {
                const [destroyFunc] = this.addManagedEventListeners({
                    rowCountReady: () => {
                        destroyFunc?.();
                        resolve(this.extractUniqueValues(predicate, existingValues));
                    },
                });
            }
        });
    }

    public extractUniqueValues(
        predicate: (node: RowNode) => boolean,
        existingValues?: Map<string | null, V | null>
    ): Map<string | null, V | null> {
        const values: Map<string | null, V | null> = new Map();
        const existingFormattedKeys = this.extractExistingFormattedKeys(existingValues);
        const formattedKeys: Set<string | null> = new Set();
        const treeData = this.isTreeData();
        const treeDataOrGrouping = this.isTreeDataOrGrouping();
        const groupedCols = this.beans.rowGroupColsSvc?.columns;
        const groupAllowUnbalanced = this.gos.get('groupAllowUnbalanced');

        const addValue = (unformattedKey: string | null, value: V | null | undefined) => {
            const formattedKey = this.caseFormat(unformattedKey);
            if (!formattedKeys.has(formattedKey)) {
                formattedKeys.add(formattedKey);
                let keyToAdd = unformattedKey;
                let valueToAdd = _makeNull(value);
                // when case insensitive, we pick the first value to use. if this is later filtered out,
                // we still want to use the original value and not one with a different case
                const existingUnformattedKey = existingFormattedKeys?.get(formattedKey);
                if (existingUnformattedKey != null) {
                    keyToAdd = existingUnformattedKey;
                    valueToAdd = existingValues!.get(existingUnformattedKey)!;
                }
                values.set(keyToAdd, valueToAdd);
            }
        };

        (this.beans.rowModel as IClientSideRowModel).forEachLeafNode((node) => {
            // only pull values from rows that have data. this means we skip filler group nodes.
            if (!node.data || !predicate(node)) {
                return;
            }
            if (treeDataOrGrouping) {
                this.addValueForTreeDataOrGrouping(node, treeData, groupedCols, addValue, groupAllowUnbalanced);
                return;
            }

            const value = this.getValue(node);

            if (value != null && Array.isArray(value)) {
                value.forEach((x) => {
                    addValue(this.createKey(x, node), x);
                });
                if (value.length === 0) {
                    addValue(null, null);
                }
            } else {
                addValue(this.createKey(value, node), value);
            }
        });

        return values;
    }

    private addValueForTreeDataOrGrouping(
        node: RowNode,
        treeData: boolean,
        groupedCols: AgColumn[] = [],
        addValue: (unformattedKey: string | null, value: V | null) => void,
        groupAllowUnbalanced: boolean
    ): void {
        let dataPath: string[] | null;
        if (treeData) {
            if (node.childrenAfterGroup?.length) {
                return;
            }
            dataPath = node.getRoute() ?? [node.key ?? node.id!];
        } else {
            dataPath = groupedCols.map((groupCol) => this.beans.valueSvc.getKeyForNode(groupCol, node));
            dataPath.push(this.getValue(node) as any);
        }
        const processedDataPath = processDataPath(dataPath, treeData, groupAllowUnbalanced);
        addValue(this.createKey(processedDataPath as any), processedDataPath as any);
    }

    private extractExistingFormattedKeys(
        existingValues?: Map<string | null, V | null>
    ): Map<string | null, string | null> | null {
        if (!existingValues) {
            return null;
        }
        const existingFormattedKeys: Map<string | null, string | null> = new Map();
        existingValues.forEach((_value, key) => {
            existingFormattedKeys.set(this.caseFormat(key), key);
        });
        return existingFormattedKeys;
    }
}
