import type { AdvancedFilterModel } from 'ag-grid-community';

import type { ADVANCED_FILTER_LOCALE_TEXT } from './advancedFilterLocaleText';
import type { AutocompleteEntry, AutocompleteListParams } from './autocomplete/autocompleteParams';
import { ColFilterExpressionParser } from './colFilterExpressionParser';
import { findMatch } from './filterExpressionOperators';
import type {
    AutocompleteUpdate,
    FilterExpressionFunction,
    FilterExpressionFunctionParams,
    FilterExpressionParserParams,
    FilterExpressionValidationError,
} from './filterExpressionUtils';
import { checkAndUpdateExpression, findEndPosition, getSearchString, updateExpression } from './filterExpressionUtils';

class OperatorParser {
    private operators: string[] = [];
    private parsedOperator: 'AND' | 'OR';
    private operatorStartPositions: number[] = [];
    private operatorEndPositions: (number | undefined)[] = [];
    private activeOperator: number = 0;
    private validationError: FilterExpressionValidationError | null = null;

    constructor(private params: FilterExpressionParserParams) {}

    public parseExpression(i: number): number {
        this.operators.push('');
        this.operatorStartPositions.push(i);
        this.operatorEndPositions.push(undefined);
        const { expression } = this.params;
        while (i < expression.length) {
            const char = expression[i];
            if (char === ' ') {
                const isComplete = this.parseOperator(i - 1);
                if (isComplete) {
                    this.activeOperator++;
                    return i - 1;
                } else {
                    this.operators[this.activeOperator] += char;
                }
            } else {
                this.operators[this.activeOperator] += char;
            }
            i++;
        }
        this.parseOperator(i - 1);

        return i;
    }

    public isValid(): boolean {
        return !this.validationError && (!this.operators.length || !!this.parsedOperator);
    }

    public getValidationError(): FilterExpressionValidationError | null {
        return this.validationError;
    }

    public getFunction(): '&&' | '||' {
        return this.parsedOperator === 'OR' ? '||' : '&&';
    }

    public getModel(): 'AND' | 'OR' {
        return this.parsedOperator === 'OR' ? 'OR' : 'AND';
    }

    public getAutocompleteListParams(position: number, operatorIndex?: number): AutocompleteListParams {
        let searchString: string;
        if (operatorIndex == null) {
            searchString = '';
        } else {
            const operator = this.operators[operatorIndex];
            const operatorEndPosition = this.operatorEndPositions[operatorIndex];
            searchString = getSearchString(
                operator,
                position,
                operatorEndPosition == null ? this.params.expression.length : operatorEndPosition + 1
            );
        }
        let entries = this.params.advFilterExpSvc.getJoinOperatorAutocompleteEntries();
        if (operatorIndex || (operatorIndex == null && this.activeOperator)) {
            // if operator already chosen, don't allow other operators
            entries = entries.filter(({ key }) => key === this.parsedOperator);
        }
        return this.params.advFilterExpSvc.generateAutocompleteListParams(entries, 'join', searchString);
    }

    public updateExpression(
        position: number,
        updateEntry: AutocompleteEntry,
        operatorIndex: number
    ): AutocompleteUpdate {
        let { expression } = this.params;
        const updatedValuePart = updateEntry.displayValue ?? updateEntry.key;
        if (operatorIndex === 0) {
            // need to update all others
            for (let i = this.operatorEndPositions.length - 1; i > 0; i--) {
                const operatorEndPosition = this.operatorEndPositions[i];
                if (operatorEndPosition == null) {
                    continue;
                }
                expression = updateExpression(
                    expression,
                    this.operatorStartPositions[i],
                    operatorEndPosition,
                    updatedValuePart
                ).updatedValue;
            }
        }
        // if we don't have a start position, haven't typed anything yet, so use current position
        const startPosition =
            this.operatorStartPositions.length > operatorIndex ? this.operatorStartPositions[operatorIndex] : position;
        const endPosition =
            (this.operatorEndPositions.length > operatorIndex ? this.operatorEndPositions[operatorIndex] : undefined) ??
            findEndPosition(expression, position, true).endPosition;
        return updateExpression(expression, startPosition, endPosition, updatedValuePart, true);
    }

    public getNumOperators(): number {
        return this.operators.length;
    }

    public getLastOperatorEndPosition(): number | undefined {
        return this.operatorEndPositions[this.operatorEndPositions.length - 1];
    }

