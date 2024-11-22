import type { IStickyRowService, NamedBean, RowCtrl, RowNode } from 'ag-grid-community';
import { BeanStub, _isClientSideRowModel, _isGroupRowsSticky, _isServerSideRowModel } from 'ag-grid-community';

import { StickyRowFeature } from './stickyRowFeature';

export class StickyRowService extends BeanStub implements NamedBean, IStickyRowService {
    beanName = 'stickyRowSvc' as const;

    public createStickyRowFeature(
        ctrl: BeanStub,
        createRowCon: (rowNode: RowNode, animate: boolean, afterScroll: boolean) => RowCtrl,
        destroyRowCtrls: (rowCtrlsMap: Record<string, RowCtrl> | null | undefined, animate: boolean) => void
    ): StickyRowFeature | undefined {
        const gos = this.gos;
        if ((_isGroupRowsSticky(gos) && _isClientSideRowModel(gos)) || _isServerSideRowModel(gos)) {
            return ctrl.createManagedBean(new StickyRowFeature(createRowCon, destroyRowCtrls));
        }
        return undefined;
    }
}
