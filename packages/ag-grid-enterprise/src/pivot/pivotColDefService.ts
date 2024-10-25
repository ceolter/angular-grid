import type {
    AgColumn,
    BeanCollection,
    ColDef,
    ColGroupDef,
    ColumnModel,
    ColumnNameService,
    FuncColsService,
    IPivotColDefService,
    NamedBean,
} from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

export interface PivotColDefServiceResult {
    pivotColumnGroupDefs: (ColDef | ColGroupDef)[];
    pivotColumnDefs: ColDef[];
}

const PIVOT_ROW_TOTAL_PREFIX = 'PivotRowTotal_';
export class PivotColDefService extends BeanStub implements NamedBean, IPivotColDefService {
    beanName = 'pivotColDefSvc' as const;

    private colModel: ColumnModel;
    private funcColsSvc: FuncColsService;
    private colNames: ColumnNameService;

    public wireBeans(beans: BeanCollection) {
        this.colModel = beans.colModel;
        this.funcColsSvc = beans.funcColsSvc;
        this.colNames = beans.colNames;
    }

    private fieldSeparator: string;
    private pivotDefaultExpanded: number;

    public postConstruct(): void {
        const getFieldSeparator = () => this.gos.get('serverSidePivotResultFieldSeparator') ?? '_';
        this.fieldSeparator = getFieldSeparator();
        this.addManagedPropertyListener('serverSidePivotResultFieldSeparator', () => {
            this.fieldSeparator = getFieldSeparator();
        });

        const getPivotDefaultExpanded = () => this.gos.get('pivotDefaultExpanded');
        this.pivotDefaultExpanded = getPivotDefaultExpanded();
        this.addManagedPropertyListener('pivotDefaultExpanded', () => {
            this.pivotDefaultExpanded = getPivotDefaultExpanded();
        });
    }

    public createPivotColumnDefs(uniqueValues: any): PivotColDefServiceResult {
        // this is passed to the colModel, to configure the columns and groups we show

        const pivotColumnGroupDefs: (ColDef | ColGroupDef)[] = this.createPivotColumnsFromUniqueValues(uniqueValues);

        function extractColDefs(input: (ColDef | ColGroupDef)[], arr: ColDef[] = []): ColDef[] {
            input.forEach((def: any) => {
                if (def.children !== undefined) {
                    extractColDefs(def.children, arr);
                } else {
                    arr.push(def);
                }
            });
            return arr;
        }
        const pivotColumnDefs = extractColDefs(pivotColumnGroupDefs);

        // additional columns that contain the aggregated total for each value column per row
        this.addRowGroupTotals(pivotColumnGroupDefs, pivotColumnDefs);

        // additional group columns that contain child totals for each collapsed child column / group
        this.addExpandablePivotGroups(pivotColumnGroupDefs, pivotColumnDefs);

        // additional group columns that contain an aggregated total across all child columns
        this.addPivotTotalsToGroups(pivotColumnGroupDefs, pivotColumnDefs);

        // we clone, so the colDefs in pivotColumnsGroupDefs and pivotColumnDefs are not shared. this is so that
        // any changes the user makes (via processSecondaryColumnDefinitions) don't impact the internal aggregations,
        // as these use the col defs also
        const pivotColumnDefsClone: ColDef[] = pivotColumnDefs.map((colDef) => ({ ...colDef }));

        return {
            pivotColumnGroupDefs: pivotColumnGroupDefs,
            pivotColumnDefs: pivotColumnDefsClone,
        };
    }

    private createPivotColumnsFromUniqueValues(uniqueValues: any): (ColDef | ColGroupDef)[] {
        const pivotColumns = this.funcColsSvc.pivotCols;
        const maxDepth = pivotColumns.length;

        const pivotColumnGroupDefs: (ColDef | ColGroupDef)[] = this.recursivelyBuildGroup(
            0,
            uniqueValues,
            [],
            maxDepth,
            pivotColumns
        );
        return pivotColumnGroupDefs;
    }

