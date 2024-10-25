import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { RowContainerCtrl } from '../gridBodyComp/rowContainer/rowContainerCtrl';
import { _getRowHeightAsNumber } from '../gridOptionsUtils';
import { _debounce } from '../utils/function';
import type { PaginationService } from './paginationService';

export class PaginationAutoPageSizeService extends BeanStub implements NamedBean {
    beanName = 'paginationAutoPageSizeSvc' as const;

    private ctrlsSvc: CtrlsService;
    private pagination: PaginationService;

    public wireBeans(beans: BeanCollection): void {
        this.ctrlsSvc = beans.ctrlsSvc;
        this.pagination = beans.pagination!;
    }

    private centerRowsCtrl: RowContainerCtrl;

    // Once the body is rendered, we debounce changes to the page size,
    // but we do not want to debounce the first time the body is rendered.
    private isBodyRendered: boolean;

    public postConstruct(): void {
        this.ctrlsSvc.whenReady(this, (p) => {
            this.centerRowsCtrl = p.center;

            const listener = this.checkPageSize.bind(this);
            this.addManagedEventListeners({
                bodyHeightChanged: listener,
                scrollVisibilityChanged: listener,
            });
            this.addManagedPropertyListener('paginationAutoPageSize', this.onPaginationAutoSizeChanged.bind(this));

            this.checkPageSize();
        });
    }

    private notActive(): boolean {
        return !this.gos.get('paginationAutoPageSize') || this.centerRowsCtrl == null;
    }

    private onPaginationAutoSizeChanged(): void {
        if (this.notActive()) {
            this.pagination.unsetAutoCalculatedPageSize();
        } else {
            this.checkPageSize();
        }
    }

    private checkPageSize(): void {
        if (this.notActive()) {
            return;
        }

        const bodyHeight = this.centerRowsCtrl.getViewportSizeFeature()!.getBodyHeight();

        if (bodyHeight > 0) {
            const update = () => {
                const rowHeight = Math.max(_getRowHeightAsNumber(this.gos), 1); // prevent divide by zero error if row height is 0
                const newPageSize = Math.floor(bodyHeight / rowHeight);
                this.pagination.setPageSize(newPageSize, 'autoCalculated');
            };

            if (!this.isBodyRendered) {
                update();
                this.isBodyRendered = true;
            } else {
                // TODO: this is weird, since this _debounce is inlined here this seems to act just as a setTimeout?
                _debounce(this, update, 50)();
            }
        } else {
            this.isBodyRendered = false;
        }
    }
}
