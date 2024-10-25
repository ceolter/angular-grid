import { _ModuleSupport, _Theme } from 'ag-charts-community';
import type { AgCartesianAxisType, AgChartThemeOverrides, AgChartThemePalette } from 'ag-charts-types';

import type {
    BeanCollection,
    CellRange,
    CellRangeParams,
    ChartModel,
    ChartModelType,
    ChartType,
    IAggFunc,
    IRangeService,
    PartialCellRange,
    SeriesChartType,
    SeriesGroupType,
    UpdateChartParams,
    UpdateCrossFilterChartParams,
    UpdateRangeChartParams,
} from 'ag-grid-community';
import { BeanStub, _warn } from 'ag-grid-community';

import type { ChartProxy, FieldDefinition, UpdateParams } from './chartProxies/chartProxy';
import { isStockTheme } from './chartProxies/chartTheme';
import type { ChartDataModel, ChartModelParams, ColState } from './model/chartDataModel';
import { DEFAULT_CHART_CATEGORY } from './model/chartDataModel';
import { ChartParamsValidator } from './utils/chartParamsValidator';
import type { ChartSeriesType } from './utils/seriesTypeMapper';
import {
    getMaxNumCategories,
    getMaxNumSeries,
    getSeriesType,
    supportsInvertedCategorySeries,
} from './utils/seriesTypeMapper';

export const DEFAULT_THEMES = ['ag-default', 'ag-material', 'ag-sheets', 'ag-polychroma', 'ag-vivid'];

export type ChartControllerEvent =
    | 'chartUpdated'
    | 'chartApiUpdate'
    | 'chartModelUpdate'
    | 'chartTypeChanged'
    | 'chartSeriesChartTypeChanged'
    | 'chartLinkedChanged';
export class ChartController extends BeanStub<ChartControllerEvent> {
    private rangeSvc: IRangeService;

    public wireBeans(beans: BeanCollection) {
        this.rangeSvc = beans.rangeSvc!;
    }

    private chartProxy: ChartProxy;

    public constructor(private readonly model: ChartDataModel) {
        super();
    }

    public postConstruct(): void {
        this.setChartRange();

        if (this.model.unlinked) {
            if (this.rangeSvc) {
                this.rangeSvc.setCellRanges([]);
            }
        }
        const listener = this.updateForGridChange.bind(this, {});
        this.addManagedEventListeners({
            cellSelectionChanged: (event) => {
                if (event.id && event.id === this.model.chartId) {
                    this.updateForRangeChange();
                }
            },
            columnMoved: listener,
            columnPinned: listener,
            columnVisible: listener,
            columnRowGroupChanged: listener,
            modelUpdated: listener,
            cellValueChanged: this.updateForDataChange.bind(this),
        });
    }

    public update(params: UpdateChartParams): boolean {
        if (!this.validUpdateType(params)) return false;
        const validationResult = ChartParamsValidator.validateUpdateParams(params);
        if (!validationResult) return false;
        const validParams = validationResult === true ? params : validationResult;
        this.applyValidatedChartParams(validParams);
        return true;
    }

    private applyValidatedChartParams(params: UpdateChartParams): void {
        const { chartId, chartType, chartThemeName, unlinkChart } = params;

        // create a common base for the chart model parameters (this covers pivot chart updates)
        const common = {
            chartId: chartId,
            pivotChart: this.model.pivotChart,
            chartType: chartType ?? this.model.chartType,
            chartThemeName: chartThemeName ?? this.model.chartThemeName,
            unlinkChart: unlinkChart ?? this.model.unlinked,
            cellRange: this.model.suppliedCellRange,
            switchCategorySeries: this.model.switchCategorySeries,
            aggFunc: this.model.aggFunc,
            seriesChartTypes: undefined,
            suppressChartRanges: false,
            crossFiltering: false,
        };

        const chartModelParams: ChartModelParams = { ...common };

        // modify the chart model properties based on the type of update
        switch (params.type) {
            case 'rangeChartUpdate':
                chartModelParams.cellRange = this.createCellRange(params) ?? this.model.suppliedCellRange;
                chartModelParams.switchCategorySeries = params.switchCategorySeries ?? this.model.switchCategorySeries;
                chartModelParams.aggFunc = params.aggFunc ?? this.model.aggFunc;
                chartModelParams.seriesChartTypes = params.seriesChartTypes;
                chartModelParams.suppressChartRanges = params.suppressChartRanges ?? this.model.suppressChartRanges;
                chartModelParams.seriesGroupType = params.seriesGroupType ?? this.model.seriesGroupType;
                break;
            case 'crossFilterChartUpdate':
                chartModelParams.cellRange = this.createCellRange(params) ?? this.model.suppliedCellRange;
                chartModelParams.switchCategorySeries = false;
                chartModelParams.aggFunc = params.aggFunc ?? this.model.aggFunc;
                chartModelParams.crossFiltering = true;
                chartModelParams.suppressChartRanges = params.suppressChartRanges ?? this.model.suppressChartRanges;
                break;
            case 'pivotChartUpdate':
                chartModelParams.switchCategorySeries = false;
                break;
        }

        this.model.updateModel(chartModelParams);

        // if the chart should be unlinked or chart ranges suppressed, remove all cell ranges; otherwise, set the chart range
        const removeChartCellRanges = chartModelParams.unlinkChart || chartModelParams.suppressChartRanges;
        removeChartCellRanges ? this.rangeSvc?.setCellRanges([]) : this.setChartRange();
    }

