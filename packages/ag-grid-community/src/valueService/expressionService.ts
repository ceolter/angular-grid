import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import { _error } from '../validation/logging';

export class ExpressionService extends BeanStub implements NamedBean {
    beanName = 'expressionSvc' as const;

    private expressionToFunctionCache = {} as any;

    public evaluate(expression: string | undefined, params: any): any {
        if (typeof expression === 'string') {
            // valueGetter is an expression, so execute the expression
            return this.evaluateExpression(expression, params);
        } else {
            _error(15, { expression });
        }
    }

    private evaluateExpression(expression: string, params: any): any {
        try {
            const javaScriptFunction = this.createExpressionFunction(expression);
            // the params don't have all these values, rather we add every possible
            // value a params can have, which makes whatever is in the params available.
            const result = javaScriptFunction(
                params.value,
                params.context,
                params.oldValue,
                params.newValue,
                params.value,
                params.node,
                params.data,
                params.colDef,
                params.rowIndex,
                params.api,
                params.getValue,
                params.column,
                params.columnGroup
            );
            return result;
        } catch (e) {
            // the expression failed, which can happen, as it's the client that
            // provides the expression. so print a nice message
            _error(16, { expression, params, e });
            return null;
        }
    }

    private createExpressionFunction(expression: any) {
        // check cache first
        if (this.expressionToFunctionCache[expression]) {
            return this.expressionToFunctionCache[expression];
        }
        // if not found in cache, return the function
        const functionBody = this.createFunctionBody(expression);
        const theFunction = new Function(
            'x, ctx, oldValue, newValue, value, node, data, colDef, rowIndex, api, getValue, column, columnGroup',
            functionBody
        );

        // store in cache
        this.expressionToFunctionCache[expression] = theFunction;

        return theFunction;
    }

    private createFunctionBody(expression: any) {
        // if the expression has the 'return' word in it, then use as is,
        // if not, then wrap it with return and ';' to make a function
        if (expression.indexOf('return') >= 0) {
            return expression;
        } else {
            return 'return ' + expression + ';';
        }
    }
}