    private parseOperator(endPosition: number): boolean {
        const operator = this.operators.length > this.activeOperator ? this.operators[this.activeOperator] : '';
        const joinOperators = this.params.advFilterExpSvc.getExpressionJoinOperators();
        const parsedValue = findMatch(operator, joinOperators, (v) => v) as 'AND' | 'OR';
        if (parsedValue) {
            // exact match
            this.operatorEndPositions[this.activeOperator] = endPosition;
            const displayValue = joinOperators[parsedValue];
            if (this.activeOperator) {
                if (parsedValue !== this.parsedOperator) {
                    if (!this.validationError) {
                        this.validationError = {
                            message: this.params.advFilterExpSvc.translate(
                                'advancedFilterValidationJoinOperatorMismatch'
                            ),
                            startPosition: endPosition - operator.length + 1,
                            endPosition,
                        };
                    }
                    return false;
                }
            } else {
                this.parsedOperator = parsedValue;
            }
            if (operator !== displayValue) {
                checkAndUpdateExpression(this.params, operator, displayValue, endPosition);
                this.operators[this.activeOperator] = displayValue;
            }
            return true;
        } else if (parsedValue === null) {
            // partial match
            return false;
        } else {
            // no match
            if (!this.validationError) {
                this.validationError = {
                    message: this.params.advFilterExpSvc.translate('advancedFilterValidationInvalidJoinOperator'),
                    startPosition: endPosition - operator.length + 1,
                    endPosition,
                };
            }
            return true;
        }
    }
}

export class JoinFilterExpressionParser {
    private expectingExpression: boolean = true;
    private expectingOperator: boolean = false;
    private expressionParsers: (JoinFilterExpressionParser | ColFilterExpressionParser)[] = [];
    private operatorParser: OperatorParser = new OperatorParser(this.params);
    private endPosition: number;
    private missingEndBracket: boolean = false;
    private extraEndBracket: boolean = false;

    constructor(
        private params: FilterExpressionParserParams,
        public readonly startPosition: number
    ) {}

    public parseExpression(): number {
        let i = this.startPosition;
        const { expression } = this.params;
        while (i < expression.length) {
            const char = expression[i];
            if (char === '(' && !this.expectingOperator) {
                const nestedParser = new JoinFilterExpressionParser(this.params, i + 1);
                i = nestedParser.parseExpression();
                this.expressionParsers.push(nestedParser);
                this.expectingExpression = false;
                this.expectingOperator = true;
            } else if (char === ')') {
                this.endPosition = i - 1;
                if (this.startPosition === 0) {
                    this.extraEndBracket = true;
                }
                return i;
            } else if (char === ' ') {
                // ignore extra whitespace
            } else if (this.expectingExpression) {
                const nestedParser = new ColFilterExpressionParser(this.params, i);
                i = nestedParser.parseExpression();
                this.expressionParsers.push(nestedParser);
                this.expectingExpression = false;
                this.expectingOperator = true;
            } else if (this.expectingOperator) {
                i = this.operatorParser.parseExpression(i);
                this.expectingOperator = false;
                this.expectingExpression = true;
            }
            i++;
        }
        if (this.startPosition > 0) {
            this.missingEndBracket = true;
        }

        return i;
    }

    public isValid(): boolean {
        return (
            !this.missingEndBracket &&
            !this.extraEndBracket &&
            this.expressionParsers.length === this.operatorParser.getNumOperators() + 1 &&
            this.operatorParser.isValid() &&
            this.expressionParsers.every((expressionParser) => expressionParser.isValid())
        );
    }

    public getValidationError(): FilterExpressionValidationError | null {
        const operatorError = this.operatorParser.getValidationError();
        for (let i = 0; i < this.expressionParsers.length; i++) {
            const expressionError = this.expressionParsers[i].getValidationError();
            if (expressionError) {
                return operatorError && operatorError.startPosition < expressionError.startPosition
                    ? operatorError
                    : expressionError;
            }
        }
        if (operatorError) {
            return operatorError;
        }
        if (this.extraEndBracket) {
            return {
                message: this.params.advFilterExpSvc.translate('advancedFilterValidationExtraEndBracket'),
                startPosition: this.endPosition + 1,
                endPosition: this.endPosition + 1,
            };
        }
        let translateKey: keyof typeof ADVANCED_FILTER_LOCALE_TEXT | undefined;
        if (this.expressionParsers.length === this.operatorParser.getNumOperators()) {
            translateKey = 'advancedFilterValidationMissingCondition';
        } else if (this.missingEndBracket) {
            translateKey = 'advancedFilterValidationMissingEndBracket';
        }
        if (translateKey) {
            return {
                message: this.params.advFilterExpSvc.translate(translateKey),
                startPosition: this.params.expression.length,
                endPosition: this.params.expression.length,
            };
        }
        return null;
    }

