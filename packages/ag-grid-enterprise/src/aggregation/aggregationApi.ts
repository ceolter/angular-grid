import type { BeanCollection, ColDef, Column, IAggFunc } from 'ag-grid-community';

import type { ValueColsSvc } from '../pivot/valueColsSvc';

export function addAggFuncs(beans: BeanCollection, aggFuncs: { [key: string]: IAggFunc }): void {
    if (beans.aggFuncSvc) {
        beans.aggFuncSvc.addAggFuncs(aggFuncs);
    }
}

export function clearAggFuncs(beans: BeanCollection): void {
    if (beans.aggFuncSvc) {
        beans.aggFuncSvc.clear();
    }
}

export function setColumnAggFunc(
    beans: BeanCollection,
    key: string | ColDef | Column,
    aggFunc: string | IAggFunc | null | undefined
): void {
    (beans.valueColsSvc as ValueColsSvc)?.setColumnAggFunc?.(key, aggFunc, 'api');
}
