import type {
    AbstractColDef,
    AgColumn,
    AgProvidedColumnGroup,
    BeanCollection,
    ColDef,
    ColGroupDef,
    ColKey,
    ColumnEventType,
    ColumnFactory,
    ColumnModel,
    Context,
    IPivotResultColsService,
    NamedBean,
    VisibleColsService,
    _ColumnCollections,
} from 'ag-grid-community';
import { BeanStub, _areEqual, _destroyColumnTree, _exists, _getColumnsFromTree } from 'ag-grid-community';

export class PivotResultColsService extends BeanStub implements NamedBean, IPivotResultColsService {
    beanName = 'pivotResultCols' as const;

    private context: Context;
    private colModel: ColumnModel;
    private colFactory: ColumnFactory;
    private visibleCols: VisibleColsService;

    public wireBeans(beans: BeanCollection): void {
        this.context = beans.context;
        this.colModel = beans.colModel;
        this.colFactory = beans.colFactory;
        this.visibleCols = beans.visibleCols;
    }

    // if pivoting, these are the generated columns as a result of the pivot
    private pivotResultCols: _ColumnCollections | null;

    // Saved when pivot is disabled, available to re-use when pivot is restored
    private previousPivotResultCols: (AgColumn | AgProvidedColumnGroup)[] | null;

    public override destroy(): void {
        _destroyColumnTree(this.context, this.pivotResultCols?.tree);
        super.destroy();
    }

    public isPivotResultColsPresent(): boolean {
        return this.pivotResultCols != null;
    }

    public lookupPivotResultCol(pivotKeys: string[], valueColKey: ColKey): AgColumn | null {
        if (this.pivotResultCols == null) {
            return null;
        }

        const valueColumnToFind = this.colModel.getColDefCol(valueColKey);

        let foundColumn: AgColumn | null = null;

        this.pivotResultCols.list.forEach((column) => {
            const thisPivotKeys = column.getColDef().pivotKeys;
            const pivotValueColumn = column.getColDef().pivotValueColumn;

            const pivotKeyMatches = _areEqual(thisPivotKeys, pivotKeys);
            const pivotValueMatches = pivotValueColumn === valueColumnToFind;

            if (pivotKeyMatches && pivotValueMatches) {
                foundColumn = column;
            }
        });

        return foundColumn;
    }

    public getPivotResultCols(): _ColumnCollections | null {
        return this.pivotResultCols;
    }

    public getPivotResultCol(key: ColKey): AgColumn | null {
        if (!this.pivotResultCols) {
            return null;
        }
        return this.colModel.getColFromCollection(key, this.pivotResultCols);
    }

    public setPivotResultCols(colDefs: (ColDef | ColGroupDef)[] | null, source: ColumnEventType): void {
        if (!this.colModel.ready) {
            return;
        }

        // if no cols passed, and we had no cols anyway, then do nothing
        if (colDefs == null && this.pivotResultCols == null) {
            return;
        }

        if (colDefs) {
            this.processPivotResultColDef(colDefs);
            const balancedTreeResult = this.colFactory.createColumnTree(
                colDefs,
                false,
                this.pivotResultCols?.tree || this.previousPivotResultCols || undefined,
                source
            );
            _destroyColumnTree(this.context, this.pivotResultCols?.tree, balancedTreeResult.columnTree);

            const tree = balancedTreeResult.columnTree;
            const treeDepth = balancedTreeResult.treeDept;
            const list = _getColumnsFromTree(tree);
            const map = {};

            this.pivotResultCols = { tree, treeDepth, list, map };
            this.pivotResultCols.list.forEach((col) => (this.pivotResultCols!.map[col.getId()] = col));
            const hasPreviousCols = !!this.previousPivotResultCols;
            this.previousPivotResultCols = null;
            this.colModel.refreshCols(!hasPreviousCols);
        } else {
            this.previousPivotResultCols = this.pivotResultCols ? this.pivotResultCols.tree : null;
            this.pivotResultCols = null;

            this.colModel.refreshCols(false);
        }
        this.visibleCols.refresh(source);
    }

    private processPivotResultColDef(colDefs: (ColDef | ColGroupDef)[] | null) {
        const columnCallback = this.gos.get('processPivotResultColDef');
        const groupCallback = this.gos.get('processPivotResultColGroupDef');

        if (!columnCallback && !groupCallback) {
            return undefined;
        }

        const searchForColDefs = (colDefs2: (ColDef | ColGroupDef)[]): void => {
            colDefs2.forEach((abstractColDef: AbstractColDef) => {
                const isGroup = _exists((abstractColDef as any).children);
                if (isGroup) {
                    const colGroupDef = abstractColDef as ColGroupDef;
                    if (groupCallback) {
                        groupCallback(colGroupDef);
                    }
                    searchForColDefs(colGroupDef.children);
                } else {
                    const colDef = abstractColDef as ColDef;
                    if (columnCallback) {
                        columnCallback(colDef);
                    }
                }
            });
        };

        if (colDefs) {
            searchForColDefs(colDefs);
        }
    }
}
