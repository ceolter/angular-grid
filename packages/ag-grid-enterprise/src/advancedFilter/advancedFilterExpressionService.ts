import type {
    AgColumn,
    BaseCellDataType,
    BeanCollection,
    ColumnAdvancedFilterModel,
    ColumnModel,
    ColumnNameService,
    DataTypeService,
    JoinAdvancedFilterModel,
    NamedBean,
    ValueService,
} from 'ag-grid-community';
import { BeanStub, _exists, _parseDateTimeFromString, _serialiseDate, _toStringOrNull } from 'ag-grid-community';

import { ADVANCED_FILTER_LOCALE_TEXT } from './advancedFilterLocaleText';
import type { AutocompleteEntry, AutocompleteListParams } from './autocomplete/autocompleteParams';
import { COL_FILTER_EXPRESSION_END_CHAR, COL_FILTER_EXPRESSION_START_CHAR } from './colFilterExpressionParser';
import type {
    DataTypeFilterExpressionOperators,
    FilterExpressionEvaluatorParams,
    FilterExpressionOperator,
    FilterExpressionOperators,
} from './filterExpressionOperators';
import {
    BooleanFilterExpressionOperators,
    ScalarFilterExpressionOperators,
    TextFilterExpressionOperators,
} from './filterExpressionOperators';

export class AdvancedFilterExpressionService extends BeanStub implements NamedBean {
    beanName = 'advFilterExpSvc' as const;

    private valueSvc: ValueService;
    private colModel: ColumnModel;
    private colNames: ColumnNameService;
    private dataTypeSvc?: DataTypeService;

    public wireBeans(beans: BeanCollection): void {
        this.valueSvc = beans.valueSvc;
        this.colModel = beans.colModel;
        this.colNames = beans.colNames;
        this.dataTypeSvc = beans.dataTypeSvc;
    }

    private columnNameToIdMap: { [columnNameUpperCase: string]: { colId: string; columnName: string } } = {};
    private columnAutocompleteEntries: AutocompleteEntry[] | null = null;
    private expressionOperators: FilterExpressionOperators;
    private expressionJoinOperators: { AND: string; OR: string };
    private expressionEvaluatorParams: { [colId: string]: FilterExpressionEvaluatorParams<any> } = {};

    public postConstruct(): void {
        this.expressionJoinOperators = this.generateExpressionJoinOperators();
        this.expressionOperators = this.generateExpressionOperators();
    }

    public parseJoinOperator(model: JoinAdvancedFilterModel): string {
        const { type } = model;
        return this.expressionJoinOperators[type] ?? type;
    }

    public getColumnDisplayValue(model: ColumnAdvancedFilterModel): string | undefined {
        const { colId } = model;
        const columnEntries = this.getColumnAutocompleteEntries();
        const columnEntry = columnEntries.find(({ key }) => key === colId);
        let columnName;
        if (columnEntry) {
            columnName = columnEntry.displayValue!;
            this.columnNameToIdMap[columnName.toLocaleUpperCase()] = { colId, columnName };
        } else {
            columnName = colId;
        }
        return columnName;
    }

    public getOperatorDisplayValue(model: ColumnAdvancedFilterModel): string | undefined {
        return this.getExpressionOperator(model.filterType, model.type)?.displayValue ?? model.type;
    }

    public getOperandModelValue(
        operand: string,
        baseCellDataType: BaseCellDataType,
        column: AgColumn
    ): string | number | bigint | null {
        switch (baseCellDataType) {
            case 'number':
                return _exists(operand) ? Number(operand) : null;
            case 'bigint':
                return _exists(operand) ? BigInt(operand) : null;
            case 'date':
                return _serialiseDate(this.valueSvc.parseValue(column, null, operand, undefined), false);
            case 'dateString': {
                // displayed string format may be different from data string format, so parse before converting to date
                const parsedDateString = this.valueSvc.parseValue(column, null, operand, undefined);
                return this.dataTypeSvc
                    ? _serialiseDate(this.dataTypeSvc.getDateParserFunction(column)(parsedDateString) ?? null, false)
                    : parsedDateString;
            }
        }
        return operand;
    }

