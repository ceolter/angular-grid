import type { AgCartesianAxisType } from 'ag-charts-types';

import type {
    AgColumn,
    BeanCollection,
    CellRange,
    ChartType,
    IAggFunc,
    IRangeService,
    PartialCellRange,
    SeriesChartType,
    SeriesGroupType,
} from 'ag-grid-community';
import { BeanStub, CellRangeType } from 'ag-grid-community';

import type { ChartDatasourceParams } from '../datasource/chartDatasource';
import { ChartDatasource } from '../datasource/chartDatasource';
import { ChartColumnService } from '../services/chartColumnService';
import type { ChartTranslationService } from '../services/chartTranslationService';
import { getMaxNumSeries, getSeriesType, isComboChart, isHierarchical } from '../utils/seriesTypeMapper';
import { ComboChartModel } from './comboChartModel';

export interface ColState {
    column?: AgColumn;
    colId: string;
    displayName: string | null;
    selected?: boolean;
    order: number;
}

export interface ChartModelParams {
    chartId: string;
    pivotChart?: boolean;
    chartType: ChartType;
    chartThemeName: string;
    switchCategorySeries?: boolean;
    aggFunc?: string | IAggFunc;
    cellRange: PartialCellRange;
    suppressChartRanges?: boolean;
    unlinkChart?: boolean;
    crossFiltering?: boolean;
    seriesChartTypes?: SeriesChartType[];
    seriesGroupType?: SeriesGroupType;
}

export const DEFAULT_CHART_CATEGORY = 'AG-GRID-DEFAULT-CATEGORY';

