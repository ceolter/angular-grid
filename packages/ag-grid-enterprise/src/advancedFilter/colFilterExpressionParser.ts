import type { AdvancedFilterModel, AgColumn, BaseCellDataType } from 'ag-grid-community';

import type { ADVANCED_FILTER_LOCALE_TEXT } from './advancedFilterLocaleText';
import type { AutocompleteEntry, AutocompleteListParams } from './autocomplete/autocompleteParams';
import type {
    AutocompleteUpdate,
    FilterExpressionFunction,
    FilterExpressionFunctionParams,
    FilterExpressionParserParams,
    FilterExpressionValidationError,
} from './filterExpressionUtils';
import {
    checkAndUpdateExpression,
    escapeQuotes,
    findEndPosition,
    findStartPosition,
    getSearchString,
    updateExpression,
} from './filterExpressionUtils';

interface Parser {
    type: string;
    parse(char: string, position: number): boolean | undefined;
    complete(position: number): void;
    getValidationError(): FilterExpressionValidationError | null;
}

class ColumnParser implements Parser {
    public readonly type = 'column';

    public valid = true;
    public endPosition: number | undefined;
    public baseCellDataType: BaseCellDataType;
    public column: AgColumn | null | undefined;
    public hasStartChar = false;
    public hasEndChar = false;
    private colName: string = '';
    private colId: string;

    constructor(
        private params: FilterExpressionParserParams,
        public readonly startPosition: number
    ) {}

    public parse(char: string, position: number): boolean | undefined {
        if (char === COL_FILTER_EXPRESSION_START_CHAR && !this.colName) {
            this.hasStartChar = true;
        } else if (char === COL_FILTER_EXPRESSION_END_CHAR && this.hasStartChar) {
            const isMatch = this.parseColumn(false, position);
            if (isMatch) {
                this.hasEndChar = true;
                return false;
            } else {
                this.colName += char;
            }
        } else {
            this.colName += char;
        }
        return undefined;
    }

    public getDisplayValue(): string {
        return (
            (this.hasStartChar ? COL_FILTER_EXPRESSION_START_CHAR : '') +
            this.colName +
            (this.hasEndChar ? COL_FILTER_EXPRESSION_END_CHAR : '')
        );
    }

    public getColId(): string {
        return this.colId;
    }

    public complete(position: number): void {
        this.parseColumn(true, position);
    }

    public getValidationError(): FilterExpressionValidationError | null {
        return this.valid
            ? null
            : {
                  message: this.params.advFilterExpSvc.translate('advancedFilterValidationInvalidColumn'),
                  startPosition: this.startPosition,
                  endPosition: this.endPosition ?? this.params.expression.length - 1,
              };
    }

    private parseColumn(fromComplete: boolean, endPosition: number): boolean {
        this.endPosition = endPosition;
        const colValue = this.params.advFilterExpSvc.getColId(this.colName);
        if (colValue && this.hasStartChar) {
            this.colId = colValue.colId;
            checkAndUpdateExpression(this.params, this.colName, colValue.columnName, endPosition - 1);
            this.colName = colValue.columnName;
            this.column = this.params.colModel.getColDefCol(this.colId);
            if (this.column) {
                this.baseCellDataType = this.params.dataTypeSvc?.getBaseDataType(this.column) ?? 'text';
                return true;
            }
        }
        if (fromComplete) {
            this.valid = false;
        }
        this.baseCellDataType = 'text';
        return false;
    }
}

class OperatorParser implements Parser {
    public readonly type = 'operator';

    public valid = true;
    public endPosition: number | undefined;
    public expectedNumOperands: number = 0;
    private operator: string = '';
    private parsedOperator: string;

    constructor(
        private params: FilterExpressionParserParams,
        public readonly startPosition: number,
        private readonly baseCellDataType: BaseCellDataType
    ) {}

    public parse(char: string, position: number): boolean | undefined {
        if (char === ' ' || char === ')') {
            const isMatch = this.parseOperator(false, position - 1);
            if (isMatch) {
                return true;
            } else {
                this.operator += char;
            }
        } else {
            this.operator += char;
        }
        return undefined;
    }

    public complete(position: number): void {
        this.parseOperator(true, position);
    }

