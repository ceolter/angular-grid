import { placeLockedColumns } from '../columnMove/columnMoveUtils';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { AgColumn } from '../entities/agColumn';
import type { AgProvidedColumnGroup } from '../entities/agProvidedColumnGroup';
import type { ColDef, ColGroupDef } from '../entities/colDef';
import type { ColumnEventType } from '../events';
import { _shouldMaintainColumnOrder } from '../gridOptionsUtils';
import type { Column } from '../interfaces/iColumn';
import type { IPivotResultColsService } from '../interfaces/iPivotResultColsService';
import { _areEqual } from '../utils/array';
import { _createColumnTree } from './columnFactoryUtils';
import { _applyColumnState, _compareColumnStatesAndDispatchEvents } from './columnStateUtils';
import type { ColumnState } from './columnStateUtils';
import {
    _columnsMatch,
    _convertColumnEventSourceType,
    _destroyColumnTree,
    _getColumnsFromTree,
    isColumnGroupAutoCol,
} from './columnUtils';

export type ColKey<TData = any, TValue = any> = string | ColDef<TData, TValue> | Column<TValue>;
export type Maybe<T> = T | null | undefined;

export interface ColumnCollections {
    // columns in a tree, leaf levels are columns, everything above is group column
    tree: (AgColumn | AgProvidedColumnGroup)[];
    treeDepth: number; // depth of the tree above
    // leaf level cols of the tree
    list: AgColumn[];
    // cols by id, for quick lookup
    map: { [id: string]: AgColumn };
}

export class ColumnModel extends BeanStub implements NamedBean {
    beanName = 'colModel' as const;

    // as provided by gridProp columnsDefs
    private colDefs?: (ColDef | ColGroupDef)[];

    // columns generated from columnDefs
    // this doesn't change (including order) unless columnDefs prop changses.
    public colDefCols?: ColumnCollections;

    // [providedCols OR pivotResultCols] PLUS autoGroupCols PLUS selectionCols
    // this cols.list maintains column order.
    public cols?: ColumnCollections;

    // if pivotMode is on, however pivot results are NOT shown if no pivot columns are set
    private pivotMode = false;

    // true when pivotResultCols are in cols
    private showingPivotResult: boolean;

    private lastOrder: AgColumn[] | null;
    private lastPivotOrder: AgColumn[] | null;

    // true if we are doing column spanning
    public colSpanActive: boolean;

    public ready = false;
    public changeEventsDispatching = false;

    public postConstruct(): void {
        this.pivotMode = this.gos.get('pivotMode');

        this.addManagedPropertyListeners(
            ['groupDisplayType', 'treeData', 'treeDataDisplayType', 'groupHideOpenParents'],
            (event) => this.refreshAll(_convertColumnEventSourceType(event.source))
        );
        this.addManagedPropertyListeners(
            ['defaultColDef', 'defaultColGroupDef', 'columnTypes', 'suppressFieldDotNotation'],
            (event) => this.recreateColumnDefs(_convertColumnEventSourceType(event.source))
        );
        this.addManagedPropertyListener('pivotMode', (event) =>
            this.setPivotMode(this.gos.get('pivotMode'), _convertColumnEventSourceType(event.source))
        );
    }

    // called from SyncService, when grid has finished initialising
    private createColsFromColDefs(source: ColumnEventType): void {
        const { beans } = this;
        const {
            valueCache,
            colAutosize,
            rowGroupColsSvc,
            pivotColsSvc,
            valueColsSvc,
            visibleCols,
            colViewport,
            eventSvc,
        } = beans;
        // only need to dispatch before/after events if updating columns, never if setting columns for first time
        const dispatchEventsFunc = this.colDefs ? _compareColumnStatesAndDispatchEvents(beans, source) : undefined;

        // always invalidate cache on changing columns, as the column id's for the new columns
        // could overlap with the old id's, so the cache would return old values for new columns.
        valueCache?.expire();

        const oldCols = this.colDefCols?.list;
        const oldTree = this.colDefCols?.tree;
        const newTree = _createColumnTree(beans, this.colDefs, true, oldTree, source);

        _destroyColumnTree(beans, this.colDefCols?.tree, newTree.columnTree);

        const tree = newTree.columnTree;
        const treeDepth = newTree.treeDept;
        const list = _getColumnsFromTree(tree);
        const map: { [id: string]: AgColumn } = {};

        list.forEach((col) => (map[col.getId()] = col));

        this.colDefCols = { tree, treeDepth, list, map };

        rowGroupColsSvc?.extractCols(source, oldCols);
        pivotColsSvc?.extractCols(source, oldCols);
        valueColsSvc?.extractCols(source, oldCols);

        this.ready = true;

        this.refreshCols(true);

        visibleCols.refresh(source);
        colViewport.checkViewportColumns();

        // this event is not used by AG Grid, but left here for backwards compatibility,
        // in case applications use it
        eventSvc.dispatchEvent({
            type: 'columnEverythingChanged',
            source,
        });

        // Row Models react to all of these events as well as new columns loaded,
        // this flag instructs row model to ignore these events to reduce refreshes.
        if (dispatchEventsFunc) {
            this.changeEventsDispatching = true;
            dispatchEventsFunc();
            this.changeEventsDispatching = false;
        }

        eventSvc.dispatchEvent({
            type: 'newColumnsLoaded',
            source,
        });

        if (source === 'gridInitializing') {
            colAutosize?.applyAutosizeStrategy();
        }
    }