    public updateForGridChange(params?: { maintainColState?: boolean; setColsFromRange?: boolean }): void {
        if (this.model.unlinked) {
            return;
        }

        const { maintainColState, setColsFromRange } = params ?? {};

        this.model.updateCellRanges({ maintainColState, setColsFromRange });
        this.model.updateData();
        this.setChartRange();
    }

    public updateForDataChange(): void {
        if (this.model.unlinked) {
            return;
        }

        this.model.updateData();
        this.raiseChartModelUpdateEvent();
    }

    public updateForRangeChange(): void {
        this.updateForGridChange({ setColsFromRange: true });
        this.raiseChartRangeSelectionChangedEvent();
    }

    public updateForPanelChange(params: {
        updatedColState: ColState;
        resetOrder?: boolean;
        skipAnimation?: boolean;
    }): void {
        this.model.updateCellRanges(params);
        this.model.updateData();
        if (params.skipAnimation) {
            this.getChartProxy().getChartRef().skipAnimations();
        }
        this.setChartRange();
        this.raiseChartRangeSelectionChangedEvent();
    }

    public updateThemeOverrides(updatedOverrides: AgChartThemeOverrides): void {
        this.chartProxy.updateThemeOverrides(updatedOverrides);
    }

    public getChartUpdateParams(updatedOverrides?: AgChartThemeOverrides): UpdateParams {
        const selectedCols = this.getSelectedValueColState();
        const fields = selectedCols.map((c) => ({ colId: c.colId, displayName: c.displayName }));
        const data = this.getChartData();
        const selectedDimensions = this.getSelectedDimensions();

        const params: UpdateParams = {
            data,
            groupData: this.model.groupChartData,
            grouping: this.isGrouping(),
            categories: selectedDimensions.map((selectedDimension) => ({
                id: selectedDimension.colId,
                name: selectedDimension.displayName!,
                chartDataType: this.model.categoryAxisType ?? this.model.getChartDataType(selectedDimension.colId),
            })),
            fields,
            chartId: this.getChartId(),
            getCrossFilteringContext: () => ({ lastSelectedChartId: 'xxx' }), //this.params.crossFilteringContext, //TODO
            seriesChartTypes: this.getSeriesChartTypes(),
            updatedOverrides: updatedOverrides,
            seriesGroupType: this.model.seriesGroupType,
        };

        return this.isCategorySeriesSwitched() ? this.invertCategorySeriesParams(params) : params;
    }

    private invertCategorySeriesParams(params: UpdateParams): UpdateParams {
        const [category] = params.categories;
        // Create a single synthetic output category that will contain the series name values
        const categories = [{ id: DEFAULT_CHART_CATEGORY, name: '' }];
        // Create an output series corresponding to each row in the input data
        const fields = params.data.map((value, index): FieldDefinition => {
            const categoryKey = `${category.id}:${index}`;
            const categoryValue = value[category.id];
            const seriesLabel = categoryValue == null ? '' : String(categoryValue);
            return { colId: categoryKey, displayName: seriesLabel };
        });
        // Create an output data row corresponding to each selected series column
        const data = params.fields.map((field) => {
            // Create a new output row labeled with the series column name
            const row: Record<PropertyKey, any> = {
                [DEFAULT_CHART_CATEGORY]: field.displayName,
            };
            // Append fields corresponding to each row in the input data
            for (const [index, value] of params.data.entries()) {
                const categoryKey = `${category.id}:${index}`;
                const seriesLabelValue = value[field.colId];
                row[categoryKey] = seriesLabelValue;
            }
            return row;
        });
        return {
            ...params,
            categories,
            fields,
            data,
        };
    }

