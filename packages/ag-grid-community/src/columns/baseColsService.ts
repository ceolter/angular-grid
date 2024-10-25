import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { ColumnEvent, ColumnEventType } from '../events';
import type { IAggFuncService } from '../interfaces/iAggFuncService';
import type {
    ColumnExtractors,
    ColumnOrdering,
    ColumnProcessor,
    ColumnProcessors,
    IColsService,
} from '../interfaces/iColsService';
import type { WithoutGridCommon } from '../interfaces/iCommon';
import { _removeFromArray } from '../utils/array';
import { _exists } from '../utils/generic';
import type { ColumnChangedEventType } from './columnApi';
import { dispatchColumnChangedEvent } from './columnEventUtils';
import type { ColKey, ColumnModel, Maybe } from './columnModel';
import type { ColumnState, ColumnStateParams } from './columnStateService';
import type { VisibleColsService } from './visibleColsService';

export abstract class BaseColsService extends BeanStub implements IColsService {
    protected columnModel: ColumnModel;
    protected aggFuncService?: IAggFuncService;
    protected visibleColsService: VisibleColsService;
    protected dispatchColumnChangedEvent = dispatchColumnChangedEvent;

    abstract eventName: ColumnChangedEventType;
    abstract columnProcessors: ColumnProcessors;
    abstract columnExtractors: ColumnExtractors;
    columnOrdering: ColumnOrdering;

    public columns: AgColumn[] = [];

    public wireBeans(beans: BeanCollection): void {
        this.columnModel = beans.columnModel;
        this.aggFuncService = beans.aggFuncService;
        this.visibleColsService = beans.visibleColsService;
    }

    public sortColumns(compareFn?: (a: AgColumn, b: AgColumn) => number): void {
        this.columns.sort(compareFn);
    }

    public setColumns(colKeys: ColKey[] | undefined, source: ColumnEventType): void {
        this.setColList(colKeys, this.columns, this.eventName, true, true, this.columnProcessors!.set, source);
    }

    public addColumns(colKeys: ColKey[] | undefined, source: ColumnEventType): void {
        this.updateColList(colKeys, this.columns, true, true, this.columnProcessors!.add, this.eventName, source);
    }

    public removeColumns(colKeys: ColKey[] | undefined, source: ColumnEventType): void {
        this.updateColList(colKeys, this.columns, false, true, this.columnProcessors!.remove, this.eventName, source);
    }

    protected setColList(
        colKeys: ColKey[] = [],
        masterList: AgColumn[],
        eventName: IColsService['eventName'],
        detectOrderChange: boolean,
        autoGroupsNeedBuilding: boolean,
        columnCallback: ColumnProcessor,
        source: ColumnEventType
    ): void {
        const gridColumns = this.columnModel.getCols();
        if (!gridColumns || gridColumns.length === 0) {
            return;
        }

        const changes: Map<AgColumn, number> = new Map();
        // store all original cols and their index.
        masterList.forEach((col, idx) => changes.set(col, idx));

        masterList.length = 0;

        if (_exists(colKeys)) {
            colKeys.forEach((key) => {
                const column = this.columnModel.getColDefCol(key);
                if (column) {
                    masterList.push(column);
                }
            });
        }

        masterList.forEach((col, idx) => {
            const oldIndex = changes.get(col);
            // if the column was not in the list, we add it as it's a change
            // idx is irrelevant now.
            if (oldIndex === undefined) {
                changes.set(col, 0);
                return;
            }

            if (detectOrderChange && oldIndex !== idx) {
                // if we're detecting order changes, and the indexes differ, we retain this as it's changed
                return;
            }

            // otherwise remove this col, as it's unchanged.
            changes.delete(col);
        });

        const primaryCols = this.columnModel.getColDefCols();
        (primaryCols || []).forEach((column) => {
            const added = masterList.indexOf(column) >= 0;
            columnCallback(column, added, source);
        });

        autoGroupsNeedBuilding && this.columnModel.refreshCols(false);

        this.visibleColsService.refresh(source);

        this.dispatchColumnChangedEvent(this.eventService, eventName, [...changes.keys()], source);
    }

