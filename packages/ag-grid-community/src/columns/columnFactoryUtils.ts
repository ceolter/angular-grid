import type { BeanCollection } from '../context/context';
import { AgColumn } from '../entities/agColumn';
import type { AgProvidedColumnGroup } from '../entities/agProvidedColumnGroup';
import { isProvidedColumnGroup } from '../entities/agProvidedColumnGroup';
import type { ColDef, ColGroupDef, SortDirection } from '../entities/colDef';
import { DefaultColumnTypes } from '../entities/defaultColumnTypes';
import type { ColumnEventType } from '../events';
import { _isColumnsSortingCoupledToGroup } from '../gridOptionsUtils';
import { _mergeDeep } from '../utils/object';
import { _warn } from '../validation/logging';
import { ColumnKeyCreator } from './columnKeyCreator';
import { convertColumnTypes } from './columnUtils';

export function _createColumnTree(
    beans: BeanCollection,
    defs: (ColDef | ColGroupDef)[] | null | undefined = null,
    primaryColumns: boolean,
    existingTree: (AgColumn | AgProvidedColumnGroup)[] | undefined,
    source: ColumnEventType
): { columnTree: (AgColumn | AgProvidedColumnGroup)[]; treeDept: number } {
    // column key creator dishes out unique column id's in a deterministic way,
    // so if we have two grids (that could be master/slave) with same column definitions,
    // then this ensures the two grids use identical id's.
    const columnKeyCreator = new ColumnKeyCreator();

    const { existingCols, existingGroups, existingColKeys } = extractExistingTreeData(existingTree);
    columnKeyCreator.addExistingKeys(existingColKeys);

    // create am unbalanced tree that maps the provided definitions
    const unbalancedTree = _recursivelyCreateColumns(
        beans,
        defs,
        0,
        primaryColumns,
        existingCols,
        columnKeyCreator,
        existingGroups,
        source
    );
    const { colGroupSvc } = beans;
    const treeDept = colGroupSvc?.findMaxDepth(unbalancedTree, 0) ?? 0;
    const columnTree = colGroupSvc
        ? colGroupSvc.balanceColumnTree(unbalancedTree, 0, treeDept, columnKeyCreator)
        : unbalancedTree;

    const deptFirstCallback = (child: AgColumn | AgProvidedColumnGroup, parent: AgProvidedColumnGroup) => {
        if (isProvidedColumnGroup(child)) {
            child.setupExpandable();
        }
        // we set the original parents at the end, rather than when we go along, as balancing the tree
        // adds extra levels into the tree. so we can only set parents when balancing is done.
        child.originalParent = parent;
    };

    depthFirstOriginalTreeSearch(null, columnTree, deptFirstCallback);

    return {
        columnTree,
        treeDept,
    };
}

function extractExistingTreeData(existingTree?: (AgColumn | AgProvidedColumnGroup)[]): {
    existingCols: AgColumn[];
    existingGroups: AgProvidedColumnGroup[];
    existingColKeys: string[];
} {
    const existingCols: AgColumn[] = [];
    const existingGroups: AgProvidedColumnGroup[] = [];
    const existingColKeys: string[] = [];

    if (existingTree) {
        depthFirstOriginalTreeSearch(null, existingTree, (item: AgColumn | AgProvidedColumnGroup) => {
            if (isProvidedColumnGroup(item)) {
                const group = item;
                existingGroups.push(group);
            } else {
                const col = item;
                existingColKeys.push(col.getId());
                existingCols.push(col);
            }
        });
    }

    return { existingCols, existingGroups, existingColKeys };
}

export function _recursivelyCreateColumns(
    beans: BeanCollection,
    defs: (ColDef | ColGroupDef)[] | null,
    level: number,
    primaryColumns: boolean,
    existingColsCopy: AgColumn[],
    columnKeyCreator: ColumnKeyCreator,
    existingGroups: AgProvidedColumnGroup[],
    source: ColumnEventType
): (AgColumn | AgProvidedColumnGroup)[] {
    if (!defs) return [];

    const { colGroupSvc } = beans;
    const result = new Array(defs.length);
    for (let i = 0; i < result.length; i++) {
        const def = defs[i];
        if (colGroupSvc && isColumnGroup(def)) {
            result[i] = colGroupSvc.createProvidedColumnGroup(
                primaryColumns,
                def as ColGroupDef,
                level,
                existingColsCopy,
                columnKeyCreator,
                existingGroups,
                source
            );
        } else {
            result[i] = createColumn(beans, primaryColumns, def as ColDef, existingColsCopy, columnKeyCreator, source);
        }
    }
    return result;
}

