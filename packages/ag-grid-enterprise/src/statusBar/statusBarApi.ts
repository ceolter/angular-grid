import type { BeanCollection, IStatusPanel } from 'ag-grid-community';
import { _unwrapUserComp } from 'ag-grid-community';

import type { StatusBarService } from './statusBarService';

export function getStatusPanel<TStatusPanel = IStatusPanel>(
    beans: BeanCollection,
    key: string
): TStatusPanel | undefined {
    const comp = (beans.statusBarSvc as StatusBarService)?.getStatusPanel(key);
    return _unwrapUserComp(comp) as any;
}