    public getChartModel(): ChartModel {
        const modelType: ChartModelType = this.model.pivotChart ? 'pivot' : 'range';

        const seriesChartTypes = this.isComboChart() ? this.model.comboChartModel.seriesChartTypes : undefined;

        return {
            modelType,
            chartId: this.model.chartId,
            chartType: this.model.chartType,
            chartThemeName: this.getChartThemeName(),
            chartOptions: this.chartProxy.getChartThemeOverrides(),
            chartPalette: this.chartProxy.getChartPalette(),
            cellRange: this.getCellRangeParams(),
            switchCategorySeries: this.model.switchCategorySeries,
            suppressChartRanges: this.model.suppressChartRanges,
            aggFunc: this.model.aggFunc,
            unlinkChart: this.model.unlinked,
            seriesChartTypes,
            seriesGroupType: this.model.seriesGroupType,
        };
    }

    public getChartId(): string {
        return this.model.chartId;
    }

    public getChartData(): any[] {
        return this.model.chartData;
    }

    public getChartType(): ChartType {
        return this.model.chartType;
    }

    public setChartType(chartType: ChartType): void {
        this.updateMultiSeriesAndCategory(this.model.chartType, chartType);

        this.model.chartType = chartType;

        this.model.comboChartModel.updateSeriesChartTypes();

        // Reset the inverted category/series toggle whenever the chart type changes
        this.model.switchCategorySeries = false;

        this.model.categoryAxisType = undefined;

        this.model.seriesGroupType = undefined;

        this.raiseChartModelUpdateEvent();
        this.raiseChartOptionsChangedEvent();
    }

    public isCategorySeriesSwitched(): boolean {
        return this.model.switchCategorySeries && !this.model.isGrouping();
    }

    public switchCategorySeries(inverted: boolean): void {
        if (!supportsInvertedCategorySeries(this.getChartType())) return;
        this.model.switchCategorySeries = inverted;
        this.raiseChartModelUpdateEvent();
    }

    public getAggFunc(): string | IAggFunc | undefined {
        return this.model.aggFunc;
    }

    public setAggFunc(value: string | IAggFunc | undefined, silent?: boolean): void {
        if (this.model.aggFunc === value) return;
        this.model.aggFunc = value;
        if (silent) return;
        this.model.updateData();
        this.raiseChartModelUpdateEvent();
    }

    private updateMultiSeriesAndCategory(previousChartType: ChartType, chartType: ChartType): void {
        // If we are changing from a multi-category/series chart type to a single-category/series chart type,
        // ensure that only the allowed number of selected category/series column remain selected
        const updateForMax = (columns: ColState[], maxNum: number) => {
            let numSelected = 0;
            for (const colState of columns) {
                if (!colState.selected) continue;
                if (numSelected >= maxNum) {
                    colState.selected = false;
                } else {
                    numSelected++;
                }
            }
            if (numSelected === 0) {
                columns[0].selected = true;
            }
        };

        const maxNumDimensions = getMaxNumCategories(chartType);
        const maxNumSeries = getMaxNumSeries(chartType);
        const updateDimensionColState =
            maxNumDimensions != null && (getMaxNumCategories(previousChartType) ?? 100) > (maxNumDimensions ?? 100);
        const updateValueColState =
            maxNumSeries != null && (getMaxNumSeries(previousChartType) ?? 100) > (maxNumSeries ?? 100);
        if (updateDimensionColState) {
            updateForMax(this.model.dimensionColState, maxNumDimensions);
        }
        if (updateValueColState) {
            updateForMax(this.model.valueColState, maxNumSeries);
        }
        if (updateDimensionColState || updateValueColState) {
            this.model.resetCellRanges(updateDimensionColState, updateValueColState);
            this.setChartRange(true);
        }
    }

    public setChartThemeName(chartThemeName: string, silent?: boolean): void {
        this.model.chartThemeName = chartThemeName;
        if (!silent) {
            this.raiseChartModelUpdateEvent();
            this.raiseChartOptionsChangedEvent();
        }
    }

    public getChartThemeName(): string {
        return this.model.chartThemeName;
    }

    public isPivotChart(): boolean {
        return this.model.pivotChart;
    }

    public isPivotMode(): boolean {
        return this.model.isPivotMode();
    }

    public isGrouping(): boolean {
        return this.model.isGrouping();
    }

    public isCrossFilterChart(): boolean {
        return this.model.crossFiltering;
    }

    public getThemeNames(): string[] {
        return this.gos.get('chartThemes') || DEFAULT_THEMES;
    }

    public getThemes(): _Theme.ChartTheme[] {
        const themeNames = this.getThemeNames();

        return themeNames.map((themeName) => {
            const stockTheme = isStockTheme(themeName);
            const theme = stockTheme ? themeName : this.chartProxy.lookupCustomChartTheme(themeName);
            return _Theme.getChartTheme(theme);
        });
    }

