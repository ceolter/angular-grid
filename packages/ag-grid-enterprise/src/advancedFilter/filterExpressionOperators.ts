import type { IRowNode } from 'ag-grid-community';

import type { ADVANCED_FILTER_LOCALE_TEXT } from './advancedFilterLocaleText';
import type { AutocompleteEntry } from './autocomplete/autocompleteParams';

export interface FilterExpressionEvaluatorParams<ConvertedTValue, TValue = ConvertedTValue> {
    caseSensitive?: boolean;
    includeBlanksInEquals?: boolean;
    includeBlanksInLessThan?: boolean;
    includeBlanksInGreaterThan?: boolean;
    valueConverter: (value: TValue, node: IRowNode) => ConvertedTValue;
}

export type FilterExpressionEvaluator<ConvertedTValue, TValue = ConvertedTValue> = (
    value: TValue | null | undefined,
    node: IRowNode,
    params: FilterExpressionEvaluatorParams<ConvertedTValue, TValue>,
    operand1?: ConvertedTValue,
    operand2?: ConvertedTValue
) => boolean;

export interface FilterExpressionOperator<ConvertedTValue, TValue = ConvertedTValue> {
    displayValue: string;
    evaluator: FilterExpressionEvaluator<ConvertedTValue, TValue>;
    numOperands: number;
}

export interface DataTypeFilterExpressionOperators<ConvertedTValue, TValue = ConvertedTValue> {
    operators: {
        [operator: string]: FilterExpressionOperator<ConvertedTValue, TValue>;
    };
    getEntries(activeOperators?: string[]): AutocompleteEntry[];
    findOperator(displayValue: string): string | null | undefined;
}

export interface FilterExpressionOperators {
    text: DataTypeFilterExpressionOperators<string>;
    number: DataTypeFilterExpressionOperators<number>;
    bigint: DataTypeFilterExpressionOperators<bigint>;
    boolean: DataTypeFilterExpressionOperators<boolean>;
    date: DataTypeFilterExpressionOperators<Date>;
    dateString: DataTypeFilterExpressionOperators<Date, string>;
    object: DataTypeFilterExpressionOperators<string, any>;
}

// null = partial match, undefined = no match
export function findMatch<T>(
    searchValue: string,
    values: { [key: string]: T },
    getDisplayValue: (value: T) => string
): string | null | undefined {
    let partialMatch = false;
    const searchValueLowerCase = searchValue.toLocaleLowerCase();
    const partialSearchValue = searchValueLowerCase + ' ';
    const parsedValue = Object.entries(values).find(([, value]) => {
        const displayValueLowerCase = getDisplayValue(value).toLocaleLowerCase();
        if (displayValueLowerCase.startsWith(partialSearchValue)) {
            partialMatch = true;
        }
        return displayValueLowerCase === searchValueLowerCase;
    });
    if (parsedValue) {
        return parsedValue[0];
    } else if (partialMatch) {
        return null;
    } else {
        return undefined;
    }
}

function getEntries<ConvertedTValue, TValue = ConvertedTValue>(
    operators: { [operator: string]: FilterExpressionOperator<ConvertedTValue, TValue> },
    activeOperatorKeys?: string[]
): AutocompleteEntry[] {
    const keys = activeOperatorKeys ?? Object.keys(operators);
    return keys.map((key) => ({
        key,
        displayValue: operators[key].displayValue,
    }));
}

export interface FilterExpressionOperatorsParams {
    translate: (key: keyof typeof ADVANCED_FILTER_LOCALE_TEXT, variableValues?: string[]) => string;
}