    private recursivelyBuildGroup(
        index: number,
        uniqueValue: any,
        pivotKeys: string[],
        maxDepth: number,
        primaryPivotColumns: AgColumn[]
    ): ColGroupDef[] | ColDef[] {
        const measureColumns = this.funcColsSvc.valueCols;
        if (index >= maxDepth) {
            // Base case - build the measure columns
            return this.buildMeasureCols(pivotKeys);
        }

        // sort by either user provided comparator, or our own one
        const primaryPivotColumnDefs = primaryPivotColumns[index].getColDef();
        const comparator = this.headerNameComparator.bind(this, primaryPivotColumnDefs.pivotComparator);

        // Base case for the compact layout, instead of recursing build the last layer of groups as measure columns instead
        if (
            measureColumns.length === 1 &&
            this.gos.get('removePivotHeaderRowWhenSingleValueColumn') &&
            index === maxDepth - 1
        ) {
            const leafCols: ColDef[] = [];

            for (const key of Object.keys(uniqueValue)) {
                const newPivotKeys = [...pivotKeys, key];
                const colDef = this.createColDef(measureColumns[0], key, newPivotKeys);
                colDef.columnGroupShow = 'open';
                leafCols.push(colDef);
            }
            leafCols.sort(comparator);
            return leafCols;
        }
        // Recursive case
        const groups: ColGroupDef[] = [];
        for (const [key, value] of Object.entries(uniqueValue)) {
            // expand group by default based on depth of group. (pivotDefaultExpanded provides desired level of depth for expanding group by default)
            const openByDefault = this.pivotDefaultExpanded === -1 || index < this.pivotDefaultExpanded;

            const newPivotKeys = [...pivotKeys, key];
            groups.push({
                children: this.recursivelyBuildGroup(index + 1, value, newPivotKeys, maxDepth, primaryPivotColumns),
                headerName: key,
                pivotKeys: newPivotKeys,
                columnGroupShow: 'open',
                openByDefault: openByDefault,
                groupId: this.generateColumnGroupId(newPivotKeys),
            });
        }
        groups.sort(comparator);
        return groups;
    }

    private buildMeasureCols(pivotKeys: string[]): ColDef[] {
        const measureColumns = this.funcColsSvc.valueCols;
        if (measureColumns.length === 0) {
            // if no value columns selected, then we insert one blank column, so the user at least sees columns
            // rendered. otherwise the grid would render with no columns (just empty groups) which would give the
            // impression that the grid is broken
            return [this.createColDef(null, '-', pivotKeys)];
        }
        return measureColumns.map((measureCol) => {
            const columnName = this.colNames.getDisplayNameForColumn(measureCol, 'header');
            return {
                ...this.createColDef(measureCol, columnName, pivotKeys),
                columnGroupShow: 'open',
            };
        });
    }

    private addExpandablePivotGroups(pivotColumnGroupDefs: (ColDef | ColGroupDef)[], pivotColumnDefs: ColDef[]) {
        const isSuppressExpand = this.gos.get('suppressExpandablePivotGroups');
        if (isSuppressExpand || this.gos.get('pivotColumnGroupTotals')) {
            return;
        }

        const recursivelyAddSubTotals = (
            def: ColGroupDef | ColDef,
            currentPivotColumnDefs: ColDef[],
            acc: Map<string, string[]>
        ) => {
            if ('children' in def) {
                const childAcc = new Map();

                def.children.forEach((grp: ColDef | ColGroupDef) => {
                    recursivelyAddSubTotals(grp, currentPivotColumnDefs, childAcc);
                });

                const leafGroup = !def.children.some((child) => (child as ColGroupDef).children);

                this.funcColsSvc.valueCols.forEach((valueColumn) => {
                    const columnName: string | null = this.colNames.getDisplayNameForColumn(valueColumn, 'header');
                    const totalColDef = this.createColDef(valueColumn, columnName, def.pivotKeys);
                    totalColDef.pivotTotalColumnIds = childAcc.get(valueColumn.getColId());

                    totalColDef.columnGroupShow = !isSuppressExpand ? 'closed' : 'open';

                    totalColDef.aggFunc = valueColumn.getAggFunc();

                    if (!leafGroup) {
                        // add total colDef to group and pivot colDefs array
                        const children = def.children;
                        children.push(totalColDef);
                        currentPivotColumnDefs.push(totalColDef);
                    }
                });

                this.merge(acc, childAcc);

                return;
            }

            // check that value column exists, i.e. aggFunc is supplied
            if (!def.pivotValueColumn) {
                return;
            }

            const pivotValueColId = def.pivotValueColumn.getColId();

            const exists = acc.has(pivotValueColId);
            if (exists) {
                const arr = acc.get(pivotValueColId)!;
                arr.push(def.colId!);
            } else {
                acc.set(pivotValueColId, [def.colId!]);
            }
        };

        pivotColumnGroupDefs.forEach((groupDef: ColGroupDef | ColDef) => {
            recursivelyAddSubTotals(groupDef, pivotColumnDefs, new Map());
        });
    }

