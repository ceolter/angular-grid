import type { BeanCollection } from '../context/context';

export function onSortChanged(beans: BeanCollection) {
    beans.sortSvc?.onSortChanged('api');
}