export class TextFilterExpressionOperators<TValue = string>
    implements DataTypeFilterExpressionOperators<string, TValue>
{
    public operators: { [operator: string]: FilterExpressionOperator<string, TValue> };

    constructor(private params: FilterExpressionOperatorsParams) {
        this.initOperators();
    }

    public getEntries(activeOperators?: string[]): AutocompleteEntry[] {
        return getEntries(this.operators, activeOperators);
    }

    public findOperator(displayValue: string): string | null | undefined {
        return findMatch(displayValue, this.operators, ({ displayValue }) => displayValue);
    }

    private initOperators(): void {
        const { translate } = this.params;
        this.operators = {
            contains: {
                displayValue: translate('advancedFilterContains'),
                evaluator: (value, node, params, operand1) =>
                    this.evaluateExpression(value, node, params, operand1!, false, (v, o) => v.includes(o)),
                numOperands: 1,
            },
            notContains: {
                displayValue: translate('advancedFilterNotContains'),
                evaluator: (value, node, params, operand1) =>
                    this.evaluateExpression(value, node, params, operand1!, true, (v, o) => !v.includes(o)),
                numOperands: 1,
            },
            equals: {
                displayValue: translate('advancedFilterTextEquals'),
                evaluator: (value, node, params, operand1) =>
                    this.evaluateExpression(value, node, params, operand1!, false, (v, o) => v === o),
                numOperands: 1,
            },
            notEqual: {
                displayValue: translate('advancedFilterTextNotEqual'),
                evaluator: (value, node, params, operand1) =>
                    this.evaluateExpression(value, node, params, operand1!, true, (v, o) => v != o),
                numOperands: 1,
            },
            startsWith: {
                displayValue: translate('advancedFilterStartsWith'),
                evaluator: (value, node, params, operand1) =>
                    this.evaluateExpression(value, node, params, operand1!, false, (v, o) => v.startsWith(o)),
                numOperands: 1,
            },
            endsWith: {
                displayValue: translate('advancedFilterEndsWith'),
                evaluator: (value, node, params, operand1) =>
                    this.evaluateExpression(value, node, params, operand1!, false, (v, o) => v.endsWith(o)),
                numOperands: 1,
            },
            blank: {
                displayValue: translate('advancedFilterBlank'),
                evaluator: (value) => value == null || (typeof value === 'string' && value.trim().length === 0),
                numOperands: 0,
            },
            notBlank: {
                displayValue: translate('advancedFilterNotBlank'),
                evaluator: (value) => value != null && (typeof value !== 'string' || value.trim().length > 0),
                numOperands: 0,
            },
        };
    }

    private evaluateExpression(
        value: TValue | null | undefined,
        node: IRowNode,
        params: FilterExpressionEvaluatorParams<string, TValue>,
        operand: string,
        nullsMatch: boolean,
        expression: (value: string, operand: string) => boolean
    ): boolean {
        if (value == null) {
            return nullsMatch;
        }
        return params.caseSensitive
            ? expression(params.valueConverter(value, node), operand)
            : expression(params.valueConverter(value, node).toLocaleLowerCase(), operand.toLocaleLowerCase());
    }
}

export interface ScalarFilterExpressionOperatorsParams<ConvertedTValue> extends FilterExpressionOperatorsParams {
    equals: (value: ConvertedTValue, operand: ConvertedTValue) => boolean;
}