    public getValidationError(): FilterExpressionValidationError | null {
        return this.valid
            ? null
            : {
                  message: this.params.advFilterExpSvc.translate('advancedFilterValidationInvalidOption'),
                  startPosition: this.startPosition,
                  endPosition: this.endPosition ?? this.params.expression.length - 1,
              };
    }

    public getDisplayValue(): string {
        return this.operator;
    }

    public getOperatorKey(): string {
        return this.parsedOperator;
    }

    private parseOperator(fromComplete: boolean, endPosition: number): boolean {
        const operatorForType = this.params.advFilterExpSvc.getDataTypeExpressionOperator(this.baseCellDataType)!;
        const parsedOperator = operatorForType.findOperator(this.operator);
        this.endPosition = endPosition;
        if (parsedOperator) {
            this.parsedOperator = parsedOperator;
            const operator = operatorForType.operators[parsedOperator];
            this.expectedNumOperands = operator.numOperands;
            const operatorDisplayValue = operator.displayValue;
            checkAndUpdateExpression(this.params, this.operator, operatorDisplayValue, endPosition);
            this.operator = operatorDisplayValue;
            return true;
        }
        const isPartialMatch = parsedOperator === null;
        if (fromComplete || !isPartialMatch) {
            this.valid = false;
        }
        return false;
    }
}

class OperandParser implements Parser {
    public readonly type = 'operand';

    public valid = true;
    public endPosition: number | undefined;
    private quotes: `'` | `"` | undefined;
    private operand = '';
    private modelValue: bigint | number | string;
    private validationMessage: string | null = null;

    constructor(
        private params: FilterExpressionParserParams,
        public readonly startPosition: number,
        private readonly baseCellDataType: BaseCellDataType,
        private readonly column: AgColumn | null | undefined
    ) {}

    public parse(char: string, position: number): boolean | undefined {
        if (char === ' ') {
            if (this.quotes) {
                this.operand += char;
            } else {
                this.parseOperand(false, position);
                return true;
            }
        } else if (char === ')') {
            if (this.baseCellDataType === 'number' || this.baseCellDataType === 'bigint' || !this.quotes) {
                this.parseOperand(false, position - 1);
                return true;
            } else {
                this.operand += char;
            }
        } else if (!this.operand && !this.quotes && (char === `'` || char === `"`)) {
            this.quotes = char;
        } else if (this.quotes && char === this.quotes) {
            this.parseOperand(false, position);
            return false;
        } else {
            this.operand += char;
        }
        return undefined;
    }

    public complete(position: number): void {
        this.parseOperand(true, position);
    }

    public getValidationError(): FilterExpressionValidationError | null {
        return this.validationMessage
            ? {
                  message: this.validationMessage,
                  startPosition: this.startPosition,
                  endPosition: this.endPosition ?? this.params.expression.length - 1,
              }
            : null;
    }

    public getRawValue(): string {
        return this.operand;
    }

    public getModelValue(): string | number | bigint{
        return this.modelValue;
    }

    private parseOperand(fromComplete: boolean, position: number): void {
        const { advFilterExpSvc } = this.params;
        this.endPosition = position;
        this.modelValue = this.operand;
        if (fromComplete && this.quotes) {
            // missing end quote
            this.valid = false;
            this.validationMessage = advFilterExpSvc.translate('advancedFilterValidationMissingQuote');
        } else if (this.modelValue === '') {
            this.valid = false;
            this.validationMessage = advFilterExpSvc.translate('advancedFilterValidationMissingValue');
        } else {
            const modelValue = advFilterExpSvc.getOperandModelValue(this.operand, this.baseCellDataType, this.column!);
            if (modelValue != null) {
                this.modelValue = modelValue;
            }
            switch (this.baseCellDataType) {
                case 'number':
                    if (this.quotes || isNaN(this.modelValue as number)) {
                        this.valid = false;
                        this.validationMessage = advFilterExpSvc.translate('advancedFilterValidationNotANumber');
                    }
                    break;
                case 'bigint':
                    if (this.quotes || isNaN(Number(this.modelValue))) {
                        this.valid = false;
                        this.validationMessage = advFilterExpSvc.translate('advancedFilterValidationNotANumber');
                    }
                break;
                case 'date':
                case 'dateString':
                    if (modelValue == null) {
                        this.valid = false;
                        this.validationMessage = advFilterExpSvc.translate('advancedFilterValidationInvalidDate');
                    }
                    break;
            }
        }
    }
}