function createColumn(
    beans: BeanCollection,
    primaryColumns: boolean,
    colDef: ColDef,
    existingColsCopy: AgColumn[] | null,
    columnKeyCreator: ColumnKeyCreator,
    source: ColumnEventType
): AgColumn {
    // see if column already exists
    const existingColAndIndex = findExistingColumn(colDef, existingColsCopy);

    // make sure we remove, so if user provided duplicate id, then we don't have more than
    // one column instance for colDef with common id
    if (existingColAndIndex) {
        existingColsCopy?.splice(existingColAndIndex.idx, 1);
    }

    let column = existingColAndIndex?.column;
    if (!column) {
        // no existing column, need to create one
        const colId = columnKeyCreator.getUniqueKey(colDef.colId, colDef.field);
        const colDefMerged = _addColumnDefaultAndTypes(beans, colDef, colId);
        column = new AgColumn(colDefMerged, colDef, colId, primaryColumns);
        beans.context.createBean(column);
    } else {
        const colDefMerged = _addColumnDefaultAndTypes(beans, colDef, column.getColId());
        column.setColDef(colDefMerged, colDef, source);
        _updateColumnState(beans, column, colDefMerged, source);
    }

    beans.dataTypeSvc?.addColumnListeners(column);

    return column;
}

/** Updates hide, sort, sortIndex, pinned and flex */

export function updateSomeColumnState(
    beans: BeanCollection,
    column: AgColumn,
    hide: boolean | null | undefined,
    sort: SortDirection | undefined,
    sortIndex: number | null | undefined,
    pinned: boolean | 'left' | 'right' | null | undefined,
    flex: number | null | undefined,
    source: ColumnEventType
): void {
    const { sortSvc, pinnedCols, colFlex } = beans;

    // hide - anything but undefined, thus null will clear the hide
    if (hide !== undefined) {
        column.setVisible(!hide, source);
    }

    if (sortSvc) {
        // sort - anything but undefined will set sort, thus null or empty string will clear the sort
        sortSvc.updateColSort(column, sort, source);

        // sorted at - anything but undefined, thus null will clear the sortIndex
        if (sortIndex !== undefined) {
            sortSvc.setColSortIndex(column, sortIndex);
        }
    }

    // pinned - anything but undefined, thus null or empty string will remove pinned
    if (pinned !== undefined) {
        pinnedCols?.setColPinned(column, pinned);
    }

    // flex
    if (flex !== undefined) {
        colFlex?.setColFlex(column, flex);
    }
}

export function _updateColumnState(
    beans: BeanCollection,
    column: AgColumn,
    colDef: ColDef,
    source: ColumnEventType
): void {
    updateSomeColumnState(
        beans,
        column,
        colDef.hide,
        colDef.sort,
        colDef.sortIndex,
        colDef.pinned,
        colDef.flex,
        source
    );

    const colFlex = column.getFlex();

    // width - we only set width if column is not flexing
    if (colFlex != null && colFlex > 0) {
        return;
    }

    // both null and undefined means we skip, as it's not possible to 'clear' width (a column must have a width)
    if (colDef.width != null) {
        column.setActualWidth(colDef.width, source);
    } else {
        // otherwise set the width again, in case min or max width has changed,
        // and width needs to be adjusted.
        const widthBeforeUpdate = column.getActualWidth();
        column.setActualWidth(widthBeforeUpdate, source);
    }
}

