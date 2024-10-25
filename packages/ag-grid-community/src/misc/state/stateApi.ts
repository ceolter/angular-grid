import type { BeanCollection } from '../../context/context';
import type { GridState } from '../../interfaces/gridState';

export function getState(beans: BeanCollection): GridState {
    return beans.stateSvc?.getState() ?? {};
}