export class ScalarFilterExpressionOperators<ConvertedTValue extends number | bigint | Date, TValue = ConvertedTValue>
    implements DataTypeFilterExpressionOperators<ConvertedTValue, TValue>
{
    public operators: { [operator: string]: FilterExpressionOperator<ConvertedTValue, TValue> };

    constructor(private params: ScalarFilterExpressionOperatorsParams<ConvertedTValue>) {
        this.initOperators();
    }

    public getEntries(activeOperators?: string[]): AutocompleteEntry[] {
        return getEntries(this.operators, activeOperators);
    }

    public findOperator(displayValue: string): string | null | undefined {
        return findMatch(displayValue, this.operators, ({ displayValue }) => displayValue);
    }

    private initOperators(): void {
        const { translate, equals } = this.params;
        this.operators = {
            equals: {
                displayValue: translate('advancedFilterEquals'),
                evaluator: (value, node, params, operand1) =>
                    this.evaluateSingleOperandExpression(
                        value,
                        node,
                        params,
                        operand1!,
                        !!params.includeBlanksInEquals,
                        equals!
                    ),
                numOperands: 1,
            },
            notEqual: {
                displayValue: translate('advancedFilterNotEqual'),
                evaluator: (value, node, params, operand1) =>
                    this.evaluateSingleOperandExpression(
                        value,
                        node,
                        params,
                        operand1!,
                        !!params.includeBlanksInEquals,
                        (v, o) => !equals!(v, o)
                    ),
                numOperands: 1,
            },
            greaterThan: {
                displayValue: translate('advancedFilterGreaterThan'),
                evaluator: (value, node, params, operand1) =>
                    this.evaluateSingleOperandExpression(
                        value,
                        node,
                        params,
                        operand1!,
                        !!params.includeBlanksInGreaterThan,
                        (v, o) => v > o
                    ),
                numOperands: 1,
            },
            greaterThanOrEqual: {
                displayValue: translate('advancedFilterGreaterThanOrEqual'),
                evaluator: (value, node, params, operand1) =>
                    this.evaluateSingleOperandExpression(
                        value,
                        node,
                        params,
                        operand1!,
                        !!params.includeBlanksInGreaterThan,
                        (v, o) => v >= o
                    ),
                numOperands: 1,
            },
            lessThan: {
                displayValue: translate('advancedFilterLessThan'),
                evaluator: (value, node, params, operand1) =>
                    this.evaluateSingleOperandExpression(
                        value,
                        node,
                        params,
                        operand1!,
                        !!params.includeBlanksInLessThan,
                        (v, o) => v < o
                    ),
                numOperands: 1,
            },
            lessThanOrEqual: {
                displayValue: translate('advancedFilterLessThanOrEqual'),
                evaluator: (value, node, params, operand1) =>
                    this.evaluateSingleOperandExpression(
                        value,
                        node,
                        params,
                        operand1!,
                        !!params.includeBlanksInLessThan,
                        (v, o) => v <= o
                    ),
                numOperands: 1,
            },
            blank: {
                displayValue: translate('advancedFilterBlank'),
                evaluator: (value) => value == null,
                numOperands: 0,
            },
            notBlank: {
                displayValue: translate('advancedFilterNotBlank'),
                evaluator: (value) => value != null,
                numOperands: 0,
            },
        };
    }

    private evaluateSingleOperandExpression(
        value: TValue | null | undefined,
        node: IRowNode,
        params: FilterExpressionEvaluatorParams<ConvertedTValue, TValue>,
        operand: ConvertedTValue,
        nullsMatch: boolean,
        expression: (value: ConvertedTValue, operand: ConvertedTValue) => boolean
    ): boolean {
        if (value == null) {
            return nullsMatch;
        }
        return expression(params.valueConverter(value, node), operand);
    }
}

export class BooleanFilterExpressionOperators implements DataTypeFilterExpressionOperators<boolean> {
    public operators: { [operator: string]: FilterExpressionOperator<boolean> };

    constructor(private params: FilterExpressionOperatorsParams) {
        this.initOperators();
    }

    public getEntries(activeOperators?: string[]): AutocompleteEntry[] {
        return getEntries(this.operators, activeOperators);
    }

    public findOperator(displayValue: string): string | null | undefined {
        return findMatch(displayValue, this.operators, ({ displayValue }) => displayValue);
    }

    private initOperators(): void {
        const { translate } = this.params;
        this.operators = {
            true: {
                displayValue: translate('advancedFilterTrue'),
                evaluator: (value) => !!value,
                numOperands: 0,
            },
            false: {
                displayValue: translate('advancedFilterFalse'),
                evaluator: (value) => value === false,
                numOperands: 0,
            },
            blank: {
                displayValue: translate('advancedFilterBlank'),
                evaluator: (value) => value == null,
                numOperands: 0,
            },
            notBlank: {
                displayValue: translate('advancedFilterNotBlank'),
                evaluator: (value) => value != null,
                numOperands: 0,
            },
        };
    }
}