    public getOperandDisplayValue(model: ColumnAdvancedFilterModel, skipFormatting?: boolean): string {
        const { colId, filter } = model as any;
        const column = this.colModel.getColDefCol(colId);
        let operand = '';
        if (filter != null) {
            let operand1: string | null | undefined;
            switch (model.filterType) {
                case 'number':
                    operand1 = _toStringOrNull(filter) ?? '';
                    break;
                case 'bigint':
                    operand1 = _toStringOrNull(filter) ?? '';
                    break;
                case 'date': {
                    const dateValue = _parseDateTimeFromString(filter);
                    operand1 = column ? this.valueSvc.formatValue(column, null, dateValue) : null;
                    break;
                }
                case 'dateString': {
                    let dateStringStringValue;
                    if (this.dataTypeSvc) {
                        // need to convert from ISO date string to Date to data string format to formatted string format
                        const dateStringDateValue = _parseDateTimeFromString(filter);
                        dateStringStringValue = column
                            ? this.dataTypeSvc?.getDateFormatterFunction(column)(dateStringDateValue ?? undefined)
                            : null;
                    } else {
                        dateStringStringValue = filter;
                    }
                    operand1 = column ? this.valueSvc.formatValue(column, null, dateStringStringValue) : null;
                    break;
                }
            }
            if (model.filterType !== 'number' && model.filterType !== 'bigint') {
                operand1 = operand1 ?? _toStringOrNull(filter) ?? '';
                if (!skipFormatting) {
                    operand1 = `"${operand1}"`;
                }
            }
            operand = skipFormatting ? operand1! : ` ${operand1}`;
        }
        return operand;
    }

    public parseColumnFilterModel(model: ColumnAdvancedFilterModel): string {
        const columnName = this.getColumnDisplayValue(model) ?? '';
        const operator = this.getOperatorDisplayValue(model) ?? '';
        const operands = this.getOperandDisplayValue(model);
        return `[${columnName}] ${operator}${operands}`;
    }

    public updateAutocompleteCache(updateEntry: AutocompleteEntry, type?: string): void {
        if (type === 'column') {
            const { key: colId, displayValue } = updateEntry;
            this.columnNameToIdMap[updateEntry.displayValue!.toLocaleUpperCase()] = {
                colId,
                columnName: displayValue!,
            };
        }
    }

    public translate(key: keyof typeof ADVANCED_FILTER_LOCALE_TEXT, variableValues?: string[]): string {
        let defaultValue = ADVANCED_FILTER_LOCALE_TEXT[key];
        if (typeof defaultValue === 'function') {
            defaultValue = defaultValue(variableValues!);
        }
        return this.getLocaleTextFunc()(key, defaultValue, variableValues);
    }

    public generateAutocompleteListParams(
        entries: AutocompleteEntry[],
        type: string,
        searchString: string
    ): AutocompleteListParams {
        return {
            enabled: true,
            type,
            searchString,
            entries,
        };
    }

    public getColumnAutocompleteEntries(): AutocompleteEntry[] {
        if (this.columnAutocompleteEntries) {
            return this.columnAutocompleteEntries;
        }
        const columns = this.colModel.getColDefCols() ?? [];
        const entries: AutocompleteEntry[] = [];
        const includeHiddenColumns = this.gos.get('includeHiddenColumnsInAdvancedFilter');
        columns.forEach((column) => {
            if (
                column.getColDef().filter &&
                (includeHiddenColumns || column.isVisible() || column.isRowGroupActive())
            ) {
                entries.push({
                    key: column.getColId(),
                    displayValue: this.colNames.getDisplayNameForColumn(column, 'advancedFilter')!,
                });
            }
        });
        entries.sort((a, b) => {
            const aValue = a.displayValue ?? '';
            const bValue = b.displayValue ?? '';
            if (aValue < bValue) {
                return -1;
            } else if (bValue > aValue) {
                return 1;
            }
            return 0;
        });
        return entries;
    }

    public getOperatorAutocompleteEntries(column: AgColumn, baseCellDataType: BaseCellDataType): AutocompleteEntry[] {
        const activeOperators = this.getActiveOperators(column);
        return this.getDataTypeExpressionOperator(baseCellDataType)!.getEntries(activeOperators);
    }

    public getJoinOperatorAutocompleteEntries(): AutocompleteEntry[] {
        return Object.entries(this.expressionJoinOperators).map(([key, displayValue]) => ({ key, displayValue }));
    }

    public getDefaultAutocompleteListParams(searchString: string): AutocompleteListParams {
        return this.generateAutocompleteListParams(this.getColumnAutocompleteEntries(), 'column', searchString);
    }

    public getDataTypeExpressionOperator(
        baseCellDataType?: BaseCellDataType
    ): DataTypeFilterExpressionOperators<any> | undefined {
        return this.expressionOperators[baseCellDataType!];
    }

    public getExpressionOperator(
        baseCellDataType?: BaseCellDataType,
        operator?: string
    ): FilterExpressionOperator<any> | undefined {
        return this.getDataTypeExpressionOperator(baseCellDataType)?.operators?.[operator!];
    }

    public getExpressionJoinOperators(): { AND: string; OR: string } {
        return this.expressionJoinOperators;
    }

