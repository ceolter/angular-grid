import type {
    AgColumn,
    BeanCollection,
    ChangedPath,
    ClientSideRowModelStage,
    ColDef,
    ColumnModel,
    FuncColsService,
    GridOptions,
    IPivotResultColsService,
    IRowNodeStage,
    NamedBean,
    RowNode,
    StageExecuteParams,
    ValueService,
} from 'ag-grid-community';
import { BeanStub, _missing } from 'ag-grid-community';

import type { PivotColDefService } from './pivotColDefService';

const EXCEEDED_MAX_UNIQUE_VALUES = 'Exceeded maximum allowed pivot column count.';

export class PivotStage extends BeanStub implements NamedBean, IRowNodeStage {
    beanName = 'pivotStage' as const;

    public refreshProps: Set<keyof GridOptions<any>> = new Set([
        'removePivotHeaderRowWhenSingleValueColumn',
        'pivotRowTotals',
        'pivotColumnGroupTotals',
        'suppressExpandablePivotGroups',
    ]);
    public step: ClientSideRowModelStage = 'pivot';

    private valueService: ValueService;
    private columnModel: ColumnModel;
    private pivotResultColsService: IPivotResultColsService;
    private funcColsService: FuncColsService;
    private pivotColDefService: PivotColDefService;

    public wireBeans(beans: BeanCollection) {
        this.valueService = beans.valueService;
        this.columnModel = beans.columnModel;
        this.pivotResultColsService = beans.pivotResultColsService!;
        this.funcColsService = beans.funcColsService;
        this.pivotColDefService = beans.pivotColDefService as PivotColDefService;
    }

    private uniqueValues: any = {};

    private pivotColumnDefs: ColDef[];

    private aggregationColumnsHashLastTime: string | null;
    private aggregationFuncsHashLastTime: string;

    private groupColumnsHashLastTime: string | null;

    private pivotRowTotalsLastTime: GridOptions['pivotRowTotals'];
    private pivotColumnGroupTotalsLastTime: GridOptions['pivotColumnGroupTotals'];
    private suppressExpandablePivotGroupsLastTime: GridOptions['suppressExpandablePivotGroups'];
    private removePivotHeaderRowWhenSingleValueColumnLastTime: GridOptions['removePivotHeaderRowWhenSingleValueColumn'];

    private lastTimeFailed = false;

    private maxUniqueValues: number = -1;

    public execute(params: StageExecuteParams): void {
        const changedPath = params.changedPath;
        if (this.columnModel.isPivotActive()) {
            this.executePivotOn(changedPath!);
        } else {
            this.executePivotOff(changedPath!);
        }
    }

    private executePivotOff(changedPath: ChangedPath): void {
        this.aggregationColumnsHashLastTime = null;
        this.uniqueValues = {};
        if (this.pivotResultColsService.isPivotResultColsPresent()) {
            this.pivotResultColsService.setPivotResultCols(null, 'rowModelUpdated');
            if (changedPath) {
                changedPath.setInactive();
            }
        }
    }

    private executePivotOn(changedPath: ChangedPath): void {
        const numberOfAggregationColumns = this.funcColsService.valueCols.length ?? 1;

        // As unique values creates one column per aggregation column, divide max columns by number of aggregation columns
        // to get the max number of unique values.
        const configuredMaxCols = this.gos.get('pivotMaxGeneratedColumns');
        this.maxUniqueValues = configuredMaxCols === -1 ? -1 : configuredMaxCols / numberOfAggregationColumns;
        let uniqueValues;
        try {
            // try catch is used to force execution to stop when the max count is exceeded.
            uniqueValues = this.bucketUpRowNodes(changedPath);
        } catch (e) {
            // message is checked rather than inheritance as the build seems to break instanceof
            if (e.message === EXCEEDED_MAX_UNIQUE_VALUES) {
                this.pivotResultColsService.setPivotResultCols([], 'rowModelUpdated');
                this.eventService.dispatchEvent({
                    type: 'pivotMaxColumnsExceeded',
                    message: e.message,
                });
                this.lastTimeFailed = true;
                return;
            }
            throw e;
        }

        const uniqueValuesChanged = this.setUniqueValues(uniqueValues);

        const aggregationColumns = this.funcColsService.valueCols;
        const aggregationColumnsHash = aggregationColumns
            .map((column) => `${column.getId()}-${column.getColDef().headerName}`)
            .join('#');
        const aggregationFuncsHash = aggregationColumns.map((column) => column.getAggFunc()!.toString()).join('#');

        const aggregationColumnsChanged = this.aggregationColumnsHashLastTime !== aggregationColumnsHash;
        const aggregationFuncsChanged = this.aggregationFuncsHashLastTime !== aggregationFuncsHash;
        this.aggregationColumnsHashLastTime = aggregationColumnsHash;
        this.aggregationFuncsHashLastTime = aggregationFuncsHash;

        const groupColumnsHash = this.funcColsService.rowGroupCols.map((column) => column.getId()).join('#');
        const groupColumnsChanged = groupColumnsHash !== this.groupColumnsHashLastTime;
        this.groupColumnsHashLastTime = groupColumnsHash;

        const pivotRowTotals = this.gos.get('pivotRowTotals');
        const pivotColumnGroupTotals = this.gos.get('pivotColumnGroupTotals');
        const suppressExpandablePivotGroups = this.gos.get('suppressExpandablePivotGroups');
        const removePivotHeaderRowWhenSingleValueColumn = this.gos.get('removePivotHeaderRowWhenSingleValueColumn');

        const anyGridOptionsChanged =
            pivotRowTotals !== this.pivotRowTotalsLastTime ||
            pivotColumnGroupTotals !== this.pivotColumnGroupTotalsLastTime ||
            suppressExpandablePivotGroups !== this.suppressExpandablePivotGroupsLastTime ||
            removePivotHeaderRowWhenSingleValueColumn !== this.removePivotHeaderRowWhenSingleValueColumnLastTime;

        this.pivotRowTotalsLastTime = pivotRowTotals;
        this.pivotColumnGroupTotalsLastTime = pivotColumnGroupTotals;
        this.suppressExpandablePivotGroupsLastTime = suppressExpandablePivotGroups;
        this.removePivotHeaderRowWhenSingleValueColumnLastTime = removePivotHeaderRowWhenSingleValueColumn;

        if (
            this.lastTimeFailed ||
            uniqueValuesChanged ||
            aggregationColumnsChanged ||
            groupColumnsChanged ||
            aggregationFuncsChanged ||
            anyGridOptionsChanged
        ) {
            const { pivotColumnGroupDefs, pivotColumnDefs } = this.pivotColDefService.createPivotColumnDefs(
                this.uniqueValues
            );
            this.pivotColumnDefs = pivotColumnDefs;
            this.pivotResultColsService.setPivotResultCols(pivotColumnGroupDefs, 'rowModelUpdated');
            // because the secondary columns have changed, then the aggregation needs to visit the whole
            // tree again, so we make the changedPath not active, to force aggregation to visit all paths.
            if (changedPath) {
                changedPath.setInactive();
            }
        }
        this.lastTimeFailed = false;
    }