    public getFunctionString(params: FilterExpressionFunctionParams): string {
        const hasMultipleExpressions = this.expressionParsers.length > 1;
        const expression = this.expressionParsers
            .map((expressionParser) => expressionParser.getFunctionString(params))
            .join(` ${this.operatorParser.getFunction()} `);
        return hasMultipleExpressions ? `(${expression})` : expression;
    }

    public getFunctionParsed(params: FilterExpressionFunctionParams): FilterExpressionFunction {
        const operator = this.operatorParser.getFunction();
        const funcs = this.expressionParsers.map((expressionParser) => expressionParser.getFunctionParsed(params));
        const arrayFunc = operator === '&&' ? 'every' : 'some';
        return (expressionProxy, node, p) => funcs[arrayFunc]((func) => func(expressionProxy, node, p));
    }

    public getAutocompleteListParams(position: number): AutocompleteListParams | undefined {
        if (this.endPosition != null && position > this.endPosition + 1) {
            return undefined;
        }
        if (!this.expressionParsers.length) {
            return this.getColumnAutocompleteListParams();
        }

        const expressionParserIndex = this.getExpressionParserIndex(position);

        if (expressionParserIndex == null) {
            if (this.params.expression[position] === '(') {
                return { enabled: false };
            }
            // positioned before the expression, so new expression
            return this.getColumnAutocompleteListParams();
        }

        const expressionParser = this.expressionParsers[expressionParserIndex];

        const autocompleteType = expressionParser.getAutocompleteListParams(position);

        if (!autocompleteType) {
            // beyond the end of the expression
            if (expressionParserIndex! < this.expressionParsers.length - 1) {
                // in the middle of two expressions
                return this.operatorParser.getAutocompleteListParams(position, expressionParserIndex);
            }
            if (this.expressionParsers.length === this.operatorParser.getNumOperators()) {
                const operatorEndPosition = this.operatorParser.getLastOperatorEndPosition();
                return operatorEndPosition == null || position <= operatorEndPosition + 1
                    ? this.operatorParser.getAutocompleteListParams(position, this.operatorParser.getNumOperators() - 1)
                    : this.getColumnAutocompleteListParams();
            }
            if (this.params.expression[position - 1] === ')') {
                return { enabled: false };
            }
            return this.operatorParser.getAutocompleteListParams(position);
        }

        return autocompleteType;
    }

    public updateExpression(
        position: number,
        updateEntry: AutocompleteEntry,
        type?: string
    ): AutocompleteUpdate | null {
        const expression = this.params.expression;

        const expressionParserIndex = this.getExpressionParserIndex(position);

        if (expressionParserIndex == null) {
            // positioned before the expression
            const updatedValuePart =
                type === 'column'
                    ? this.params.advFilterExpSvc.getColumnValue(updateEntry)
                    : updateEntry.displayValue ?? updateEntry.key;
            return updateExpression(expression, this.startPosition, this.startPosition, updatedValuePart, true);
        }

        const expressionParser = this.expressionParsers[expressionParserIndex];

        const updatedExpression = expressionParser.updateExpression(position, updateEntry, type);

        if (updatedExpression == null) {
            if (type === 'column') {
                // beyond the end of the expression, just do simple update
                return updateExpression(
                    expression,
                    position,
                    expression.length - 1,
                    this.params.advFilterExpSvc.getColumnValue(updateEntry),
                    true
                );
            } else if (this.endPosition != null && position > this.endPosition + 1) {
                return null;
            } else {
                return this.operatorParser.updateExpression(position, updateEntry, expressionParserIndex);
            }
        }
        return updatedExpression;
    }

    public getModel(): AdvancedFilterModel {
        if (this.expressionParsers.length > 1) {
            return {
                filterType: 'join',
                type: this.operatorParser.getModel(),
                conditions: this.expressionParsers.map((parser) => parser.getModel()),
            };
        } else {
            return this.expressionParsers[0].getModel();
        }
    }

    private getColumnAutocompleteListParams(): AutocompleteListParams {
        return this.params.advFilterExpSvc.generateAutocompleteListParams(
            this.params.advFilterExpSvc.getColumnAutocompleteEntries(),
            'column',
            ''
        );
    }

    private getExpressionParserIndex(position: number): number | undefined {
        let expressionParserIndex: number | undefined;

        for (let i = 0; i < this.expressionParsers.length; i++) {
            const expressionParserToCheck = this.expressionParsers[i];
            if (expressionParserToCheck.startPosition > position) {
                break;
            }
            expressionParserIndex = i;
        }

        return expressionParserIndex;
    }
}
