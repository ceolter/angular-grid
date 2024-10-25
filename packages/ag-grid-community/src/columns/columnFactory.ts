import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import { AgColumn } from '../entities/agColumn';
import type { AgProvidedColumnGroup } from '../entities/agProvidedColumnGroup';
import { isProvidedColumnGroup } from '../entities/agProvidedColumnGroup';
import type { ColDef, ColGroupDef } from '../entities/colDef';
import { DefaultColumnTypes } from '../entities/defaultColumnTypes';
import type { ColumnEventType } from '../events';
import { _isColumnsSortingCoupledToGroup } from '../gridOptionsUtils';
import { _mergeDeep } from '../utils/object';
import { _warn } from '../validation/logging';
import type { ColumnGroupService } from './columnGroups/columnGroupService';
import { ColumnKeyCreator } from './columnKeyCreator';
import { convertColumnTypes } from './columnUtils';
import type { DataTypeService } from './dataTypeService';

// takes ColDefs and ColGroupDefs and turns them into Columns and OriginalGroups
export class ColumnFactory extends BeanStub implements NamedBean {
    beanName = 'colFactory' as const;

    private dataTypeSvc?: DataTypeService;
    private columnGroupSvc?: ColumnGroupService;

    public wireBeans(beans: BeanCollection): void {
        this.dataTypeSvc = beans.dataTypeSvc;
        this.columnGroupSvc = beans.columnGroupSvc;
    }

    public createColumnTree(
        defs: (ColDef | ColGroupDef)[] | null | undefined = null,
        primaryColumns: boolean,
        existingTree: (AgColumn | AgProvidedColumnGroup)[] | undefined,
        source: ColumnEventType
    ): { columnTree: (AgColumn | AgProvidedColumnGroup)[]; treeDept: number } {
        // column key creator dishes out unique column id's in a deterministic way,
        // so if we have two grids (that could be master/slave) with same column definitions,
        // then this ensures the two grids use identical id's.
        const columnKeyCreator = new ColumnKeyCreator();

        const { existingCols, existingGroups, existingColKeys } = this.extractExistingTreeData(existingTree);
        columnKeyCreator.addExistingKeys(existingColKeys);

        // create am unbalanced tree that maps the provided definitions
        const unbalancedTree = this.recursivelyCreateColumns(
            defs,
            0,
            primaryColumns,
            existingCols,
            columnKeyCreator,
            existingGroups,
            source
        );
        const treeDept = this.columnGroupSvc?.findMaxDepth(unbalancedTree, 0) ?? 0;
        const columnTree = this.columnGroupSvc
            ? this.columnGroupSvc.balanceColumnTree(unbalancedTree, 0, treeDept, columnKeyCreator)
            : unbalancedTree;

        const deptFirstCallback = (child: AgColumn | AgProvidedColumnGroup, parent: AgProvidedColumnGroup) => {
            if (isProvidedColumnGroup(child)) {
                child.setupExpandable();
            }
            // we set the original parents at the end, rather than when we go along, as balancing the tree
            // adds extra levels into the tree. so we can only set parents when balancing is done.
            child.setOriginalParent(parent);
        };

        depthFirstOriginalTreeSearch(null, columnTree, deptFirstCallback);

        return {
            columnTree,
            treeDept,
        };
    }