    private setUniqueValues(newValues: any): boolean {
        const json1 = JSON.stringify(newValues);
        const json2 = JSON.stringify(this.uniqueValues);

        const uniqueValuesChanged = json1 !== json2;

        // we only continue the below if the unique values are different, as otherwise
        // the result will be the same as the last time we did it
        if (uniqueValuesChanged) {
            this.uniqueValues = newValues;
            return true;
        } else {
            return false;
        }
    }

    private currentUniqueCount = 0;
    private bucketUpRowNodes(changedPath: ChangedPath): any {
        this.currentUniqueCount = 0;
        // accessed from inside inner function
        const uniqueValues: any = {};

        // ensure childrenMapped is cleared, as if a node has been filtered out it should not have mapped children.
        changedPath.forEachChangedNodeDepthFirst((node) => {
            if (node.leafGroup) {
                node.childrenMapped = null;
            }
        });

        const recursivelyBucketFilteredChildren = (node: RowNode) => {
            if (node.leafGroup) {
                this.bucketRowNode(node, uniqueValues);
            } else {
                node.childrenAfterFilter?.forEach(recursivelyBucketFilteredChildren);
            }
        };

        changedPath.executeFromRootNode(recursivelyBucketFilteredChildren);

        return uniqueValues;
    }

    private bucketRowNode(rowNode: RowNode, uniqueValues: any): void {
        const pivotColumns = this.funcColsService.pivotCols;

        if (pivotColumns.length === 0) {
            rowNode.childrenMapped = null;
        } else {
            rowNode.childrenMapped = this.bucketChildren(rowNode.childrenAfterFilter!, pivotColumns, 0, uniqueValues);
        }

        if (rowNode.sibling) {
            rowNode.sibling.childrenMapped = rowNode.childrenMapped;
        }
    }

    private bucketChildren(
        children: RowNode[],
        pivotColumns: AgColumn[],
        pivotIndex: number,
        uniqueValues: any
    ): Record<string, any> {
        const mappedChildren: Record<string, RowNode[]> = {};
        const pivotColumn = pivotColumns[pivotIndex];

        // map the children out based on the pivot column
        children.forEach((child: RowNode) => {
            let key: string = this.valueService.getKeyForNode(pivotColumn, child);

            if (_missing(key)) {
                key = '';
            }

            if (!uniqueValues[key]) {
                this.currentUniqueCount += 1;
                uniqueValues[key] = {};

                const doesGeneratedColMaxExist = this.maxUniqueValues !== -1;
                const hasExceededColMax = this.currentUniqueCount > this.maxUniqueValues;
                if (doesGeneratedColMaxExist && hasExceededColMax) {
                    // throw an error to prevent all additional execution and escape the loops.
                    throw Error(EXCEEDED_MAX_UNIQUE_VALUES);
                }
            }

            if (!mappedChildren[key]) {
                mappedChildren[key] = [];
            }
            mappedChildren[key].push(child);
        });

        // if it's the last pivot column, return as is, otherwise go one level further in the map
        if (pivotIndex === pivotColumns.length - 1) {
            return mappedChildren;
        } else {
            const result: Record<string, any> = {};

            for (const [key, value] of Object.entries(mappedChildren)) {
                result[key] = this.bucketChildren(value, pivotColumns, pivotIndex + 1, uniqueValues[key]);
            }

            return result;
        }
    }

    public getPivotColumnDefs(): ColDef[] {
        return this.pivotColumnDefs;
    }
}