function findExistingColumn(
    newColDef: ColDef,
    existingColsCopy: AgColumn[] | null
): { idx: number; column: AgColumn } | undefined {
    if (!existingColsCopy) return undefined;

    for (let i = 0; i < existingColsCopy.length; i++) {
        const def = existingColsCopy[i].getUserProvidedColDef();
        if (!def) continue;

        const newHasId = newColDef.colId != null;
        if (newHasId) {
            if (existingColsCopy[i].getId() === newColDef.colId) {
                return { idx: i, column: existingColsCopy[i] };
            }
            continue;
        }

        const newHasField = newColDef.field != null;
        if (newHasField) {
            if (def.field === newColDef.field) {
                return { idx: i, column: existingColsCopy[i] };
            }
            continue;
        }

        if (def === newColDef) {
            return { idx: i, column: existingColsCopy[i] };
        }
    }
    return undefined;
}

export function _addColumnDefaultAndTypes(beans: BeanCollection, colDef: ColDef, colId: string): ColDef {
    const { gos, dataTypeSvc, validation } = beans;
    // start with empty merged definition
    const res: ColDef = {} as ColDef;

    // merge properties from default column definitions
    const defaultColDef = gos.get('defaultColDef');
    _mergeDeep(res, defaultColDef, false, true);

    const columnType = updateColDefAndGetColumnType(beans, res, colDef, colId);

    if (columnType) {
        assignColumnTypes(beans, columnType, res);
    }

    // merge properties from column definitions
    _mergeDeep(res, colDef, false, true);

    const autoGroupColDef = gos.get('autoGroupColumnDef');
    const isSortingCoupled = _isColumnsSortingCoupledToGroup(gos);
    if (colDef.rowGroup && autoGroupColDef && isSortingCoupled) {
        // override the sort for row group columns where the autoGroupColDef defines these values.
        _mergeDeep(
            res,
            { sort: autoGroupColDef.sort, initialSort: autoGroupColDef.initialSort } as ColDef,
            false,
            true
        );
    }

    dataTypeSvc?.validateColDef(res);
    validation?.validateColDef(res, colId);

    return res;
}

function updateColDefAndGetColumnType(
    beans: BeanCollection,
    colDef: ColDef,
    userColDef: ColDef,
    colId: string
): string[] | undefined {
    const dataTypeDefinitionColumnType = beans.dataTypeSvc?.updateColDefAndGetColumnType(colDef, userColDef, colId);
    const columnTypes = userColDef.type ?? dataTypeDefinitionColumnType ?? colDef.type;
    colDef.type = columnTypes;
    return columnTypes ? convertColumnTypes(columnTypes) : undefined;
}

function assignColumnTypes(beans: BeanCollection, typeKeys: string[], colDefMerged: ColDef) {
    if (!typeKeys.length) {
        return;
    }

    // merge user defined with default column types
    const allColumnTypes = Object.assign({}, DefaultColumnTypes);
    const userTypes = beans.gos.get('columnTypes') || {};

    for (const [key, value] of Object.entries(userTypes)) {
        if (key in allColumnTypes) {
            // default column types cannot be overridden
            _warn(34, { key });
        } else {
            const colType = value as any;
            if (colType.type) {
                // type should not be defined in column types
                _warn(35);
            }

            allColumnTypes[key] = value;
        }
    }

    typeKeys.forEach((t) => {
        const typeColDef = allColumnTypes[t.trim()];
        if (typeColDef) {
            _mergeDeep(colDefMerged, typeColDef, false, true);
        } else {
            _warn(36, { t });
        }
    });
}

// if object has children, we assume it's a group
function isColumnGroup(abstractColDef: ColDef | ColGroupDef): boolean {
    return (abstractColDef as ColGroupDef).children !== undefined;
}

export function depthFirstOriginalTreeSearch(
    parent: AgProvidedColumnGroup | null,
    tree: (AgColumn | AgProvidedColumnGroup)[],
    callback: (treeNode: AgColumn | AgProvidedColumnGroup, parent: AgProvidedColumnGroup | null) => void
): void {
    if (!tree) {
        return;
    }

    for (let i = 0; i < tree.length; i++) {
        const child = tree[i];
        if (isProvidedColumnGroup(child)) {
            depthFirstOriginalTreeSearch(child, child.getChildren(), callback);
        }
        callback(child, parent);
    }
}
