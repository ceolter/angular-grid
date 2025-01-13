import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { AgColumn } from '../entities/agColumn';
import type { GetQuickFilterTextParams } from '../entities/colDef';
import type { RowNode } from '../entities/rowNode';
import { _exists } from '../utils/generic';
import { _warn } from '../validation/logging';

export type QuickFilterServiceEvent = 'quickFilterChanged';
export class QuickFilterService extends BeanStub<QuickFilterServiceEvent> implements NamedBean {
    beanName = 'quickFilter' as const;

    // the columns the quick filter should use. this will be all primary columns plus the autoGroupColumns if any exist
    private colsToUse: AgColumn[];

    private quickFilter: string | null = null;
    private quickFilterParts: string[] | null = null;
    private parser?: (quickFilter: string) => string[];
    private matcher?: (quickFilterParts: string[], rowQuickFilterAggregateText: string) => boolean;

    public postConstruct(): void {
        const resetListener = this.resetCache.bind(this);
        const gos = this.gos;
        this.addManagedEventListeners({
            columnPivotModeChanged: resetListener,
            newColumnsLoaded: resetListener,
            columnRowGroupChanged: resetListener,
            columnVisible: () => {
                if (!gos.get('includeHiddenColumnsInQuickFilter')) {
                    this.resetCache();
                }
            },
        });

        this.addManagedPropertyListener('quickFilterText', (e) => this.setFilter(e.currentValue));
        this.addManagedPropertyListeners(
            ['includeHiddenColumnsInQuickFilter', 'applyQuickFilterBeforePivotOrAgg'],
            () => this.onColumnConfigChanged()
        );

        this.quickFilter = this.parseFilter(gos.get('quickFilterText'));
        this.parser = gos.get('quickFilterParser');
        this.matcher = gos.get('quickFilterMatcher');
        this.setFilterParts();

        this.addManagedPropertyListeners(['quickFilterMatcher', 'quickFilterParser'], () => this.setParserAndMatcher());
    }

    // if we are using autoGroupCols, then they should be included for quick filter. this covers the
    // following scenarios:
    // a) user provides 'field' into autoGroupCol of normal grid, so now because a valid col to filter leafs on
    // b) using tree data and user depends on autoGroupCol for first col, and we also want to filter on this
    //    (tree data is a bit different, as parent rows can be filtered on, unlike row grouping)
    public refreshCols(): void {
        const { autoColSvc, colModel, gos, pivotResultCols } = this.beans;
        const pivotMode = colModel.isPivotMode();
        const groupAutoCols = autoColSvc?.getAutoCols();
        const providedCols = colModel.getColDefCols();

        let columnsForQuickFilter =
            (pivotMode && !gos.get('applyQuickFilterBeforePivotOrAgg')
                ? pivotResultCols?.getPivotResultCols()?.list
                : providedCols) ?? [];
        if (groupAutoCols) {
            columnsForQuickFilter = columnsForQuickFilter.concat(groupAutoCols);
        }
        this.colsToUse = gos.get('includeHiddenColumnsInQuickFilter')
            ? columnsForQuickFilter
            : columnsForQuickFilter.filter((col) => col.isVisible() || col.isRowGroupActive());
    }

    public isFilterPresent(): boolean {
        return this.quickFilter !== null;
    }

    public doesRowPass(node: RowNode): boolean {
        const usingCache = this.gos.get('cacheQuickFilter');

        if (this.matcher) {
            return this.doesRowPassMatcher(usingCache, node);
        }

        // each part must pass, if any fails, then the whole filter fails
        return this.quickFilterParts!.every((part) =>
            usingCache ? this.doesRowPassCache(node, part) : this.doesRowPassNoCache(node, part)
        );
    }

    public resetCache(): void {
        this.beans.rowModel.forEachNode((node) => (node.quickFilterAggregateText = null));
    }

    public getText(): string | undefined {
        return this.gos.get('quickFilterText');
    }

    private setFilterParts(): void {
        const { quickFilter, parser } = this;
        if (quickFilter) {
            this.quickFilterParts = parser ? parser(quickFilter) : quickFilter.split(' ');
        } else {
            this.quickFilterParts = null;
        }
    }

    private parseFilter(newFilter?: string): string | null {
        if (!_exists(newFilter)) {
            return null;
        }

        return newFilter.toUpperCase();
    }

    private setFilter(newFilter: string | undefined): void {
        if (newFilter != null && typeof newFilter !== 'string') {
            _warn(70, { newFilter });
            return;
        }

        const parsedFilter = this.parseFilter(newFilter);

        if (this.quickFilter !== parsedFilter) {
            this.quickFilter = parsedFilter;
            this.setFilterParts();
            this.dispatchLocalEvent({ type: 'quickFilterChanged' });
        }
    }

    private setParserAndMatcher(): void {
        const parser = this.gos.get('quickFilterParser');
        const matcher = this.gos.get('quickFilterMatcher');
        const hasChanged = parser !== this.parser || matcher !== this.matcher;
        this.parser = parser;
        this.matcher = matcher;
        if (hasChanged) {
            this.setFilterParts();
            this.dispatchLocalEvent({ type: 'quickFilterChanged' });
        }
    }

    private onColumnConfigChanged(): void {
        this.refreshCols();
        this.resetCache();
        if (this.isFilterPresent()) {
            this.dispatchLocalEvent({ type: 'quickFilterChanged' });
        }
    }

    private doesRowPassNoCache(node: RowNode, filterPart: string): boolean {
        return this.colsToUse.some((column) => {
            const part = this.getTextForColumn(column, node);

            return _exists(part) && part.indexOf(filterPart) >= 0;
        });
    }

    private doesRowPassCache(node: RowNode, filterPart: string): boolean {
        this.checkGenerateAggText(node);

        return node.quickFilterAggregateText!.indexOf(filterPart) >= 0;
    }

    private doesRowPassMatcher(usingCache: boolean, node: RowNode): boolean {
        let quickFilterAggregateText: string;
        if (usingCache) {
            this.checkGenerateAggText(node);
            quickFilterAggregateText = node.quickFilterAggregateText!;
        } else {
            quickFilterAggregateText = this.getAggText(node);
        }
        const { quickFilterParts, matcher } = this;
        return matcher!(quickFilterParts!, quickFilterAggregateText);
    }

    private checkGenerateAggText(node: RowNode): void {
        if (!node.quickFilterAggregateText) {
            node.quickFilterAggregateText = this.getAggText(node);
        }
    }

    private getTextForColumn(column: AgColumn, node: RowNode): string {
        let value = this.beans.filterValueSvc!.getValue(column, node);
        const colDef = column.getColDef();

        if (colDef.getQuickFilterText) {
            const params: GetQuickFilterTextParams = this.gos.addGridCommonParams({
                value,
                node,
                data: node.data,
                column,
                colDef,
            });

            value = colDef.getQuickFilterText(params);
        }

        return _exists(value) ? value.toString().toUpperCase() : null;
    }

    private getAggText(node: RowNode): string {
        const stringParts: string[] = [];

        this.colsToUse.forEach((column) => {
            const part = this.getTextForColumn(column, node);

            if (_exists(part)) {
                stringParts.push(part);
            }
        });

        return stringParts.join('\n');
    }
}
