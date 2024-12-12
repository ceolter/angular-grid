import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanName } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { ColDef, ValueGetterParams } from '../entities/colDef';
import type { IRowNode } from '../interfaces/iRowNode';

export class FilterValueService extends BeanStub implements NamedBean {
    beanName: BeanName = 'filterValueSvc';

    public getValue(column: AgColumn, rowNode?: IRowNode | null) {
        if (!rowNode) {
            return;
        }
        const colDef = column.getColDef();
        const { filterValueGetter } = colDef;
        if (filterValueGetter) {
            return this.executeFilterValueGetter(filterValueGetter, rowNode.data, column, rowNode, colDef);
        }
        return this.beans.valueSvc.getValue(column, rowNode);
    }

    private executeFilterValueGetter(
        // eslint-disable-next-line @typescript-eslint/ban-types
        valueGetter: string | Function,
        data: any,
        column: AgColumn,
        node: IRowNode,
        colDef: ColDef
    ): any {
        const { expressionSvc, valueSvc } = this.beans;
        const params: ValueGetterParams = this.gos.addGridCommonParams({
            data,
            node,
            column,
            colDef,
            getValue: valueSvc.getValueCallback.bind(valueSvc, node),
        });

        if (typeof valueGetter === 'function') {
            return valueGetter(params);
        }
        return expressionSvc?.evaluate(valueGetter, params);
    }
}
