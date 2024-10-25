import type { BeanCollection } from '../../context/context';
import type { AgColumn } from '../../entities/agColumn';
import type { Column } from '../../interfaces/iColumn';

export function isColumnHovered(beans: BeanCollection, column: Column): boolean {
    return !!beans.colHover?.isHovered(column as AgColumn);
}
