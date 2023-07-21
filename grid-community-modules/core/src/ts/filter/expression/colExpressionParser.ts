import { BaseCellDataType } from "../../entities/dataType";
import { AutocompleteEntry, AutocompleteListParams, AutocompleteUpdate } from "../../widgets/autocompleteParams";
import { NUMBER_NUM_OPERANDS, STRING_NUM_OPERANDS } from "./expressionEvaluators";
import { ExpressionParams, getSearchString, updateExpression, updateExpressionByWord } from "./expressionUtils";

export class ColExpressionParser {
    public static readonly COL_START_CHAR = '[';
    public static readonly COL_END_CHAR = ']';

    private valid: boolean = true;
    private complete: boolean = false;
    private endPosition: number | undefined = undefined;
    private expectingColumn: boolean = true;
    private startedColumn: boolean = false;
    private quotedColumn: boolean = false;
    private columnEndPosition: number;
    private expectingOperator: boolean = false;
    private startedOperator: boolean = false;
    private operatorEndPosition: number;
    private activeOperand: number = -1;
    private startedOperand: boolean = false;
    private quotedOperand: boolean = false;
    private colName: string = '';
    private colId: string | null;
    private baseCellDataType: BaseCellDataType;
    private operator: string = '';
    private expectedNumOperands: number = 0;
    private operands: string[] = [];

    constructor(
        private params: ExpressionParams,
        public readonly startPosition: number
    ) {}

    public parseExpression(): number {
        let i = this.startPosition;
        const { expression } = this.params;
        while (i < expression.length) {
            const char = expression[i];
            if (char === ' ') {
                if (this.expectingColumn) {
                    if (this.startedColumn) {
                        if (this.quotedColumn) {
                            this.colName += char;
                        } else {
                            this.expectingColumn = false;
                            this.expectingOperator = true;
                            this.parseColumn();
                            this.columnEndPosition = i - 1;
                        }
                    }
                } else if (this.expectingOperator) {
                    if (this.startedOperator) {
                        this.expectingOperator = false;
                        this.parseOperator();
                        this.operatorEndPosition = i - 1;
                        if (this.expectedNumOperands > 0) {
                            this.activeOperand = 0;
                            this.operands.push('');
                        } else {
                            this.complete = true;
                            return this.returnEndPosition(i);
                        }
                    }
                } else if (this.activeOperand >= 0) {
                    if (this.startedOperand) {
                        if (this.quotedOperand) {
                            this.operands[this.activeOperand] += char;
                        } else {
                            if (this.onOperandComplete()) {
                                return this.returnEndPosition(i);
                            }
                        }
                    }
                }
            } else if (char === ')') {
                this.onComplete();
                return this.returnEndPosition(i - 1, true);
            } else if (char === ColExpressionParser.COL_START_CHAR && this.expectingColumn) {
                // TODO - add handling for if [ or ] appear in the columns names
                this.quotedColumn = true;
                this.startedColumn = true;
            } else if (char === ColExpressionParser.COL_END_CHAR && this.expectingColumn && this.quotedColumn) {
                this.expectingColumn = false;
                this.expectingOperator = true;
                this.parseColumn();
                this.columnEndPosition = i;
            } else if (char === `'` && this.activeOperand >= 0) {
                if (this.quotedOperand) {
                    if (this.onOperandComplete()) {
                        return this.returnEndPosition(i, true);
                    }
                    this.quotedOperand = false;
                } else {
                    this.quotedOperand = true;
                    this.startedOperand = true;
                }
            } else if (this.expectingColumn) {
                this.startedColumn = true;
                this.colName += char;
            } else if (this.expectingOperator) {
                this.startedOperator = true;
                this.operator += char;
            } else if (this.activeOperand >= 0) {
                this.startedOperand = true;
                this.operands[this.activeOperand] += char;
            } else {
                return this.returnEndPosition(i);
            }
            i++;
        }
        this.onComplete();
        return this.returnEndPosition(i);
    }

    public isValid(): boolean {
        return this.valid && this.complete;
    }

    public getExpression(): string {
        const operands = this.expectedNumOperands === 0 ? '' : `, ${this.operands.join(', ')}`;
        return `expressionProxy.evaluators.${this.baseCellDataType}['${this.operator}'](expressionProxy.getValue('${this.colId}', node)${operands})`;
    }