    public getPalettes(): AgChartThemePalette[] {
        const themes = this.getThemes();

        return themes.map((theme) => {
            return theme.palette;
        });
    }

    public getThemeTemplateParameters(): Map<any, any>[] {
        const themes = this.getThemes();

        return themes.map((theme) => {
            return theme.getTemplateParameters();
        });
    }

    public getValueColState(): ColState[] {
        return this.model.valueColState.map(this.displayNameMapper.bind(this));
    }

    public getSelectedValueColState(): { colId: string; displayName: string | null }[] {
        return this.getValueColState().filter((cs) => cs.selected);
    }

    public getSelectedDimensions(): ColState[] {
        return this.model.getSelectedDimensions();
    }

    private displayNameMapper(col: ColState): ColState {
        const { column } = col;
        if (column) {
            col.displayName = this.model.getColDisplayName(column, this.model.isPivotMode());
        } else {
            const colNames = this.model.colNames[col.colId];
            col.displayName = colNames ? colNames.join(' - ') : this.model.getColDisplayName(column!);
        }
        return col;
    }

    public getColStateForMenu(): { dimensionCols: ColState[]; valueCols: ColState[] } {
        return { dimensionCols: this.model.dimensionColState, valueCols: this.getValueColState() };
    }

    public setChartRange(silent = false): void {
        if (this.rangeSvc && !this.model.suppressChartRanges && !this.model.unlinked) {
            this.rangeSvc.setCellRanges(this.getCellRanges());
        }

        if (!silent) {
            this.raiseChartModelUpdateEvent();
        }
    }

    public detachChartRange(): void {
        // when chart is detached it won't listen to changes from the grid
        this.model.unlinked = !this.model.unlinked;

        if (this.model.unlinked) {
            // remove range from grid
            if (this.rangeSvc) {
                this.rangeSvc.setCellRanges([]);
            }
        } else {
            // update chart data may have changed
            this.updateForGridChange();
        }
        this.dispatchLocalEvent({ type: 'chartLinkedChanged' });
    }

    public setChartProxy(chartProxy: ChartProxy): void {
        this.chartProxy = chartProxy;
    }

    public getChartProxy(): ChartProxy {
        return this.chartProxy;
    }

    public isActiveXYChart(): boolean {
        return ['scatter', 'bubble'].includes(this.getChartType());
    }

    public isChartLinked(): boolean {
        return !this.model.unlinked;
    }

    public customComboExists(): boolean {
        const savedCustomSeriesChartTypes = this.model.comboChartModel.savedCustomSeriesChartTypes;
        return savedCustomSeriesChartTypes && savedCustomSeriesChartTypes.length > 0;
    }

    public getSeriesChartTypes(): SeriesChartType[] {
        return this.model.comboChartModel.seriesChartTypes;
    }

    public isComboChart(chartType?: ChartType): boolean {
        return this.model.isComboChart(chartType);
    }

    public updateSeriesChartType(colId: string, chartType?: ChartType, secondaryAxis?: boolean): void {
        const seriesChartType = this.model.comboChartModel.seriesChartTypes.find((s) => s.colId === colId);
        if (seriesChartType) {
            // once a combo chart has been modified it is now a 'customCombo' chart
            const updateChartType = this.model.chartType !== 'customCombo';
            if (updateChartType) {
                this.model.chartType = 'customCombo';
            }

            const prevSeriesChartType = seriesChartType.chartType;
            if (chartType != null) {
                seriesChartType.chartType = chartType;
            }

            if (secondaryAxis != null) {
                seriesChartType.secondaryAxis = secondaryAxis;
            }

            // replace existing custom series types with this latest version
            this.model.comboChartModel.savedCustomSeriesChartTypes = this.model.comboChartModel.seriesChartTypes;

            // series chart types can be modified, i.e. column chart types should be moved to primary axis
            this.model.comboChartModel.updateSeriesChartTypes();

            this.updateForDataChange();

            if (updateChartType) {
                // update the settings panel by raising an 'chartTypeChanged' event
                this.dispatchLocalEvent({
                    type: 'chartTypeChanged',
                });
            }

            if (prevSeriesChartType !== chartType) {
                // update the format panel by raising an chartSeriesChartTypeChanged event
                this.dispatchLocalEvent({
                    type: 'chartSeriesChartTypeChanged',
                });
            }

            this.raiseChartOptionsChangedEvent();
        }
    }

