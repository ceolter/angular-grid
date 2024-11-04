import type { AdvancedFilterModel } from 'ag-grid-community';

import type { AutocompleteEntry, AutocompleteListParams } from './autocomplete/autocompleteParams';
import type {
    AutocompleteUpdate,
    FilterExpressionFunction,
    FilterExpressionFunctionParams,
    FilterExpressionParserParams,
} from './filterExpressionUtils';
import { JoinFilterExpressionParser } from './joinFilterExpressionParser';

export class FilterExpressionParser {
    private joinExpressionParser: JoinFilterExpressionParser;
    private valid: boolean = false;

    constructor(private params: FilterExpressionParserParams) {}

    public parseExpression(): string {
        this.joinExpressionParser = new JoinFilterExpressionParser(this.params, 0);
        const i = this.joinExpressionParser.parseExpression();
        this.valid = i >= this.params.expression.length - 1 && this.joinExpressionParser.isValid();
        return this.params.expression;
    }

    public isValid(): boolean {
        return this.valid;
    }

    public getValidationMessage(): string | null {
        const error = this.joinExpressionParser.getValidationError();
        if (!error) {
            return null;
        }
        const { message, startPosition, endPosition } = error;
        return startPosition < this.params.expression.length
            ? this.params.advFilterExpSvc.translate('advancedFilterValidationMessage', [
                  message,
                  this.params.expression.slice(startPosition, endPosition + 1).trim(),
              ])
            : this.params.advFilterExpSvc.translate('advancedFilterValidationMessageAtEnd', [message]);
    }

    public getFunctionString(): {
        functionString: string;
        params: FilterExpressionFunctionParams;
    } {
        const params = this.createFunctionParams();
        return {
            functionString: `return ${this.joinExpressionParser.getFunctionString(params)};`,
            params,
        };
    }

    public getFunctionParsed(): {
        expressionFunction: FilterExpressionFunction;
        params: FilterExpressionFunctionParams;
    } {
        const params = this.createFunctionParams();
        return {
            expressionFunction: this.joinExpressionParser.getFunctionParsed(params),
            params,
        };
    }

    public getAutocompleteListParams(position: number): AutocompleteListParams {
        return this.joinExpressionParser.getAutocompleteListParams(position) ?? { enabled: false };
    }

    public updateExpression(position: number, updateEntry: AutocompleteEntry, type?: string): AutocompleteUpdate {
        return this.joinExpressionParser.updateExpression(position, updateEntry, type)!;
    }

    public getModel(): AdvancedFilterModel | null {
        return this.isValid() ? this.joinExpressionParser.getModel() : null;
    }

    private createFunctionParams(): FilterExpressionFunctionParams {
        return {
            operands: [],
            operators: [],
            evaluatorParams: [],
        };
    }
}