    // called from: buildAutoGroupColumns (events 'groupDisplayType', 'treeData', 'treeDataDisplayType', 'groupHideOpenParents')
    // createColsFromColDefs (recreateColumnDefs, setColumnsDefs),
    // setPivotMode, applyColumnState,
    // functionColsService.setPrimaryColList, functionColsService.updatePrimaryColList,
    // pivotResultCols.setPivotResultCols
    public refreshCols(newColDefs: boolean): void {
        if (!this.colDefCols) {
            return;
        }

        const prevColTree = this.cols?.tree;

        this.saveColOrder();

        const {
            autoColSvc,
            selectionColSvc,
            quickFilter,
            pivotResultCols,
            showRowGroupCols,
            rowAutoHeight,
            visibleCols,
            colViewport,
            eventSvc,
        } = this.beans;

        const cols = this.selectCols(pivotResultCols, this.colDefCols);

        autoColSvc?.createAutoCols(cols, (updateOrder) => {
            this.lastOrder = updateOrder(this.lastOrder);
            this.lastPivotOrder = updateOrder(this.lastPivotOrder);
        });
        autoColSvc?.addAutoCols(cols);

        selectionColSvc?.createSelectionCols(cols, (updateOrder) => {
            this.lastOrder = updateOrder(this.lastOrder) ?? null;
            this.lastPivotOrder = updateOrder(this.lastPivotOrder) ?? null;
        });
        selectionColSvc?.addSelectionCols(cols);

        const shouldSortNewColDefs = _shouldMaintainColumnOrder(this.gos, this.showingPivotResult);
        if (!newColDefs || shouldSortNewColDefs) {
            this.restoreColOrder(cols);
        }

        this.positionLockedCols(cols);
        showRowGroupCols?.refresh();
        quickFilter?.refreshCols();

        this.setColSpanActive();
        rowAutoHeight?.setAutoHeightActive(cols);

        // make sure any part of the gui that tries to draw, eg the header,
        // will get empty lists of columns rather than stale columns.
        // for example, the header will received gridColumnsChanged event, so will try and draw,
        // but it will draw successfully when it acts on the virtualColumnsChanged event
        visibleCols.clear();
        colViewport.clear();

        const dispatchChangedEvent = !_areEqual(prevColTree, this.cols!.tree);
        if (dispatchChangedEvent) {
            eventSvc.dispatchEvent({
                type: 'gridColumnsChanged',
            });
        }
    }

    private selectCols(
        pivotResultColsSvc: IPivotResultColsService | undefined,
        colDefCols: ColumnCollections
    ): ColumnCollections {
        const pivotResultCols = pivotResultColsSvc?.getPivotResultCols() ?? null;
        this.showingPivotResult = pivotResultCols != null;

        const { map, list, tree, treeDepth } = pivotResultCols ?? colDefCols;
        this.cols = {
            list: list.slice(),
            map: { ...map },
            tree: tree.slice(),
            treeDepth,
        };

        if (pivotResultCols) {
            // If the current columns are the same or a subset of the previous
            // we keep the previous order, otherwise we go back to the order the pivot
            // cols are generated in
            const hasSameColumns = pivotResultCols.list.some((col) => this.cols?.map[col.getColId()] !== undefined);
            if (!hasSameColumns) {
                this.lastPivotOrder = null;
            }
        }
        return this.cols;
    }

