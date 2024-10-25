import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { RowClassParams, RowStyle } from '../entities/gridOptions';
import type { RowNode } from '../entities/rowNode';
import type { WithoutGridCommon } from '../interfaces/iCommon';
import type { ExpressionService } from '../valueService/expressionService';
import { processClassRules } from './stylingUtils';

export function calculateRowLevel(rowNode: RowNode): number {
    if (rowNode.group) {
        return rowNode.level;
    }

    // if a leaf, and a parent exists, put a level of the parent, else put level of 0 for top level item
    return rowNode.parent ? rowNode.parent.level + 1 : 0;
}

export class RowStyleService extends BeanStub implements NamedBean {
    beanName = 'rowStyleSvc' as const;

    private expressionSvc?: ExpressionService;

    public wireBeans(beans: BeanCollection): void {
        this.expressionSvc = beans.expressionSvc;
    }

    public processClassesFromGridOptions(classes: string[], rowNode: RowNode): void {
        const process = (rowCls: string | string[] | undefined) => {
            if (typeof rowCls === 'string') {
                classes.push(rowCls);
            } else if (Array.isArray(rowCls)) {
                rowCls.forEach((e) => classes.push(e));
            }
        };

        // part 1 - rowClass
        const rowClass = this.gos.get('rowClass');
        if (rowClass) {
            process(rowClass);
        }

        // part 2 - rowClassFunc
        const rowClassFunc = this.gos.getCallback('getRowClass');

        if (rowClassFunc) {
            const params: WithoutGridCommon<RowClassParams> = {
                data: rowNode.data,
                node: rowNode,
                rowIndex: rowNode.rowIndex!,
            };
            const rowClassFuncResult = rowClassFunc(params);
            process(rowClassFuncResult);
        }
    }

    public preProcessRowClassRules(classes: string[], rowNode: RowNode): void {
        this.processRowClassRules(
            rowNode,
            (className: string) => {
                classes.push(className);
            },
            () => {
                // not catered for, if creating, no need
                // to remove class as it was never there
            }
        );
    }

    public processRowClassRules(
        rowNode: RowNode,
        onApplicableClass: (className: string) => void,
        onNotApplicableClass?: (className: string) => void
    ): void {
        const rowClassParams: RowClassParams = this.gos.addGridCommonParams({
            data: rowNode.data,
            node: rowNode,
            rowIndex: rowNode.rowIndex!,
        });

        processClassRules(
            this.expressionSvc,
            undefined,
            this.gos.get('rowClassRules'),
            rowClassParams,
            onApplicableClass,
            onNotApplicableClass
        );
    }

    public processStylesFromGridOptions(rowNode: RowNode): RowStyle | undefined {
        // part 1 - rowStyle
        const rowStyle = this.gos.get('rowStyle');

        // part 1 - rowStyleFunc
        const rowStyleFunc = this.gos.getCallback('getRowStyle');
        let rowStyleFuncResult: any;

        if (rowStyleFunc) {
            const params: WithoutGridCommon<RowClassParams> = {
                data: rowNode.data,
                node: rowNode,
                rowIndex: rowNode.rowIndex!,
            };
            rowStyleFuncResult = rowStyleFunc(params);
        }
        if (rowStyleFuncResult || rowStyle) {
            return Object.assign({}, rowStyle, rowStyleFuncResult);
        }
        return undefined;
    }
}
