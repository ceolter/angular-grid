import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import { AgColumn } from '../entities/agColumn';
import type { ColDef } from '../entities/colDef';
import type { GridOptions } from '../entities/gridOptions';
import type { ColumnEventType } from '../events';
import { _getCheckboxLocation, _getCheckboxes, _getHeaderCheckbox } from '../gridOptionsUtils';
import type { IAutoColService } from '../interfaces/iAutoColService';
import type { ColumnGroupService } from './columnGroups/columnGroupService';
import type { ColKey, ColumnCollections, ColumnModel } from './columnModel';
import { _applyColumnState, _getColumnState } from './columnStateUtils';
import {
    _areColIdsEqual,
    _columnsMatch,
    _convertColumnEventSourceType,
    _destroyColumnTree,
    _updateColsMap,
    isColumnSelectionCol,
} from './columnUtils';
import type { VisibleColsService } from './visibleColsService';

export const CONTROLS_COLUMN_ID_PREFIX = 'ag-Grid-SelectionColumn' as const;

export class SelectionColService extends BeanStub implements NamedBean {
    beanName = 'selectionColSvc' as const;

    private colGroupSvc?: ColumnGroupService;
    private autoColSvc?: IAutoColService;
    private colModel: ColumnModel;
    private visibleCols: VisibleColsService;
    // selection checkbox columns
    public selectionCols: ColumnCollections | null;

    public wireBeans(beans: BeanCollection): void {
        this.colGroupSvc = beans.colGroupSvc;
        this.autoColSvc = beans.autoColSvc;
        this.colModel = beans.colModel;
        this.visibleCols = beans.visibleCols;
    }

    public postConstruct(): void {
        this.addManagedPropertyListener('rowSelection', (event) => {
            this.onSelectionOptionsChanged(
                event.currentValue,
                event.previousValue,
                _convertColumnEventSourceType(event.source)
            );
        });
    }

    public addSelectionCols(cols: ColumnCollections): void {
        if (this.selectionCols == null) {
            return;
        }
        cols.list = this.selectionCols.list.concat(cols.list);
        cols.tree = this.selectionCols.tree.concat(cols.tree);
        _updateColsMap(cols);
    }

    public createSelectionCols(
        cols: ColumnCollections,
        updateOrders: (callback: (cols: AgColumn[] | null) => AgColumn[] | null) => void
    ): void {
        const destroyCollection = () => {
            _destroyColumnTree(this.beans, this.selectionCols?.tree);
            this.selectionCols = null;
        };

        // the new tree dept will equal the current tree dept of cols
        const newTreeDepth = cols.treeDepth;
        const oldTreeDepth = this.selectionCols?.treeDepth ?? -1;
        const treeDeptSame = oldTreeDepth == newTreeDepth;

        const list = this.generateSelectionCols();
        const areSame = _areColIdsEqual(list, this.selectionCols?.list ?? []);

        if (areSame && treeDeptSame) {
            return;
        }

        destroyCollection();
        const treeDepth = this.colGroupSvc?.findDepth(cols.tree) ?? 0;
        const tree = this.autoColSvc?.balanceTreeForAutoCols(list, treeDepth) ?? [];
        this.selectionCols = {
            list,
            tree,
            treeDepth,
            map: {},
        };

        const putSelectionColsFirstInList = (cols?: AgColumn[] | null): AgColumn[] | null => {
            if (!cols) {
                return null;
            }
            // we use colId, and not instance, to remove old selectionCols
            const colsFiltered = cols.filter((col) => !isColumnSelectionCol(col));
            return [...list, ...colsFiltered];
        };

        updateOrders(putSelectionColsFirstInList);
    }

    private isSelectionColumnEnabled(): boolean {
        const { gos } = this;
        const rowSelection = gos.get('rowSelection');
        if (typeof rowSelection !== 'object') {
            return false;
        }

        if (rowSelection.checkboxLocation === 'autoGroupColumn') {
            return false;
        }

        const checkboxes = !!_getCheckboxes(rowSelection);
        const headerCheckbox = _getHeaderCheckbox(rowSelection);

        return checkboxes || headerCheckbox;
    }