    public getAutocompleteListParams(position: number): AutocompleteListParams | undefined {
        if (this.isColumnPosition(position)) {
            return this.params.columnAutocompleteTypeGenerator(
                getSearchString(this.colName, position, this.columnEndPosition == null
                    ? this.params.expression.length
                    : (this.columnEndPosition + 1))
            );
        }
        if (this.isOperatorPosition(position)) { return this.getOperatorAutocompleteType(position); }
        if (this.isBeyondEndPosition(position)) { return undefined; }
        return { enabled: false };
    }

    public updateExpression(position: number, updateEntry: AutocompleteEntry): AutocompleteUpdate | null {
        if (this.isColumnPosition(position)) {
            return updateExpression(
                this.params.expression,
                this.startPosition,
                this.columnEndPosition ?? this.params.expression.length - 1,
                this.params.columnValueCreator(updateEntry)
            );
        }
        return updateExpressionByWord(this.params.expression, position, updateEntry);
    }

    private isColumnPosition(position: number): boolean {
        return this.columnEndPosition == null || position <= this.columnEndPosition + 1;
    }

    private isOperatorPosition(position: number): boolean {
        return this.operatorEndPosition == null || position <= this.operatorEndPosition + 1;
    }

    private isBeyondEndPosition(position: number): boolean {
        return this.complete && this.endPosition != null && position > this.endPosition + 1 && this.endPosition + 1 < this.params.expression.length;
    }

    private parseColumn(): void {
        this.colId = this.params.colIdResolver(this.colName);
        if (this.colId) {
            const column = this.params.columnModel.getGridColumn(this.colId);
            if (column) {
                this.baseCellDataType = this.params.dataTypeService.getBaseDataType(column) ?? 'text';
                return;
            }
        }
        this.valid = false;
        this.baseCellDataType = 'text';
    }

    private parseOperator(): void {
        const { numOperands } = this.getValidOperators();
        const numOperand = numOperands[this.operator];
        if (numOperand != null) {
            this.expectedNumOperands = numOperand;
        } else {
            this.valid = false;
        }
    }

    private parseOperand(): void {
        // TODO escape quotes in string
        const escapeAndQuoteString = (operand: string) => `'${operand}'`;
        let parser: (operand: string) => string;
        switch (this.baseCellDataType) {
            case 'number': {
                parser = operand => {
                    const value = parseFloat(operand);
                    if (isNaN(value)) {
                        this.valid = false;
                    }
                    return operand;
                }
                break;
            }
            default: {
                parser = operand => escapeAndQuoteString(operand);
                break;
            }
        }
        this.operands = this.operands.map(parser);
    }

    private getValidOperators(): { numOperands: { [operator: string]: number }, type: string } {
        if (this.baseCellDataType === 'number') {
            return {
                numOperands: NUMBER_NUM_OPERANDS,
                type: 'operator-number'
            };
        }
        return {
            numOperands: STRING_NUM_OPERANDS,
            type: 'operator-text'
        };
    }

    private onComplete(): void {
        if (this.expectingOperator && this.startedOperator) {
            this.parseOperator();
            if (this.expectedNumOperands > 0) {
                this.valid = false;
            } else {
                this.complete = true
            }
        } else if (this.activeOperand >= 0 && this.startedOperand) {
            this.parseOperand();
            if (this.activeOperand >= this.expectedNumOperands - 1) {
                this.complete = true;
            }
        } else {
            this.valid = false;
        }
    }

    private onOperandComplete(): boolean {
        this.parseOperand();
        this.activeOperand++;
        this.startedOperand = false;
        if (this.activeOperand >= this.expectedNumOperands) {
            this.activeOperand = -1;
            this.complete = true;
            return true;
        } else {
            this.operands.push('');
        }
        return false;
    }

    private returnEndPosition(returnPosition: number, treatAsEnd?: boolean): number {
        this.endPosition = treatAsEnd ? returnPosition : returnPosition - 1;
        return returnPosition;
    }

    private getOperatorAutocompleteType(position: number): AutocompleteListParams {
        const { numOperands, type } = this.getValidOperators();
        const entries = Object.keys(numOperands).map(key => ({ key }));
        const searchString = getSearchString(
            this.operator,
            position,
            this.operatorEndPosition == null ? this.params.expression.length : (this.operatorEndPosition + 1)
        );
        return {
            enabled: true,
            type,
            searchString,
            entries
        };
    }
}