    public getColsToShow(): AgColumn[] {
        if (!this.cols) {
            return [];
        }
        // pivot mode is on, but we are not pivoting, so we only
        // show columns we are aggregating on

        const showAutoGroupAndValuesOnly = this.isPivotMode() && !this.showingPivotResult;
        const valueColumns = this.beans.valueColsSvc?.columns;

        const res = this.cols.list.filter((col) => {
            const isAutoGroupCol = isColumnGroupAutoCol(col);
            if (showAutoGroupAndValuesOnly) {
                const isValueCol = valueColumns?.includes(col);
                return isAutoGroupCol || isValueCol;
            } else {
                // keep col if a) it's auto-group or b) it's visible
                return isAutoGroupCol || col.isVisible();
            }
        });

        return res;
    }

    // on events 'groupDisplayType', 'treeData', 'treeDataDisplayType', 'groupHideOpenParents'
    public refreshAll(source: ColumnEventType) {
        if (!this.ready) {
            return;
        }
        this.refreshCols(false);
        this.beans.visibleCols.refresh(source);
    }

    public setColsVisible(keys: (string | AgColumn)[], visible = false, source: ColumnEventType): void {
        _applyColumnState(
            this.beans,
            {
                state: keys.map<ColumnState>((key) => ({
                    colId: typeof key === 'string' ? key : key.getColId(),
                    hide: !visible,
                })),
            },
            source
        );
    }

    private restoreColOrder(cols: ColumnCollections): void {
        const lastOrder = this.showingPivotResult ? this.lastPivotOrder : this.lastOrder;
        if (!lastOrder) {
            return;
        }

        const lastOrderMapped = new Map<AgColumn, number>(lastOrder.map((col, index) => [col, index]));

        // only do the sort if at least one column is accounted for. columns will be not accounted for
        // if changing from pivot result cols to provided columns
        const noColsFound = !cols.list.some((col) => lastOrderMapped.has(col));
        if (noColsFound) {
            return;
        }

        // order cols in the same order as before. we need to make sure that all
        // cols still exists, so filter out any that no longer exist.
        const colsMap = new Map<AgColumn, boolean>(cols.list.map((col) => [col, true]));
        const lastOrderFiltered = lastOrder.filter((col) => colsMap.has(col));
        const lastOrderFilteredMap = new Map<AgColumn, boolean>(lastOrderFiltered.map((col) => [col, true]));
        const missingFromLastOrder = cols.list.filter((col) => !lastOrderFilteredMap.has(col));

        // add in the new columns, at the end (if no group), or at the end of the group (if a group)
        const res = lastOrderFiltered.slice();

        missingFromLastOrder.forEach((newCol) => {
            let parent = newCol.getOriginalParent();

            // if no parent, means we are not grouping, so add the column to the end
            if (!parent) {
                res.push(newCol);
                return;
            }

            // find the group the column belongs to. if no siblings at the current level (eg col in group on it's
            // own) then go up one level and look for siblings there.
            const siblings: AgColumn[] = [];
            while (!siblings.length && parent) {
                const leafCols = parent.getLeafColumns();
                leafCols.forEach((leafCol) => {
                    const presentInNewCols = res.indexOf(leafCol) >= 0;
                    const notYetInSiblings = siblings.indexOf(leafCol) < 0;
                    if (presentInNewCols && notYetInSiblings) {
                        siblings.push(leafCol);
                    }
                });
                parent = parent.getOriginalParent();
            }

            // if no siblings exist at any level, this means the col is in a group (or parent groups) on it's own
            if (!siblings.length) {
                res.push(newCol);
                return;
            }

            // find index of last column in the group
            const indexes = siblings.map((col) => res.indexOf(col));
            const lastIndex = Math.max(...indexes);

            res.splice(lastIndex + 1, 0, newCol);
        });

        cols.list = res;
    }

    private positionLockedCols(cols: ColumnCollections): void {
        cols.list = placeLockedColumns(cols.list, this.gos);
    }

    private saveColOrder(): void {
        if (this.showingPivotResult) {
            this.lastPivotOrder = this.cols?.list ?? null;
        } else {
            this.lastOrder = this.cols?.list ?? null;
        }
    }

