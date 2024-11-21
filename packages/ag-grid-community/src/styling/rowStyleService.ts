import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { RowClassParams, RowStyle } from '../entities/gridOptions';
import type { RowNode } from '../entities/rowNode';
import type { WithoutGridCommon } from '../interfaces/iCommon';
import { processClassRules } from './stylingUtils';

export function calculateRowLevel(rowNode: RowNode): number {
    if (rowNode.group) {
        return rowNode.level;
    }

    const parent = rowNode.parent;
    // if a leaf, and a parent exists, put a level of the parent, else put level of 0 for top level item
    return parent ? parent.level + 1 : 0;
}

export class RowStyleService extends BeanStub implements NamedBean {
    beanName = 'rowStyleSvc' as const;

    public processClassesFromGridOptions(classes: string[], rowNode: RowNode): void {
        const gos = this.gos;
        const process = (rowCls: string | string[] | undefined) => {
            if (typeof rowCls === 'string') {
                classes.push(rowCls);
            } else if (Array.isArray(rowCls)) {
                rowCls.forEach((e) => classes.push(e));
            }
        };

        // part 1 - rowClass
        const rowClass = gos.get('rowClass');
        if (rowClass) {
            process(rowClass);
        }

        // part 2 - rowClassFunc
        const rowClassFunc = gos.getCallback('getRowClass');

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
        const { gos, expressionSvc } = this.beans;
        const rowClassParams: RowClassParams = gos.addGridCommonParams({
            data: rowNode.data,
            node: rowNode,
            rowIndex: rowNode.rowIndex!,
        });

        processClassRules(
            expressionSvc,
            undefined,
            gos.get('rowClassRules'),
            rowClassParams,
            onApplicableClass,
            onNotApplicableClass
        );
    }

    public processStylesFromGridOptions(rowNode: RowNode): RowStyle | undefined {
        const gos = this.gos;
        // part 1 - rowStyle
        const rowStyle = gos.get('rowStyle');

        // part 1 - rowStyleFunc
        const rowStyleFunc = gos.getCallback('getRowStyle');
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
