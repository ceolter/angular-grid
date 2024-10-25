import type { BeanCollection, CtrlsService, IRenderStatusService } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

export class RenderStatusService extends BeanStub implements IRenderStatusService {
    private ctrlsSvc!: CtrlsService;

    public wireBeans(beans: BeanCollection): void {
        this.ctrlsSvc = beans.ctrlsSvc;
    }

    public areHeaderCellsRendered(): boolean {
        return this.ctrlsSvc
            .getHeaderRowContainerCtrls()
            .every((container) => container.getAllCtrls().every((ctrl) => ctrl.areCellsRendered()));
    }
}