    public getColumnDefs(): (ColDef | ColGroupDef)[] | undefined {
        return this.colDefCols
            ? this.beans.colDefFactory?.getColumnDefs(
                  this.colDefCols.list,
                  this.showingPivotResult,
                  this.lastOrder,
                  this.cols?.list ?? []
              )
            : undefined;
    }

    private setColSpanActive(): void {
        this.colSpanActive = !!this.cols?.list.some((col) => col.getColDef().colSpan != null);
    }

    public isPivotMode(): boolean {
        return this.pivotMode;
    }

    private setPivotMode(pivotMode: boolean, source: ColumnEventType): void {
        if (pivotMode === this.pivotMode) {
            return;
        }

        this.pivotMode = pivotMode;

        if (!this.ready) {
            return;
        }

        // we need to update grid columns to cover the scenario where user has groupDisplayType = 'custom', as
        // this means we don't use auto group column UNLESS we are in pivot mode (it's mandatory in pivot mode),
        // so need to updateCols() to check it autoGroupCol needs to be added / removed
        this.refreshCols(false);
        const { visibleCols, eventSvc } = this.beans;
        visibleCols.refresh(source);

        eventSvc.dispatchEvent({
            type: 'columnPivotModeChanged',
        });
    }

    // + clientSideRowModel
    public isPivotActive(): boolean {
        const pivotColumns = this.beans.pivotColsSvc?.columns;
        return this.pivotMode && !!pivotColumns?.length;
    }

    // called when dataTypes change
    public recreateColumnDefs(source: ColumnEventType): void {
        if (!this.cols) {
            return;
        }

        // if we aren't going to force, update the auto cols in place
        this.beans.autoColSvc?.updateAutoCols(source);
        this.createColsFromColDefs(source);
    }

    public setColumnDefs(columnDefs: (ColDef | ColGroupDef)[], source: ColumnEventType) {
        this.colDefs = columnDefs;
        this.createColsFromColDefs(source);
    }

    public override destroy(): void {
        _destroyColumnTree(this.beans, this.colDefCols?.tree);
        super.destroy();
    }

    public getColTree(): (AgColumn | AgProvidedColumnGroup)[] {
        return this.cols?.tree ?? [];
    }

    // + columnSelectPanel
    public getColDefColTree(): (AgColumn | AgProvidedColumnGroup)[] {
        return this.colDefCols?.tree ?? [];
    }

    // + clientSideRowController -> sorting, building quick filter text
    // + headerRenderer -> sorting (clearing icon)
    public getColDefCols(): AgColumn[] | null {
        return this.colDefCols?.list ?? null;
    }

    // + moveColumnController
    public getCols(): AgColumn[] {
        return this.cols?.list ?? [];
    }

    // returns colDefCols, pivotResultCols and autoCols
    public getAllCols(): AgColumn[] {
        const { pivotResultCols, autoColSvc, selectionColSvc } = this.beans;
        const pivotResultColsList = pivotResultCols?.getPivotResultCols()?.list;
        return [
            this.colDefCols?.list ?? [],
            autoColSvc?.autoCols?.list ?? [],
            selectionColSvc?.selectionCols?.list ?? [],
            pivotResultColsList ?? [],
        ].flat();
    }

    public getColsForKeys(keys: ColKey[]): AgColumn[] {
        if (!keys) {
            return [];
        }
        return keys.map((key) => this.getCol(key)).filter((col): col is AgColumn => col != null);
    }

    public getColDefCol(key: ColKey): AgColumn | null {
        if (!this.colDefCols?.list) {
            return null;
        }
        return this.getColFromCollection(key, this.colDefCols);
    }

    public getCol(key: Maybe<ColKey>): AgColumn | null {
        if (key == null) {
            return null;
        }
        return this.getColFromCollection(key, this.cols);
    }

    public getColFromCollection(key: ColKey, cols?: ColumnCollections): AgColumn | null {
        if (cols == null) {
            return null;
        }

        const { map, list } = cols;

        // most of the time this method gets called the key is a string, so we put this shortcut in
        // for performance reasons, to see if we can match for ID (it doesn't do auto columns, that's done below)
        if (typeof key == 'string' && map[key]) {
            return map[key];
        }

        for (let i = 0; i < list.length; i++) {
            if (_columnsMatch(list[i], key)) {
                return list[i];
            }
        }

        return this.beans.autoColSvc?.getAutoCol(key) ?? this.beans.selectionColSvc?.getSelectionCol(key) ?? null;
    }
}