    protected updateColList(
        keys: Maybe<ColKey>[] = [],
        masterList: AgColumn[],
        actionIsAdd: boolean,
        autoGroupsNeedBuilding: boolean,
        columnCallback: ColumnProcessor,
        eventType: IColsService['eventName'],
        source: ColumnEventType
    ) {
        if (!keys || keys.length === 0) {
            return;
        }

        let atLeastOne = false;
        const updatedCols: Set<AgColumn> = new Set();

        keys.forEach((key) => {
            if (!key) {
                return;
            }
            const columnToAdd = this.columnModel.getColDefCol(key);
            if (!columnToAdd) {
                return;
            }
            updatedCols.add(columnToAdd);

            if (actionIsAdd) {
                if (masterList.indexOf(columnToAdd) >= 0) {
                    return;
                }
                masterList.push(columnToAdd);
            } else {
                const currentIndex = masterList.indexOf(columnToAdd);
                if (currentIndex < 0) {
                    return;
                }
                for (let i = currentIndex + 1; i < masterList.length; i++) {
                    // row indexes of subsequent columns have changed
                    updatedCols.add(masterList[i]);
                }
                _removeFromArray(masterList, columnToAdd);
            }

            columnCallback(columnToAdd, actionIsAdd, source);
            atLeastOne = true;
        });

        if (!atLeastOne) {
            return;
        }

        if (autoGroupsNeedBuilding) {
            this.columnModel.refreshCols(false);
        }

        this.visibleColsService.refresh(source);

        const eventColumns = Array.from(updatedCols);
        this.eventService.dispatchEvent({
            type: eventType,
            columns: eventColumns,
            column: eventColumns.length === 1 ? eventColumns[0] : null,
            source,
        } as WithoutGridCommon<ColumnEvent>);
    }

    public extractCols(source: ColumnEventType, oldProvidedCols: AgColumn[] = []): AgColumn[] {
        const previousCols = this.columns;
        const colsWithIndex: AgColumn[] = [];
        const colsWithValue: AgColumn[] = [];

        const { setFlagFunc, getIndexFunc, getInitialIndexFunc, getValueFunc, getInitialValueFunc } =
            this.columnExtractors!;

        const primaryCols = this.columnModel.getColDefCols() || [];

        // go though all cols.
        // if value, change
        // if default only, change only if new
        primaryCols.forEach((col) => {
            const colIsNew = oldProvidedCols.indexOf(col) < 0;
            const colDef = col.getColDef();

            const value = getValueFunc(colDef);
            const initialValue = getInitialValueFunc(colDef);
            const index = getIndexFunc(colDef);
            const initialIndex = getInitialIndexFunc(colDef);

            let include: boolean;

            const valuePresent = value !== undefined;
            const indexPresent = index !== undefined;
            const initialValuePresent = initialValue !== undefined;
            const initialIndexPresent = initialIndex !== undefined;

            if (valuePresent) {
                include = value!; // boolean value is guaranteed as attrToBoolean() is used above
            } else if (indexPresent) {
                if (index === null) {
                    // if col is new we don't want to use the default / initial if index is set to null. Similarly,
                    // we don't want to include the property for existing columns, i.e. we want to 'clear' it.
                    include = false;
                } else {
                    // note that 'null >= 0' evaluates to true which means 'rowGroupIndex = null' would enable row
                    // grouping if the null check didn't exist above.
                    include = index! >= 0;
                }
            } else {
                if (colIsNew) {
                    // as no value or index is 'present' we use the default / initial when col is new
                    if (initialValuePresent) {
                        include = initialValue!;
                    } else if (initialIndexPresent) {
                        include = initialIndex != null && initialIndex >= 0;
                    } else {
                        include = false;
                    }
                } else {
                    // otherwise include it if included last time, e.g. if we are extracting row group cols and this col
                    // is an existing row group col (i.e. it exists in 'previousCols') then we should include it.
                    include = previousCols.indexOf(col) >= 0;
                }
            }

            if (include) {
                const useIndex = colIsNew ? index != null || initialIndex != null : index != null;
                useIndex ? colsWithIndex.push(col) : colsWithValue.push(col);
            }
        });

        const getIndexForCol = (col: AgColumn): number => {
            const index = getIndexFunc(col.getColDef());
            const defaultIndex = getInitialIndexFunc(col.getColDef());

            return index != null ? index : defaultIndex!;
        };

        // sort cols with index, and add these first
        colsWithIndex.sort((colA, colB) => {
            const indexA = getIndexForCol(colA);
            const indexB = getIndexForCol(colB);

            if (indexA === indexB) {
                return 0;
            }
            if (indexA < indexB) {
                return -1;
            }

            return 1;
        });

        const res: AgColumn[] = ([] as AgColumn[]).concat(colsWithIndex);

        // second add columns that were there before and in the same order as they were before,
        // so we are preserving order of current grouping of columns that simply have rowGroup=true
        previousCols.forEach((col) => {
            if (colsWithValue.indexOf(col) >= 0) {
                res.push(col);
            }
        });

        // lastly put in all remaining cols
        colsWithValue.forEach((col) => {
            if (res.indexOf(col) < 0) {
                res.push(col);
            }
        });

        // set flag=false for removed cols
        previousCols.forEach((col) => {
            if (res.indexOf(col) < 0) {
                setFlagFunc(col, false, source);
            }
        });
        // set flag=true for newly added cols
        res.forEach((col) => {
            if (previousCols.indexOf(col) < 0) {
                setFlagFunc(col, true, source);
            }
        });

        return (this.columns = res);
    }