    private addPivotTotalsToGroups(pivotColumnGroupDefs: (ColDef | ColGroupDef)[], pivotColumnDefs: ColDef[]) {
        if (!this.gos.get('pivotColumnGroupTotals')) {
            return;
        }

        const insertAfter = this.gos.get('pivotColumnGroupTotals') === 'after';

        const valueCols = this.funcColsSvc.valueCols;
        const aggFuncs = valueCols.map((valueCol) => valueCol.getAggFunc());

        // don't add pivot totals if there is less than 1 aggFunc or they are not all the same
        if (!aggFuncs || aggFuncs.length < 1 || !this.sameAggFuncs(aggFuncs)) {
            // console.warn('AG Grid: aborting adding pivot total columns - value columns require same aggFunc');
            return;
        }

        // arbitrarily select a value column to use as a template for pivot columns
        const valueColumn = valueCols[0];

        pivotColumnGroupDefs.forEach((groupDef: ColGroupDef | ColDef) => {
            this.recursivelyAddPivotTotal(groupDef, pivotColumnDefs, valueColumn, insertAfter);
        });
    }

    private recursivelyAddPivotTotal(
        groupDef: ColGroupDef | ColDef,
        pivotColumnDefs: ColDef[],
        valueColumn: AgColumn,
        insertAfter: boolean
    ): string[] | null {
        const group = groupDef as ColGroupDef;
        if (!group.children) {
            const def: ColDef = groupDef as ColDef;
            return def.colId ? [def.colId] : null;
        }

        let colIds: string[] = [];

        // need to recurse children first to obtain colIds used in the aggregation stage
        group.children.forEach((grp: ColDef | ColGroupDef) => {
            const childColIds = this.recursivelyAddPivotTotal(grp, pivotColumnDefs, valueColumn, insertAfter);
            if (childColIds) {
                colIds = colIds.concat(childColIds);
            }
        });

        // only add total colDef if there is more than 1 child node
        if (group.children.length > 1) {
            const localeTextFunc = this.getLocaleTextFunc();
            const headerName = localeTextFunc('pivotColumnGroupTotals', 'Total');

            //create total colDef using an arbitrary value column as a template
            const totalColDef = this.createColDef(valueColumn, headerName, groupDef.pivotKeys, true);
            totalColDef.pivotTotalColumnIds = colIds;
            totalColDef.aggFunc = valueColumn.getAggFunc();
            totalColDef.columnGroupShow = this.gos.get('suppressExpandablePivotGroups') ? 'open' : undefined;

            // add total colDef to group and pivot colDefs array
            const children = (groupDef as ColGroupDef).children;
            insertAfter ? children.push(totalColDef) : children.unshift(totalColDef);
            pivotColumnDefs.push(totalColDef);
        }

        return colIds;
    }