    private extractExistingTreeData(existingTree?: (AgColumn | AgProvidedColumnGroup)[]): {
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

    private recursivelyCreateColumns(
        defs: (ColDef | ColGroupDef)[] | null,
        level: number,
        primaryColumns: boolean,
        existingColsCopy: AgColumn[],
        columnKeyCreator: ColumnKeyCreator,
        existingGroups: AgProvidedColumnGroup[],
        source: ColumnEventType
    ): (AgColumn | AgProvidedColumnGroup)[] {
        if (!defs) return [];

        const result = new Array(defs.length);
        for (let i = 0; i < result.length; i++) {
            const def = defs[i];
            if (this.columnGroupSvc && this.isColumnGroup(def)) {
                result[i] = this.columnGroupSvc.createProvidedColumnGroup(
                    primaryColumns,
                    def as ColGroupDef,
                    level,
                    existingColsCopy,
                    columnKeyCreator,
                    existingGroups,
                    source,
                    this.recursivelyCreateColumns.bind(this)
                );
            } else {
                result[i] = this.createColumn(
                    primaryColumns,
                    def as ColDef,
                    existingColsCopy,
                    columnKeyCreator,
                    source
                );
            }
        }
        return result;
    }

    private createColumn(
        primaryColumns: boolean,
        colDef: ColDef,
        existingColsCopy: AgColumn[] | null,
        columnKeyCreator: ColumnKeyCreator,
        source: ColumnEventType
    ): AgColumn {
        // see if column already exists
        const existingColAndIndex = this.findExistingColumn(colDef, existingColsCopy);

        // make sure we remove, so if user provided duplicate id, then we don't have more than
        // one column instance for colDef with common id
        if (existingColAndIndex) {
            existingColsCopy?.splice(existingColAndIndex.idx, 1);
        }

        let column = existingColAndIndex?.column;
        if (!column) {
            // no existing column, need to create one
            const colId = columnKeyCreator.getUniqueKey(colDef.colId, colDef.field);
            const colDefMerged = this.addColumnDefaultAndTypes(colDef, colId);
            column = new AgColumn(colDefMerged, colDef, colId, primaryColumns);
            this.createBean(column);
        } else {
            const colDefMerged = this.addColumnDefaultAndTypes(colDef, column.getColId());
            column.setColDef(colDefMerged, colDef, source);
            this.applyColumnState(column, colDefMerged, source);
        }

        this.dataTypeSvc?.addColumnListeners(column);

        return column;
    }

    public applyColumnState(column: AgColumn, colDef: ColDef, source: ColumnEventType): void {
        // flex
        if (colDef.flex !== undefined) {
            column.setFlex(colDef.flex);
        }

        // width - we only set width if column is not flexing
        const noFlexThisCol = column.getFlex() != null;
        if (noFlexThisCol) {
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

        // sort - anything but undefined will set sort, thus null or empty string will clear the sort
        if (colDef.sort !== undefined) {
            if (colDef.sort == 'asc' || colDef.sort == 'desc') {
                column.setSort(colDef.sort, source);
            } else {
                column.setSort(undefined, source);
            }
        }

        // sorted at - anything but undefined, thus null will clear the sortIndex
        if (colDef.sortIndex !== undefined) {
            column.setSortIndex(colDef.sortIndex);
        }

        // hide - anything but undefined, thus null will clear the hide
        if (colDef.hide !== undefined) {
            column.setVisible(!colDef.hide, source);
        }

        // pinned - anything but undefined, thus null or empty string will remove pinned
        if (colDef.pinned !== undefined) {
            column.setPinned(colDef.pinned);
        }
    }

    private findExistingColumn(
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

    public addColumnDefaultAndTypes(colDef: ColDef, colId: string): ColDef {
        // start with empty merged definition
        const res: ColDef = {} as ColDef;

        // merge properties from default column definitions
        const defaultColDef = this.gos.get('defaultColDef');
        _mergeDeep(res, defaultColDef, false, true);

        const columnType = this.updateColDefAndGetColumnType(res, colDef, colId);

        if (columnType) {
            this.assignColumnTypes(columnType, res);
        }

        // merge properties from column definitions
        _mergeDeep(res, colDef, false, true);

        const autoGroupColDef = this.gos.get('autoGroupColumnDef');
        const isSortingCoupled = _isColumnsSortingCoupledToGroup(this.gos);
        if (colDef.rowGroup && autoGroupColDef && isSortingCoupled) {
            // override the sort for row group columns where the autoGroupColDef defines these values.
            _mergeDeep(
                res,
                { sort: autoGroupColDef.sort, initialSort: autoGroupColDef.initialSort } as ColDef,
                false,
                true
            );
        }

        this.dataTypeSvc?.validateColDef(res);

        return res;
    }

    private updateColDefAndGetColumnType(colDef: ColDef, userColDef: ColDef, colId: string): string[] | undefined {
        const dataTypeDefinitionColumnType = this.dataTypeSvc?.updateColDefAndGetColumnType(colDef, userColDef, colId);
        const columnTypes = userColDef.type ?? dataTypeDefinitionColumnType ?? colDef.type;
        colDef.type = columnTypes;
        return columnTypes ? convertColumnTypes(columnTypes) : undefined;
    }

    private assignColumnTypes(typeKeys: string[], colDefMerged: ColDef) {
        if (!typeKeys.length) {
            return;
        }

        // merge user defined with default column types
        const allColumnTypes = Object.assign({}, DefaultColumnTypes);
        const userTypes = this.gos.get('columnTypes') || {};

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
    private isColumnGroup(abstractColDef: ColDef | ColGroupDef): boolean {
        return (abstractColDef as ColGroupDef).children !== undefined;
    }
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
