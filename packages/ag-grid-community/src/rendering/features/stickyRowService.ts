import type { NamedBean } from '../../context/bean';
import { BeanStub } from '../../context/beanStub';
import type { RowNode } from '../../entities/rowNode';
import { _isClientSideRowModel, _isGroupRowsSticky, _isServerSideRowModel } from '../../gridOptionsUtils';
import type { RowCtrl } from '../row/rowCtrl';
import type { RowCtrlByRowNodeIdMap } from '../rowRenderer';
import { StickyRowFeature } from './stickyRowFeature';

export class StickyRowService extends BeanStub implements NamedBean {
    beanName = 'stickyRowSvc' as const;

    public createStickyRowFeature(
        ctrl: BeanStub,
        createRowCon: (rowNode: RowNode, animate: boolean, afterScroll: boolean) => RowCtrl,
        destroyRowCtrls: (rowCtrlsMap: RowCtrlByRowNodeIdMap | null | undefined, animate: boolean) => void
    ): StickyRowFeature | undefined {
        if ((_isGroupRowsSticky(this.gos) && _isClientSideRowModel(this.gos)) || _isServerSideRowModel(this.gos)) {
            return ctrl.createManagedBean(new StickyRowFeature(createRowCon, destroyRowCtrls));
        }
        return undefined;
    }
}