    private addRowGroupTotals(pivotColumnGroupDefs: (ColDef | ColGroupDef)[], pivotColumnDefs: ColDef[]) {
        if (!this.gos.get('pivotRowTotals')) {
            return;
        }

        const insertAtEnd = this.gos.get('pivotRowTotals') === 'after';

        const valueColumns = this.funcColsSvc.valueCols;
        const valueCols = valueColumns.slice();

        if (!insertAtEnd) {
            // if inserting before, we use unshift to insert at the start, so reverse the order to maintain the order of value cols
            valueCols.reverse();
        }

        const isCreateTotalGroups = valueCols.length > 1 || !this.gos.get('removePivotHeaderRowWhenSingleValueColumn');
        for (let i = 0; i < valueCols.length; i++) {
            const valueCol = valueCols[i];

            const columnName: string | null = this.colNames.getDisplayNameForColumn(valueCol, 'header');
            const colDef = this.createColDef(valueCol, columnName, []);

            const colIds: string[] = [];
            for (let i = 0; i < pivotColumnDefs.length; i++) {
                const colDef = pivotColumnDefs[i];
                if (colDef.pivotValueColumn === valueCol) {
                    colIds.push(colDef.colId!);
                }
            }

            colDef.pivotTotalColumnIds = colIds;
            colDef.colId = PIVOT_ROW_TOTAL_PREFIX + colDef.colId;

            const valueGroup: ColGroupDef | ColDef = isCreateTotalGroups
                ? {
                      children: [colDef],
                      pivotKeys: [],
                      groupId: `${PIVOT_ROW_TOTAL_PREFIX}_pivotGroup_${valueCol.getColId()}`,
                  }
                : colDef;

            pivotColumnDefs.push(colDef);
            insertAtEnd ? pivotColumnGroupDefs.push(valueGroup) : pivotColumnGroupDefs.unshift(valueGroup);
        }
    }

    private createColDef(
        valueColumn: AgColumn | null,
        headerName: any,
        pivotKeys: string[] | undefined,
        totalColumn: boolean = false
    ): ColDef {
        const colDef: ColDef = {};

        // This is null when there are no measure columns and we're creating placeholder columns
        if (valueColumn) {
            const colDefToCopy = valueColumn.getColDef();
            Object.assign(colDef, colDefToCopy);
            // even if original column was hidden, we always show the pivot value column, otherwise it would be
            // very confusing for people thinking the pivot is broken
            colDef.hide = false;
        }

        colDef.headerName = headerName;
        colDef.colId = this.generateColumnId(
            pivotKeys || [],
            valueColumn && !totalColumn ? valueColumn.getColId() : ''
        );

        // pivot columns repeat over field, so it makes sense to use the unique id instead. For example if you want to
        // assign values to pinned bottom rows using setPinnedBottomRowData the value service will use this colId.
        colDef.field = colDef.colId;
        // this is to support using pinned rows, normally the data will be extracted from the aggData object using the colId
        // however pinned rows still access the data object by field, this prevents values with dots from being treated as complex objects
        colDef.valueGetter = (params) => params.data?.[params.colDef.field!];

        colDef.pivotKeys = pivotKeys;
        colDef.pivotValueColumn = valueColumn;
        if (colDef.filter === true) {
            colDef.filter = 'agNumberColumnFilter';
        }

        return colDef;
    }

    private sameAggFuncs(aggFuncs: any[]) {
        if (aggFuncs.length == 1) {
            return true;
        }
        //check if all aggFunc's match
        for (let i = 1; i < aggFuncs.length; i++) {
            if (aggFuncs[i] !== aggFuncs[0]) {
                return false;
            }
        }
        return true;
    }

    private headerNameComparator(
        userComparator: (a: string | undefined, b: string | undefined) => number,
        a: ColGroupDef | ColDef,
        b: ColGroupDef | ColDef
    ): number {
        if (userComparator) {
            return userComparator(a.headerName, b.headerName);
        } else {
            if (a.headerName && !b.headerName) {
                return 1;
            } else if (!a.headerName && b.headerName) {
                return -1;
            }

            // slightly naff here - just to satify typescript
            // really should be &&, but if so ts complains
            // the above if/else checks would deal with either being falsy, so at this stage if either are falsy, both are
            // ..still naff though
            if (!a.headerName || !b.headerName) {
                return 0;
            }

            if (a.headerName < b.headerName) {
                return -1;
            }

            if (a.headerName > b.headerName) {
                return 1;
            }

            return 0;
        }
    }