export const COL_FILTER_EXPRESSION_START_CHAR = '[';
export const COL_FILTER_EXPRESSION_END_CHAR = ']';

export class ColFilterExpressionParser {
    private endPosition: number | undefined;
    private isAwaiting = true;
    private parser: Parser | undefined;
    private columnParser: ColumnParser | undefined;
    private operatorParser: OperatorParser | undefined;
    private operandParser: OperandParser | undefined;

    constructor(
        private params: FilterExpressionParserParams,
        public readonly startPosition: number
    ) {}

    public parseExpression(): number {
        let i = this.startPosition;
        const { expression } = this.params;
        while (i < expression.length) {
            const char = expression[i];
            if (char === ' ' && this.isAwaiting) {
                // ignore duplicate spaces
            } else {
                this.isAwaiting = false;
                if (!this.parser) {
                    let parser: Parser;
                    if (!this.columnParser) {
                        this.columnParser = new ColumnParser(this.params, i);
                        parser = this.columnParser;
                    } else if (!this.operatorParser) {
                        this.operatorParser = new OperatorParser(this.params, i, this.columnParser!.baseCellDataType);
                        parser = this.operatorParser;
                    } else {
                        this.operandParser = new OperandParser(
                            this.params,
                            i,
                            this.columnParser!.baseCellDataType,
                            this.columnParser!.column
                        );
                        parser = this.operandParser;
                    }
                    this.parser = parser;
                }
                const hasCompletedOnPrevChar = this.parser.parse(char, i);
                if (hasCompletedOnPrevChar != null) {
                    if (this.isComplete()) {
                        return this.returnEndPosition(hasCompletedOnPrevChar ? i - 1 : i, true);
                    }
                    this.parser = undefined;
                    this.isAwaiting = true;
                }
            }
            i++;
        }
        this.parser?.complete?.(i - 1);
        return this.returnEndPosition(i);
    }

    public isValid(): boolean {
        return (
            this.isComplete() &&
            this.columnParser!.valid &&
            this.operatorParser!.valid &&
            (!this.operandParser || this.operandParser!.valid)
        );
    }

    public getValidationError(): FilterExpressionValidationError | null {
        const validationError =
            this.columnParser?.getValidationError() ??
            this.operatorParser?.getValidationError() ??
            this.operandParser?.getValidationError();
        if (validationError) {
            return validationError;
        }
        const endPosition = this.params.expression.length;
        let translateKey: keyof typeof ADVANCED_FILTER_LOCALE_TEXT | undefined;
        if (!this.columnParser) {
            translateKey = 'advancedFilterValidationMissingColumn';
        } else if (!this.operatorParser) {
            translateKey = 'advancedFilterValidationMissingOption';
        } else if (this.operatorParser.expectedNumOperands && !this.operandParser) {
            translateKey = 'advancedFilterValidationMissingValue';
        }
        if (translateKey) {
            return {
                message: this.params.advFilterExpSvc.translate(translateKey),
                startPosition: endPosition,
                endPosition,
            };
        }
        return null;
    }

    public getFunctionString(params: FilterExpressionFunctionParams): string {
        return this.getFunctionCommon(params, (operandIndex, operatorIndex, colId, evaluatorParamsIndex) => {
            const escapedColId = escapeQuotes(colId);
            const operand = operandIndex == null ? '' : `, params.operands[${operandIndex}]`;
            return `params.operators[${operatorIndex}].evaluator(expressionProxy.getValue('${escapedColId}', node), node, params.evaluatorParams[${evaluatorParamsIndex}]${operand})`;
        });
    }

    public getFunctionParsed(params: FilterExpressionFunctionParams): FilterExpressionFunction {
        return this.getFunctionCommon(params, (operandIndex, operatorIndex, colId, evaluatorParamsIndex) => {
            return (expressionProxy, node, p) =>
                p.operators[operatorIndex].evaluator(
                    expressionProxy.getValue(colId, node),
                    node,
                    p.evaluatorParams[evaluatorParamsIndex],
                    operandIndex == null ? undefined : p.operands[operandIndex]
                );
        });
    }