    public getColId(columnName: string): { colId: string; columnName: string } | null {
        const upperCaseColumnName = columnName.toLocaleUpperCase();
        const cachedColId = this.columnNameToIdMap[upperCaseColumnName];
        if (cachedColId) {
            return cachedColId;
        }

        const columnAutocompleteEntries = this.getColumnAutocompleteEntries();
        const colEntry = columnAutocompleteEntries.find(
            ({ displayValue }) => displayValue!.toLocaleUpperCase() === upperCaseColumnName
        );
        if (colEntry) {
            const { key: colId, displayValue } = colEntry;
            const colValue = { colId, columnName: displayValue! };
            // cache for faster lookup
            this.columnNameToIdMap[upperCaseColumnName] = colValue;
            return colValue;
        }
        return null;
    }

    public getExpressionEvaluatorParams<ConvertedTValue, TValue = ConvertedTValue>(
        colId: string
    ): FilterExpressionEvaluatorParams<ConvertedTValue, TValue> {
        let params = this.expressionEvaluatorParams[colId];
        if (params) {
            return params;
        }

        const column = this.colModel.getColDefCol(colId);
        if (!column) {
            return { valueConverter: (v: any) => v };
        }

        const baseCellDataType = this.dataTypeSvc?.getBaseDataType(column);
        switch (baseCellDataType) {
            case 'dateString':
                params = {
                    valueConverter: this.dataTypeSvc?.getDateParserFunction(column) ?? ((v: any) => v),
                };
                break;
            case 'object':
                // If there's a filter value getter, assume the value is already a string. Otherwise we need to format it.
                if (column.getColDef().filterValueGetter) {
                    params = { valueConverter: (v: any) => v };
                } else {
                    params = {
                        valueConverter: (value, node) =>
                            this.valueSvc.formatValue(column, node, value) ??
                            (typeof value.toString === 'function' ? value.toString() : ''),
                    };
                }
                break;
            case 'text':
            case undefined:
                params = { valueConverter: (v: any) => _toStringOrNull(v) };
                break;
            default:
                params = { valueConverter: (v: any) => v };
                break;
        }
        const { filterParams } = column.getColDef();
        if (filterParams) {
            ['caseSensitive', 'includeBlanksInEquals', 'includeBlanksInLessThan', 'includeBlanksInGreaterThan'].forEach(
                (param: keyof FilterExpressionEvaluatorParams<ConvertedTValue, TValue>) => {
                    const paramValue = filterParams[param];
                    if (paramValue) {
                        params[param] = paramValue;
                    }
                }
            );
        }
        this.expressionEvaluatorParams[colId] = params;

        return params;
    }

    public getColumnDetails(colId: string): { column?: AgColumn; baseCellDataType: BaseCellDataType } {
        const column = this.colModel.getColDefCol(colId) ?? undefined;
        const baseCellDataType = (column ? this.dataTypeSvc?.getBaseDataType(column) : undefined) ?? 'text';
        return { column, baseCellDataType };
    }

    public generateExpressionOperators(): FilterExpressionOperators {
        const translate = (key: keyof typeof ADVANCED_FILTER_LOCALE_TEXT, variableValues?: string[]) =>
            this.translate(key, variableValues);
        return {
            text: new TextFilterExpressionOperators({ translate }),
            boolean: new BooleanFilterExpressionOperators({ translate }),
            object: new TextFilterExpressionOperators<any>({ translate }),
            number: new ScalarFilterExpressionOperators<number>({ translate, equals: (v, o) => v === o }),
            bigint: new ScalarFilterExpressionOperators<bigint>({ translate, equals: (v, o) => v === o }),
            date: new ScalarFilterExpressionOperators<Date>({
                translate,
                equals: (v: Date, o: Date) => v.getTime() === o.getTime(),
            }),
            dateString: new ScalarFilterExpressionOperators<Date, string>({
                translate,
                equals: (v: Date, o: Date) => v.getTime() === o.getTime(),
            }),
        };
    }

    public getColumnValue({ displayValue }: AutocompleteEntry): string {
        return `${COL_FILTER_EXPRESSION_START_CHAR}${displayValue}${COL_FILTER_EXPRESSION_END_CHAR}`;
    }

    private generateExpressionJoinOperators(): { AND: string; OR: string } {
        return {
            AND: this.translate('advancedFilterAnd'),
            OR: this.translate('advancedFilterOr'),
        };
    }

    private getActiveOperators(column: AgColumn): string[] | undefined {
        const filterOptions = column.getColDef().filterParams?.filterOptions;
        if (!filterOptions) {
            return undefined;
        }
        const isValid = filterOptions.every((filterOption: any) => typeof filterOption === 'string');
        return isValid ? filterOptions : undefined;
    }

    public resetColumnCaches(): void {
        this.columnAutocompleteEntries = null;
        this.columnNameToIdMap = {};
        this.expressionEvaluatorParams = {};
    }
}