    private merge(m1: Map<string, string[]>, m2: Map<any, any>) {
        m2.forEach((value, key) => {
            const existingList = m1.has(key) ? m1.get(key) : [];
            const updatedList = [...existingList!, ...value];
            m1.set(key, updatedList);
        });
    }

    private generateColumnGroupId(pivotKeys: string[]): string {
        const pivotCols = this.funcColsSvc.pivotCols.map((col) => col.getColId());
        return `pivotGroup_${pivotCols.join('-')}_${pivotKeys.join('-')}`;
    }

    private generateColumnId(pivotKeys: string[], measureColumnId: string) {
        const pivotCols = this.funcColsSvc.pivotCols.map((col) => col.getColId());
        return `pivot_${pivotCols.join('-')}_${pivotKeys.join('-')}_${measureColumnId}`;
    }

    /**
     * Used by the SSRM to create secondary columns from provided fields
     * @param fields
     */
    public createColDefsFromFields(fields: string[]): (ColDef | ColGroupDef)[] {
        interface UniqueValue {
            [key: string]: UniqueValue;
        }
        // tear the ids down into groups, while this could be done in-step with the next stage, the lookup is faster
        // than searching col group children array for the right group
        const uniqueValues: UniqueValue = {};
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const parts = field.split(this.fieldSeparator);

            let level: UniqueValue = uniqueValues;
            for (let p = 0; p < parts.length; p++) {
                const part = parts[p];
                if (level[part] == null) {
                    level[part] = {};
                }
                level = level[part];
            }
        }

        const uniqueValuesToGroups = (
            id: string,
            key: string,
            uniqueValues: UniqueValue,
            depth: number
        ): ColDef | ColGroupDef => {
            const children: (ColDef | ColGroupDef)[] = [];
            for (const key of Object.keys(uniqueValues)) {
                const item = uniqueValues[key];
                const child = uniqueValuesToGroups(`${id}${this.fieldSeparator}${key}`, key, item, depth + 1);
                children.push(child);
            }

            if (children.length === 0) {
                const potentialAggCol = this.colModel.getColDefCol(key);
                if (potentialAggCol) {
                    const headerName = this.colNames.getDisplayNameForColumn(potentialAggCol, 'header') ?? key;
                    const colDef = this.createColDef(potentialAggCol, headerName, undefined, false);
                    colDef.colId = id;
                    colDef.aggFunc = potentialAggCol.getAggFunc();
                    colDef.valueGetter = (params) => params.data?.[id];
                    return colDef;
                }

                const col: ColDef = {
                    colId: id,
                    headerName: key,
                    // this is to support using pinned rows, normally the data will be extracted from the aggData object using the colId
                    // however pinned rows still access the data object by field, this prevents values with dots from being treated as complex objects
                    valueGetter: (params) => params.data?.[id],
                };
                return col;
            }

            // this is a bit sketchy. As the fields can be anything we just build groups as deep as the fields go.
            // nothing says user has to give us groups the same depth.
            const collapseSingleChildren = this.gos.get('removePivotHeaderRowWhenSingleValueColumn');
            if (collapseSingleChildren && children.length === 1 && 'colId' in children[0]) {
                children[0].headerName = key;
                return children[0];
            }

            const group: ColGroupDef = {
                openByDefault: this.pivotDefaultExpanded === -1 || depth < this.pivotDefaultExpanded,
                groupId: id,
                headerName: key,
                children,
            };
            return group;
        };

        const res: (ColDef | ColGroupDef)[] = [];
        for (const key of Object.keys(uniqueValues)) {
            const item = uniqueValues[key];
            const col = uniqueValuesToGroups(key, key, item, 0);
            res.push(col);
        }
        return res;
    }
}