    public getAutocompleteListParams(position: number): AutocompleteListParams | undefined {
        if (this.isColumnPosition(position)) {
            return this.getColumnAutocompleteListParams(position);
        }
        if (this.isOperatorPosition(position)) {
            return this.getOperatorAutocompleteListParams(position);
        }
        if (this.isBeyondEndPosition(position)) {
            return undefined;
        }
        return { enabled: false };
    }

    public updateExpression(
        position: number,
        updateEntry: AutocompleteEntry,
        type?: string
    ): AutocompleteUpdate | null {
        const { expression } = this.params;
        if (this.isColumnPosition(position)) {
            return updateExpression(
                this.params.expression,
                this.startPosition,
                this.columnParser?.getColId()
                    ? this.columnParser!.endPosition!
                    : findEndPosition(expression, position).endPosition,
                this.params.advFilterExpSvc.getColumnValue(updateEntry),
                true
            );
        } else if (this.isOperatorPosition(position)) {
            const baseCellDataType = this.getBaseCellDataTypeFromOperatorAutocompleteType(type);
            const hasOperand = this.hasOperand(baseCellDataType, updateEntry.key);
            const doesOperandNeedQuotes = hasOperand && this.doesOperandNeedQuotes(baseCellDataType);
            let update: AutocompleteUpdate;
            if (this.operatorParser?.startPosition != null && position < this.operatorParser.startPosition) {
                // in between multiple spaces, just insert direct
                update = updateExpression(
                    expression,
                    position,
                    position,
                    updateEntry.displayValue ?? updateEntry.key,
                    hasOperand,
                    doesOperandNeedQuotes
                );
            } else {
                let endPosition: number;
                let empty = false;
                if (this.operatorParser?.getOperatorKey()) {
                    endPosition = this.operatorParser!.endPosition!;
                } else {
                    const { endPosition: calculatedEndPosition, isEmpty } = findEndPosition(
                        expression,
                        position,
                        true,
                        true
                    );
                    endPosition = calculatedEndPosition;
                    empty = isEmpty;
                }
                update = updateExpression(
                    expression,
                    findStartPosition(expression, this.columnParser!.endPosition! + 1, endPosition),
                    endPosition,
                    updateEntry.displayValue ?? updateEntry.key,
                    hasOperand,
                    doesOperandNeedQuotes,
                    empty
                );
            }
            return { ...update, hideAutocomplete: !hasOperand };
        }
        return null;
    }

    public getModel(): AdvancedFilterModel {
        const colId = this.columnParser!.getColId();
        const model = {
            filterType: this.columnParser!.baseCellDataType,
            colId,
            type: this.operatorParser!.getOperatorKey(),
        };
        if (this.operatorParser!.expectedNumOperands) {
            (model as any).filter = this.operandParser!.getModelValue();
        }
        return model as AdvancedFilterModel;
    }

    private getFunctionCommon<T>(
        params: FilterExpressionFunctionParams,
        processFunc: (
            operandIndex: number | undefined,
            operatorIndex: number,
            colId: string,
            evaluatorParamsIndex: number
        ) => T
    ) {
        const colId = this.columnParser!.getColId();
        const operator = this.operatorParser?.getOperatorKey();
        const { operators, evaluatorParams, operands } = params;
        const operatorForColumn = this.params.advFilterExpSvc.getExpressionOperator(
            this.columnParser!.baseCellDataType,
            operator
        );
        const operatorIndex = this.addToListAndGetIndex(operators, operatorForColumn);
        const evaluatorParamsForColumn = this.params.advFilterExpSvc.getExpressionEvaluatorParams(colId);
        const evaluatorParamsIndex = this.addToListAndGetIndex(evaluatorParams, evaluatorParamsForColumn);
        const operandIndex =
            this.operatorParser?.expectedNumOperands === 0
                ? undefined
                : this.addToListAndGetIndex(operands, this.getOperandValue());
        return processFunc(operandIndex, operatorIndex, colId, evaluatorParamsIndex);
    }