    public getActiveSeriesChartTypes(): SeriesChartType[] {
        const selectedColIds = this.getSelectedValueColState().map((c) => c.colId);
        return this.getSeriesChartTypes().filter((s) => selectedColIds.includes(s.colId));
    }

    public getChartSeriesTypes(chartType?: ChartType): ChartSeriesType[] {
        const targetChartType = chartType ?? this.getChartType();
        return this.isComboChart(targetChartType) ? ['line', 'bar', 'area'] : [getSeriesType(targetChartType)];
    }

    public getChartSeriesType(): ChartSeriesType {
        const seriesChartTypes = this.getSeriesChartTypes();

        if (seriesChartTypes.length === 0) {
            return 'bar';
        }
        const ct = seriesChartTypes[0].chartType;

        if (ct === 'columnLineCombo') {
            return 'bar';
        }

        if (ct === 'areaColumnCombo') {
            return 'area';
        }
        return getSeriesType(ct);
    }

    public isEnterprise = () => _ModuleSupport.enterpriseModule.isEnterprise;

    private getCellRanges(): CellRange[] {
        return [this.model.dimensionCellRange!, this.model.valueCellRange!].filter((r) => r);
    }

    private createCellRange(
        params: UpdateRangeChartParams | UpdateCrossFilterChartParams
    ): PartialCellRange | undefined {
        return (
            params.cellRange &&
            this.rangeSvc?.createPartialCellRangeFromRangeParams(params.cellRange as CellRangeParams, true)
        );
    }

    private validUpdateType(params: UpdateChartParams): boolean {
        if (!params.type) {
            _warn(136);
            return false;
        }

        const chartTypeMap: Record<string, () => boolean> = {
            'Range Chart': () => !this.isPivotChart() && !this.isCrossFilterChart(),
            'Pivot Chart': () => this.isPivotChart(),
            'Cross Filter Chart': () => this.isCrossFilterChart(),
        };

        const currentChartType = Object.keys(chartTypeMap).find((type) => chartTypeMap[type]()) ?? 'Range Chart';

        const valid =
            params.type === `${currentChartType[0].toLowerCase()}${currentChartType.slice(1).replace(/ /g, '')}Update`;

        if (!valid) {
            _warn(137, { currentChartType, type: params.type });
        }
        return valid;
    }

    private getCellRangeParams(): CellRangeParams {
        const cellRanges = this.getCellRanges();
        const firstCellRange = cellRanges[0];
        const startRow = (firstCellRange && firstCellRange.startRow) || null;
        const endRow = (firstCellRange && firstCellRange.endRow) || null;

        return {
            rowStartIndex: startRow && startRow.rowIndex,
            rowStartPinned: startRow && startRow.rowPinned,
            rowEndIndex: endRow && endRow.rowIndex,
            rowEndPinned: endRow && endRow.rowPinned,
            columns: cellRanges.reduce(
                (columns, value) => columns.concat(value.columns.map((c) => c.getId())),
                [] as string[]
            ),
        };
    }

    public setCategoryAxisType(categoryAxisType?: AgCartesianAxisType): void {
        this.model.categoryAxisType = categoryAxisType;
        this.raiseChartModelUpdateEvent();
    }

    public getSeriesGroupType(): SeriesGroupType | undefined {
        return this.model.seriesGroupType ?? this.chartProxy.getSeriesGroupType();
    }

    public setSeriesGroupType(seriesGroupType?: SeriesGroupType): void {
        this.model.seriesGroupType = seriesGroupType;
        this.raiseChartModelUpdateEvent();
    }

    public raiseChartModelUpdateEvent(): void {
        this.dispatchLocalEvent({ type: 'chartModelUpdate' });
    }

    public raiseChartUpdatedEvent(): void {
        this.dispatchLocalEvent({ type: 'chartUpdated' });
    }

    public raiseChartApiUpdateEvent(): void {
        this.dispatchLocalEvent({ type: 'chartApiUpdate' });
    }

    private raiseChartOptionsChangedEvent(): void {
        const { chartId, chartType } = this.getChartModel();

        this.eventSvc.dispatchEvent({
            type: 'chartOptionsChanged',
            chartId,
            chartType,
            chartThemeName: this.getChartThemeName(),
            chartOptions: this.chartProxy.getChartThemeOverrides(),
        });
    }

    private raiseChartRangeSelectionChangedEvent(): void {
        this.eventSvc.dispatchEvent({
            type: 'chartRangeSelectionChanged',
            id: this.model.chartId,
            chartId: this.model.chartId,
            cellRange: this.getCellRangeParams(),
        });
    }

    public override destroy(): void {
        super.destroy();

        if (this.rangeSvc) {
            this.rangeSvc.setCellRanges([]);
        }
    }
}