    public abstract syncColumnWithState(
        column: AgColumn,
        source: ColumnEventType,
        getValue: <U extends keyof ColumnStateParams, S extends keyof ColumnStateParams>(
            key1: U,
            key2?: S
        ) => { value1: ColumnStateParams[U] | undefined; value2: ColumnStateParams[S] | undefined },
        rowIndex: { [key: string]: number } | null
    ): void;

    public orderColumns(
        columnStateAccumulator: { [colId: string]: ColumnState },
        incomingColumnState: { [colId: string]: ColumnState }
    ): { [colId: string]: ColumnState } {
        const colList = this.columns;

        const primaryCols = this.columnModel.getColDefCols();
        if (!colList.length || !primaryCols) {
            return columnStateAccumulator;
        }
        const updatedColIdArray = Object.keys(incomingColumnState);
        const updatedColIds = new Set(updatedColIdArray);
        const newColIds = new Set(updatedColIdArray);
        const allColIds = new Set(
            colList
                .map((column) => {
                    const colId = column.getColId();
                    newColIds.delete(colId);
                    return colId;
                })
                .concat(updatedColIdArray)
        );

        const colIdsInOriginalOrder: string[] = [];
        const originalOrderMap: { [colId: string]: number } = {};
        let orderIndex = 0;
        for (let i = 0; i < primaryCols.length; i++) {
            const colId = primaryCols[i].getColId();
            if (allColIds.has(colId)) {
                colIdsInOriginalOrder.push(colId);
                originalOrderMap[colId] = orderIndex++;
            }
        }

        // follow approach in `resetColumnState`
        let index = 1000;
        let hasAddedNewCols = false;
        let lastIndex = 0;

        const enableProp = this.columnOrdering!.enableProp;
        const initialEnableProp = this.columnOrdering!.initialEnableProp;
        const indexProp = this.columnOrdering!.indexProp;
        const initialIndexProp = this.columnOrdering!.initialIndexProp;

        const processPrecedingNewCols = (colId: string) => {
            const originalOrderIndex = originalOrderMap[colId];
            for (let i = lastIndex; i < originalOrderIndex; i++) {
                const newColId = colIdsInOriginalOrder[i];
                if (newColIds.has(newColId)) {
                    incomingColumnState[newColId][indexProp] = index++;
                    newColIds.delete(newColId);
                }
            }
            lastIndex = originalOrderIndex;
        };

        colList.forEach((column) => {
            const colId = column.getColId();
            if (updatedColIds.has(colId)) {
                // New col already exists. Add any other new cols that should be before it.
                processPrecedingNewCols(colId);
                incomingColumnState[colId][indexProp] = index++;
            } else {
                const colDef = column.getColDef();
                const missingIndex =
                    colDef[indexProp] === null || (colDef[indexProp] === undefined && colDef[initialIndexProp] == null);
                if (missingIndex) {
                    if (!hasAddedNewCols) {
                        const propEnabled =
                            colDef[enableProp] || (colDef[enableProp] === undefined && colDef[initialEnableProp]);
                        if (propEnabled) {
                            processPrecedingNewCols(colId);
                        } else {
                            // Reached the first manually added column. Add all the new columns now.
                            newColIds.forEach((newColId) => {
                                // Rather than increment the index, just use the original order index - doesn't need to be contiguous.
                                incomingColumnState[newColId][indexProp] = index + originalOrderMap[newColId];
                            });
                            index += colIdsInOriginalOrder.length;
                            hasAddedNewCols = true;
                        }
                    }
                    if (!columnStateAccumulator[colId]) {
                        columnStateAccumulator[colId] = { colId };
                    }
                    columnStateAccumulator[colId][indexProp] = index++;
                }
            }
        });

        return columnStateAccumulator;
    }
}