export class ChartDataModel extends BeanStub {
    private rangeSvc: IRangeService;
    private chartTranslationService: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.rangeSvc = beans.rangeSvc!;
        this.chartTranslationService = beans.chartTranslationService as ChartTranslationService;
    }

    public readonly params: ChartModelParams;

    // this is used to associate chart ranges with charts
    public readonly chartId: string;

    public suppressChartRanges: boolean;
    public switchCategorySeries: boolean;
    public aggFunc?: string | IAggFunc;
    public pivotChart: boolean;
    public categoryAxisType?: AgCartesianAxisType;

    public chartType: ChartType;
    public chartThemeName: string;
    public unlinked = false;
    public chartData: any[] = [];
    public groupChartData: any[] | undefined;
    public valueColState: ColState[] = [];
    public dimensionColState: ColState[] = [];
    public colNames: { [p: string]: string[] } = {};

    public valueCellRange?: CellRange;
    public dimensionCellRange?: CellRange;

    public comboChartModel: ComboChartModel;
    private chartColumnService: ChartColumnService;
    private datasource: ChartDatasource;

    public referenceCellRange: PartialCellRange;
    public suppliedCellRange: PartialCellRange;

    public crossFiltering = false;

    private grouping = false;

    public seriesGroupType?: SeriesGroupType;

    public constructor(params: ChartModelParams) {
        super();

        this.params = params;
        this.chartId = params.chartId;
        this.setParams(params);
    }

    private setParams(params: ChartModelParams): void {
        const {
            chartType,
            pivotChart,
            chartThemeName,
            switchCategorySeries,
            aggFunc,
            cellRange,
            suppressChartRanges,
            unlinkChart,
            crossFiltering,
            seriesGroupType,
        } = params;
        this.chartType = chartType;
        this.pivotChart = pivotChart ?? false;
        this.chartThemeName = chartThemeName;
        this.switchCategorySeries = !!switchCategorySeries;
        this.aggFunc = aggFunc;
        this.referenceCellRange = cellRange;
        this.suppliedCellRange = cellRange;
        this.suppressChartRanges = suppressChartRanges ?? false;
        this.unlinked = !!unlinkChart;
        this.crossFiltering = !!crossFiltering;
        this.seriesGroupType = seriesGroupType;
    }

    public postConstruct(): void {
        this.datasource = this.createManagedBean(new ChartDatasource());
        this.chartColumnService = this.createManagedBean(new ChartColumnService());
        this.comboChartModel = this.createManagedBean(new ComboChartModel(this));
        this.updateCellRanges({ setColsFromRange: true });
        this.updateData();
    }

    public updateModel(params: ChartModelParams): void {
        const { cellRange, seriesChartTypes } = params;

        if (cellRange !== this.suppliedCellRange) {
            this.dimensionCellRange = undefined;
            this.valueCellRange = undefined;
        }

        this.setParams(params);

        this.updateSelectedDimensions(cellRange?.columns as AgColumn[]);
        this.updateCellRanges({ setColsFromRange: true });

        const shouldUpdateComboModel = this.isComboChart() || seriesChartTypes;
        if (shouldUpdateComboModel) {
            this.comboChartModel.update(seriesChartTypes);
        }

        if (!this.unlinked) {
            this.updateData();
        }
    }

    public updateCellRanges(params?: {
        updatedColState?: ColState;
        resetOrder?: boolean;
        maintainColState?: boolean;
        setColsFromRange?: boolean;
    }): void {
        const { updatedColState, resetOrder, maintainColState, setColsFromRange } = params ?? {};
        if (this.valueCellRange) {
            this.referenceCellRange = this.valueCellRange;
        }

        const { dimensionCols, valueCols } = this.chartColumnService.getChartColumns();
        const allColsFromRanges = this.getAllColumnsFromRanges();

        if (updatedColState) {
            this.updateColumnState(updatedColState, resetOrder);
        }

        this.setDimensionCellRange(dimensionCols, allColsFromRanges, updatedColState);
        this.setValueCellRange(valueCols, allColsFromRanges, setColsFromRange);

        if (!updatedColState && !maintainColState) {
            this.resetColumnState();
            // dimension / category cell range could be out of sync after resetting column state when row grouping
            this.syncDimensionCellRange();
        }

        this.comboChartModel.updateSeriesChartTypes();
    }

    public updateData(): void {
        const { startRow, endRow } = this.getRowIndexes();

        if (this.pivotChart) {
            this.resetColumnState();
        }

        this.grouping = this.isGrouping();

        const params: ChartDatasourceParams = {
            aggFunc: this.aggFunc,
            dimensionCols: this.getSelectedDimensions(),
            grouping: this.grouping,
            pivoting: this.isPivotActive(),
            crossFiltering: this.crossFiltering,
            valueCols: this.getSelectedValueCols(),
            startRow,
            endRow,
            isScatter: ['scatter', 'bubble'].includes(this.chartType),
        };

        const { chartData, colNames, groupChartData } = this.datasource.getData(params);

        this.chartData = chartData;
        this.groupChartData = groupChartData;
        this.colNames = colNames;
        this.categoryAxisType = undefined;
    }

    public isGrouping(): boolean {
        const usingTreeData = this.gos.get('treeData');
        const groupedCols = usingTreeData ? null : this.chartColumnService.getRowGroupColumns();
        const isGroupActive = usingTreeData || (groupedCols && groupedCols.length > 0);

        // charts only group when the selected category is a group column
        const colIds = this.getSelectedDimensions().map(({ colId }) => colId);
        const displayedGroupCols = this.chartColumnService.getGroupDisplayColumns();
        const groupDimensionSelected = displayedGroupCols
            .map((col) => col.getColId())
            .some((id) => colIds.includes(id));
        return !!isGroupActive && groupDimensionSelected;
    }

    public getSelectedValueCols(): AgColumn[] {
        return this.valueColState.filter((cs) => cs.selected).map((cs) => cs.column!);
    }

    public getSelectedDimensions(): ColState[] {
        return this.dimensionColState.filter((cs) => cs.selected);
    }

    public getColDisplayName(col: AgColumn, includePath?: boolean): string | null {
        return this.chartColumnService.getColDisplayName(col, includePath);
    }

    public isPivotMode(): boolean {
        return this.chartColumnService.isPivotMode();
    }

    public getChartDataType(colId: string): string | undefined {
        const column = this.chartColumnService.getColumn(colId);
        return column ? column.getColDef().chartDataType : undefined;
    }

    private isPivotActive(): boolean {
        return this.chartColumnService.isPivotActive();
    }

    private createCellRange(type: CellRangeType, ...columns: AgColumn[]): CellRange {
        return {
            id: this.chartId, // set range ID to match chart ID so we can identify changes to the ranges for this chart
            startRow: this.referenceCellRange.startRow,
            endRow: this.referenceCellRange.endRow,
            columns,
            startColumn:
                type === CellRangeType.DIMENSION || this.referenceCellRange.startColumn == null
                    ? columns[0]
                    : this.referenceCellRange.startColumn,
            type,
        };
    }

    private getAllColumnsFromRanges(): Set<AgColumn> {
        if (this.pivotChart) {
            return new Set(this.chartColumnService.getAllDisplayedColumns());
        }

        const columns = this.dimensionCellRange || this.valueCellRange ? [] : this.referenceCellRange.columns;

        if (this.dimensionCellRange) {
            columns.push(...this.dimensionCellRange.columns);
        }

        if (this.valueCellRange) {
            columns.push(...this.valueCellRange.columns);
        }

        return new Set(columns as AgColumn[]);
    }

    private getRowIndexes(): { startRow: number; endRow: number } {
        let startRow = 0,
            endRow = 0;
        const { rangeSvc, valueCellRange, dimensionCellRange } = this;

        // Not all chart types require a value series (e.g. hierarchical charts),
        // so fall back to using the dimension cell range for inferring row indices
        const cellRange = valueCellRange || dimensionCellRange;

        if (rangeSvc && cellRange) {
            startRow = rangeSvc.getRangeStartRow(cellRange).rowIndex;

            // when the last row the cell range is a pinned 'bottom' row, the `endRow` index is set to -1 which results
            // in the ChartDatasource processing all non pinned rows from the `startRow` index.
            const endRowPosition = rangeSvc.getRangeEndRow(cellRange);
            endRow = endRowPosition.rowPinned === 'bottom' ? -1 : endRowPosition.rowIndex;
        }

        return { startRow, endRow };
    }

    private resetColumnState(): void {
        const { dimensionCols, valueCols } = this.chartColumnService.getChartColumns();
        const allCols = this.getAllColumnsFromRanges();
        const isInitialising = this.valueColState.length < 1;

        this.dimensionColState = [];
        this.valueColState = [];

        const supportsMultipleDimensions = isHierarchical(getSeriesType(this.chartType));
        let hasSelectedDimension = false;
        let order = 1;

        const aggFuncDimension = this.suppliedCellRange.columns[0]; //TODO

        dimensionCols.forEach((column) => {
            const isAutoGroupCol = column.getColId() === 'ag-Grid-AutoColumn';

            let selected = false;
            if (this.crossFiltering && this.aggFunc) {
                if (aggFuncDimension.getColId() === column.getColId()) {
                    selected = true;
                }
            } else {
                selected = isAutoGroupCol
                    ? true
                    : (!hasSelectedDimension || supportsMultipleDimensions) && allCols.has(column);
            }

            this.dimensionColState.push({
                column,
                colId: column.getColId(),
                displayName: this.getColDisplayName(column),
                selected,
                order: order++,
            });

            if (selected) {
                hasSelectedDimension = true;
            }
        });

        const defaultCategory = {
            colId: DEFAULT_CHART_CATEGORY,
            displayName: this.chartTranslationService.translate('defaultCategory'),
            selected: !hasSelectedDimension, // if no dimensions in range select the default
            order: 0,
        };

        this.dimensionColState.unshift(defaultCategory);

        const valueColumnsFromReferenceRange = (this.referenceCellRange.columns as AgColumn[]).filter((c) =>
            valueCols.has(c)
        );

        valueCols.forEach((column) => {
            // first time the value cell range is set, preserve the column order from the supplied range
            if (isInitialising && this.referenceCellRange.columns.includes(column)) {
                column = valueColumnsFromReferenceRange.shift()!;
            }

            this.valueColState.push({
                column,
                colId: column.getColId(),
                displayName: this.getColDisplayName(column),
                selected: allCols.has(column),
                order: order++,
            });
        });
    }

    private updateColumnState(updatedCol: ColState, resetOrder?: boolean): void {
        const idsMatch = (cs: ColState) => cs.colId === updatedCol.colId;
        const { dimensionColState, valueColState } = this;

        // Determine whether the specified column is a dimension or value column
        const matchedDimensionColState = dimensionColState.find(idsMatch);
        const matchedValueColState = valueColState.find(idsMatch);

        if (matchedDimensionColState) {
            // For non-hierarchical chart types, only one dimension can be selected
            const supportsMultipleDimensions = isHierarchical(getSeriesType(this.chartType));
            if (!supportsMultipleDimensions) {
                // Determine which column should end up selected, if any
                const selectedColumnState = updatedCol.selected
                    ? matchedDimensionColState
                    : dimensionColState
                          .filter((cs) => cs !== matchedDimensionColState)
                          .find(({ selected }) => selected);
                // Update the selection state of all dimension columns
                dimensionColState.forEach((cs) => (cs.selected = cs === selectedColumnState));
            } else {
                // Update the selection state of the specified dimension column
                matchedDimensionColState.selected = updatedCol.selected;
            }
        } else if (matchedValueColState) {
            // Update the selection state of the specified value column
            matchedValueColState.selected = updatedCol.selected;
        }

        const allColumns = [...dimensionColState, ...valueColState];
        const orderedColIds: string[] = [];

        if (!resetOrder) {
            // calculate new order
            allColumns.forEach((col: ColState, i: number) => {
                if (i === updatedCol.order) {
                    orderedColIds.push(updatedCol.colId);
                }

                if (col.colId !== updatedCol.colId) {
                    orderedColIds.push(col.colId);
                }
            });

            // update col state with new order
            allColumns.forEach((col) => {
                const order = orderedColIds.indexOf(col.colId);
                col.order = order >= 0 ? orderedColIds.indexOf(col.colId) : allColumns.length - 1;
            });
        }

        this.reorderColState();
    }

    private reorderColState(): void {
        const ascColStateOrder = (a: ColState, b: ColState) => a.order - b.order;
        this.dimensionColState.sort(ascColStateOrder);
        this.valueColState.sort(ascColStateOrder);
    }

    private setDimensionCellRange(
        dimensionCols: Set<AgColumn>,
        colsInRange: Set<AgColumn>,
        updatedColState?: ColState
    ): void {
        this.dimensionCellRange = undefined;
        const supportsMultipleDimensions = isHierarchical(getSeriesType(this.chartType));

        if (!updatedColState && !this.dimensionColState.length) {
            const selectedCols = new Array<AgColumn>();
            // use first dimension column in range by default, or all dimension columns for hierarchical charts
            dimensionCols.forEach((col) => {
                if ((selectedCols.length > 0 && !supportsMultipleDimensions) || !colsInRange.has(col)) {
                    return;
                }
                selectedCols.push(col);
            });
            if (selectedCols.length > 0) {
                this.dimensionCellRange = this.createCellRange(CellRangeType.DIMENSION, ...selectedCols);
            }
            return;
        }

        let selectedDimensionColStates = updatedColState ? [updatedColState] : [];
        if (this.crossFiltering && this.aggFunc) {
            const aggFuncDimension = this.suppliedCellRange.columns[0]; //TODO
            selectedDimensionColStates = this.dimensionColState.filter(
                (cs) => cs.colId === aggFuncDimension.getColId()
            );
        } else if (
            supportsMultipleDimensions ||
            selectedDimensionColStates.length === 0 ||
            selectedDimensionColStates.some(({ column }) => !column || !dimensionCols.has(column))
        ) {
            selectedDimensionColStates = this.dimensionColState.filter((cs) => cs.selected);
        }

        const isDefaultCategory =
            selectedDimensionColStates.length === 1
                ? selectedDimensionColStates[0].colId === DEFAULT_CHART_CATEGORY
                : false;
        const selectedColumns = selectedDimensionColStates
            .map(({ column }) => column)
            .filter((value): value is NonNullable<typeof value> => value != null);
        if (selectedColumns.length > 0 && !isDefaultCategory) {
            this.dimensionCellRange = this.createCellRange(CellRangeType.DIMENSION, ...selectedColumns);
        }
    }

    private setValueCellRange(valueCols: Set<AgColumn>, colsInRange: Set<AgColumn>, setColsFromRange?: boolean): void {
        this.valueCellRange = undefined;

        const selectedValueCols: AgColumn[] = [];

        const maxSelection = getMaxNumSeries(this.chartType);
        let numSelected = 0;

        valueCols.forEach((col) => {
            if (setColsFromRange) {
                if ((maxSelection == null || numSelected < maxSelection) && colsInRange.has(col)) {
                    selectedValueCols.push(col);
                    numSelected++;
                }
            } else {
                if (this.valueColState.some((colState) => colState.selected && colState.colId === col.getColId())) {
                    selectedValueCols.push(col);
                }
            }
        });

        if (selectedValueCols.length > 0) {
            let orderedColIds: string[] = [];

            if (this.valueColState.length > 0) {
                orderedColIds = this.valueColState.map((c) => c.colId);
            } else {
                colsInRange.forEach((c) => orderedColIds.push(c.getColId()));
            }

            selectedValueCols.sort((a, b) => orderedColIds.indexOf(a.getColId()) - orderedColIds.indexOf(b.getColId()));

            this.valueCellRange = this.createCellRange(CellRangeType.VALUE, ...selectedValueCols);
        }
    }

    public resetCellRanges(dimension: boolean, value: boolean): void {
        if (!dimension && !value) {
            return;
        }
        const { dimensionCols, valueCols } = this.chartColumnService.getChartColumns();
        const allColsFromRanges = this.getAllColumnsFromRanges();
        if (dimension) {
            this.setDimensionCellRange(dimensionCols, allColsFromRanges);
        }
        if (value) {
            this.setValueCellRange(valueCols, allColsFromRanges);
        }
    }

    private updateSelectedDimensions(columns: AgColumn[]): void {
        const colIdSet = new Set(columns.map((column) => column.getColId()));

        // For non-hierarchical chart types, only one dimension can be selected
        const supportsMultipleDimensions = isHierarchical(getSeriesType(this.chartType));
        if (!supportsMultipleDimensions) {
            // Determine which column should end up selected, if any
            // if no dimension found in supplied columns use the default category (always index = 0)
            const foundColState =
                this.dimensionColState.find((colState) => colIdSet.has(colState.colId)) || this.dimensionColState[0];
            const selectedColumnId = foundColState.colId;
            // Update the selection state of all dimension columns
            this.dimensionColState = this.dimensionColState.map((colState) => ({
                ...colState,
                selected: colState.colId === selectedColumnId,
            }));
        } else {
            // Update the selection state of all dimension columns, selecting only the provided columns from the chart model
            const foundColStates = this.dimensionColState.filter((colState) => colIdSet.has(colState.colId));
            const selectedColumnIds = new Set(foundColStates.map((colState) => colState.colId));
            this.dimensionColState = this.dimensionColState.map((colState) => ({
                ...colState,
                selected: selectedColumnIds.has(colState.colId),
            }));
        }
    }

    private syncDimensionCellRange() {
        const selectedDimensions = this.getSelectedDimensions();
        if (selectedDimensions.length === 0) return;
        const selectedCols = selectedDimensions
            .map(({ column }) => column)
            .filter((value): value is NonNullable<typeof value> => value != null);
        if (selectedCols.length > 0) {
            this.dimensionCellRange = this.createCellRange(CellRangeType.DIMENSION, ...selectedCols);
        }
    }

    public isComboChart(chartType?: ChartType): boolean {
        return isComboChart(chartType ?? this.chartType);
    }
}