    private getOperandValue(): any {
        let operand: any = this.operandParser!.getRawValue();
        const { baseCellDataType, column } = this.columnParser!;
        switch (baseCellDataType) {
            case 'number':
                operand = Number(operand);
                break;
            case 'bigint':
                operand = BigInt(operand);
                break;
            case 'date':
            case 'dateString':
                operand = this.params.valueSvc.parseValue(column!, null, operand, undefined);
                break;
        }
        if (baseCellDataType === 'dateString') {
            const { dataTypeSvc } = this.params;
            return dataTypeSvc ? dataTypeSvc.getDateParserFunction(column)(operand as string) : operand;
        }
        return operand;
    }

    private isComplete(): boolean {
        return !!(
            this.operatorParser &&
            (!this.operatorParser.expectedNumOperands ||
                (this.operatorParser.expectedNumOperands && this.operandParser))
        );
    }

    private isColumnPosition(position: number): boolean {
        return (
            !this.columnParser || this.columnParser.endPosition == null || position <= this.columnParser.endPosition + 1
        );
    }

    private isOperatorPosition(position: number): boolean {
        return (
            !this.operatorParser ||
            this.operatorParser.endPosition == null ||
            position <= this.operatorParser.endPosition + 1
        );
    }

    private isBeyondEndPosition(position: number): boolean {
        return (
            this.isComplete() &&
            this.endPosition != null &&
            position > this.endPosition + 1 &&
            this.endPosition + 1 < this.params.expression.length
        );
    }

    private returnEndPosition(returnPosition: number, treatAsEnd?: boolean): number {
        this.endPosition = treatAsEnd ? returnPosition : returnPosition - 1;
        return returnPosition;
    }

    private getColumnAutocompleteListParams(position: number): AutocompleteListParams {
        return this.params.advFilterExpSvc.generateAutocompleteListParams(
            this.params.advFilterExpSvc.getColumnAutocompleteEntries(),
            'column',
            this.getColumnSearchString(position)
        );
    }

    private getColumnSearchString(position: number): string {
        const columnName = this.columnParser?.getDisplayValue() ?? '';
        const searchString = getSearchString(
            columnName,
            position,
            this.columnParser?.endPosition == null ? this.params.expression.length : this.columnParser.endPosition + 1
        );
        const containsStartChar = this.columnParser?.hasStartChar && searchString.length > 0;
        const containsEndChar = this.columnParser?.hasEndChar && searchString.length === columnName.length + 2;
        if (containsStartChar) {
            return searchString.slice(1, containsEndChar ? -1 : undefined);
        }
        return searchString;
    }

    private getOperatorAutocompleteListParams(position: number): AutocompleteListParams {
        const column = this.columnParser?.column;
        if (!column) {
            return { enabled: false };
        }

        const baseCellDataType = this.columnParser!.baseCellDataType;
        const searchString =
            this.operatorParser?.startPosition != null && position < this.operatorParser.startPosition
                ? ''
                : getSearchString(
                      this.operatorParser?.getDisplayValue() ?? '',
                      position,
                      this.operatorParser?.endPosition == null
                          ? this.params.expression.length
                          : this.operatorParser.endPosition + 1
                  );
        return this.params.advFilterExpSvc.generateAutocompleteListParams(
            this.params.advFilterExpSvc.getOperatorAutocompleteEntries(column, baseCellDataType),
            `operator-${baseCellDataType}`,
            searchString
        );
    }

    private getBaseCellDataTypeFromOperatorAutocompleteType(type?: string): BaseCellDataType | undefined {
        return type?.replace('operator-', '') as BaseCellDataType;
    }

    private hasOperand(baseCellDataType?: BaseCellDataType, operator?: string): boolean {
        return (
            !baseCellDataType ||
            !operator ||
            (this.params.advFilterExpSvc.getExpressionOperator(baseCellDataType, operator)?.numOperands ?? 0) > 0
        );
    }

    private doesOperandNeedQuotes(baseCellDataType?: BaseCellDataType): boolean {
        return baseCellDataType !== 'number' && baseCellDataType !== "bigint";
    }

    private addToListAndGetIndex<T>(list: T[], value: T): number {
        const index = list.length;
        list.push(value);
        return index;
    }
}
