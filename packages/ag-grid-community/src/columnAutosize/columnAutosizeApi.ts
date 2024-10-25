import type { BeanCollection } from '../context/context';
import type { ColDef } from '../entities/colDef';
import type { ISizeColumnsToFitParams } from '../interfaces/autoSize';
import type { Column } from '../interfaces/iColumn';

export function sizeColumnsToFit(beans: BeanCollection, paramsOrGridWidth?: ISizeColumnsToFitParams | number) {
    if (typeof paramsOrGridWidth === 'number') {
        beans.colAutosize?.sizeColumnsToFit(paramsOrGridWidth, 'api');
    } else {
        beans.colAutosize?.sizeColumnsToFitGridBody(paramsOrGridWidth);
    }
}

export function autoSizeColumns(beans: BeanCollection, keys: (string | ColDef | Column)[], skipHeader?: boolean): void {
    beans.colAutosize?.autoSizeCols({ colKeys: keys, skipHeader: skipHeader, source: 'api' });
}

export function autoSizeAllColumns(beans: BeanCollection, skipHeader?: boolean): void {
    beans.colAutosize?.autoSizeAllColumns('api', skipHeader);
}