    private generateSelectionCols(): AgColumn[] {
        if (!this.isSelectionColumnEnabled()) {
            return [];
        }

        const selectionColumnDef = this.gos.get('selectionColumnDef');
        const enableRTL = this.gos.get('enableRtl');
        const colDef: ColDef = {
            // overridable properties
            width: 50,
            resizable: false,
            suppressHeaderMenuButton: true,
            sortable: false,
            suppressMovable: true,
            lockPosition: enableRTL ? 'right' : 'left',
            comparator(valueA, valueB, nodeA, nodeB) {
                const aSelected = nodeA.isSelected();
                const bSelected = nodeB.isSelected();
                return aSelected && bSelected ? 0 : aSelected ? 1 : -1;
            },
            editable: false,
            suppressFillHandle: true,
            // overrides
            ...selectionColumnDef,
            // non-overridable properties
            colId: CONTROLS_COLUMN_ID_PREFIX,
        };
        const col = new AgColumn(colDef, null, colDef.colId!, false);
        this.createBean(col);
        return [col];
    }

    public putSelectionColsFirstInList(list: AgColumn[], cols?: AgColumn[] | null): AgColumn[] | null {
        if (!cols) {
            return null;
        }
        // we use colId, and not instance, to remove old selectionCols
        const colsFiltered = cols.filter((col) => !isColumnSelectionCol(col));
        return [...list, ...colsFiltered];
    }

    public getSelectionCol(key: ColKey): AgColumn | null {
        return this.selectionCols?.list.find((col) => _columnsMatch(col, key)) ?? null;
    }

    public getSelectionCols(): AgColumn[] | null {
        return this.selectionCols?.list ?? null;
    }

    private onSelectionOptionsChanged(
        current: GridOptions['rowSelection'],
        prev: GridOptions['rowSelection'],
        source: ColumnEventType
    ) {
        const prevCheckbox = prev && typeof prev !== 'string' ? _getCheckboxes(prev) : undefined;
        const currCheckbox = current && typeof current !== 'string' ? _getCheckboxes(current) : undefined;
        const checkboxHasChanged = prevCheckbox !== currCheckbox;

        const prevHeaderCheckbox = prev && typeof prev !== 'string' ? _getHeaderCheckbox(prev) : undefined;
        const currHeaderCheckbox = current && typeof current !== 'string' ? _getHeaderCheckbox(current) : undefined;
        const headerCheckboxHasChanged = prevHeaderCheckbox !== currHeaderCheckbox;

        const currLocation = _getCheckboxLocation(current);
        const prevLocation = _getCheckboxLocation(prev);
        const locationChanged = currLocation !== prevLocation;

        if (checkboxHasChanged || headerCheckboxHasChanged || locationChanged) {
            this.colModel.refreshAll(source);
        }
    }

    public override destroy(): void {
        _destroyColumnTree(this.beans, this.selectionCols?.tree);
        super.destroy();
    }

    public refreshVisibility(source: ColumnEventType): void {
        if (!this.isSelectionColumnEnabled()) {
            return;
        }

        const visibleColumns = this.visibleCols.getAllTrees() ?? [];

        if (visibleColumns.length === 0) {
            return;
        }

        // case 1: only one column showing -- selection column
        if (visibleColumns.length === 1) {
            const firstColumn = visibleColumns[0];

            if (!firstColumn.isColumn || !isColumnSelectionCol(firstColumn)) {
                return;
            }

            _applyColumnState(this.beans, { state: [{ colId: firstColumn.getColId(), hide: true }] }, source);

            return;
        }

        // case 2: multiple columns showing -- none are selection column
        if (!visibleColumns.some((c) => c.isColumn && isColumnSelectionCol(c))) {
            const existingState = _getColumnState(this.beans).find((state) => isColumnSelectionCol(state.colId));

            if (existingState) {
                _applyColumnState(
                    this.beans,
                    {
                        state: [{ colId: existingState.colId, hide: !existingState.hide }],
                    },
                    source
                );
            }
        }
    }
}
