import type { Context } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import { isColumn } from '../entities/agColumn';
import type { AgProvidedColumnGroup } from '../entities/agProvidedColumnGroup';
import { isProvidedColumnGroup } from '../entities/agProvidedColumnGroup';
import type { ColumnEventType } from '../events';
import type { PropertyChangedSource } from '../gridOptionsService';
import type { ColumnInstanceId } from '../interfaces/iColumn';
import { _areEqual } from '../utils/array';
import { depthFirstOriginalTreeSearch } from './columnFactory';
import type { ColKey, ColumnCollections } from './columnModel';
import { CONTROLS_COLUMN_ID_PREFIX } from './selectionColService';

export const GROUP_AUTO_COLUMN_ID = 'ag-Grid-AutoColumn' as const;

// Possible candidate for reuse (alot of recursive traversal duplication)
export function _getColumnsFromTree(rootColumns: (AgColumn | AgProvidedColumnGroup)[]): AgColumn[] {
    const result: AgColumn[] = [];

    const recursiveFindColumns = (childColumns: (AgColumn | AgProvidedColumnGroup)[]): void => {
        for (let i = 0; i < childColumns.length; i++) {
            const child = childColumns[i];
            if (isColumn(child)) {
                result.push(child);
            } else if (isProvidedColumnGroup(child)) {
                recursiveFindColumns(child.getChildren());
            }
        }
    };

    recursiveFindColumns(rootColumns);

    return result;
}

export function getWidthOfColsInList(columnList: AgColumn[]) {
    return columnList.reduce((width, col) => width + col.getActualWidth(), 0);
}

export function _destroyColumnTree(
    context: Context,
    oldTree: (AgColumn | AgProvidedColumnGroup)[] | null | undefined,
    newTree?: (AgColumn | AgProvidedColumnGroup)[] | null
): void {
    const oldObjectsById: { [id: ColumnInstanceId]: (AgColumn | AgProvidedColumnGroup) | null } = {};

    if (!oldTree) {
        return;
    }

    // add in all old columns to be destroyed
    depthFirstOriginalTreeSearch(null, oldTree, (child) => {
        oldObjectsById[child.getInstanceId()] = child;
    });

    // however we don't destroy anything in the new tree. if destroying the grid, there is no new tree
    if (newTree) {
        depthFirstOriginalTreeSearch(null, newTree, (child) => {
            oldObjectsById[child.getInstanceId()] = null;
        });
    }

    // what's left can be destroyed
    const colsToDestroy = Object.values(oldObjectsById).filter((item) => item != null);
    context.destroyBeans(colsToDestroy);
}

export function isColumnGroupAutoCol(col: AgColumn): boolean {
    const colId = col.getId();
    return colId.startsWith(GROUP_AUTO_COLUMN_ID);
}

export function isColumnSelectionCol(col: ColKey): boolean {
    const id = typeof col === 'string' ? col : 'getColId' in col ? col.getColId() : col.colId;
    return id?.startsWith(CONTROLS_COLUMN_ID_PREFIX) ?? false;
}

export function convertColumnTypes(type: string | string[]): string[] {
    let typeKeys: string[] = [];

    if (type instanceof Array) {
        typeKeys = type;
    } else if (typeof type === 'string') {
        typeKeys = type.split(',');
    }
    return typeKeys;
}

export function _areColIdsEqual(colsA: AgColumn[] | null, colsB: AgColumn[] | null): boolean {
    return _areEqual(colsA, colsB, (a, b) => a.getColId() === b.getColId());
}

export function _updateColsMap(cols: ColumnCollections): void {
    cols.map = {};
    cols.list.forEach((col) => (cols.map[col.getId()] = col));
}

export function _convertColumnEventSourceType(source: PropertyChangedSource): ColumnEventType {
    // unfortunately they do not match so need to perform conversion
    return source === 'gridOptionsUpdated' ? 'gridOptionsChanged' : source;
}

export function _columnsMatch(column: AgColumn, key: ColKey): boolean {
    const columnMatches = column === key;
    const colDefMatches = column.getColDef() === key;
    const idMatches = column.getColId() == key;

    return columnMatches || colDefMatches || idMatches;
}
