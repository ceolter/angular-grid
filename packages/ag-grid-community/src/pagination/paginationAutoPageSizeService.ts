import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { RowContainerCtrl } from '../gridBodyComp/rowContainer/rowContainerCtrl';
import { _getRowHeightAsNumber } from '../gridOptionsUtils';
import { _debounce } from '../utils/function';

export class PaginationAutoPageSizeService extends BeanStub implements NamedBean {
    beanName = 'paginationAutoPageSizeSvc' as const;

    private centerRowsCtrl: RowContainerCtrl;

    // Once the body is rendered, we debounce changes to the page size,
    // but we do not want to debounce the first time the body is rendered.
    private isBodyRendered: boolean;

    public postConstruct(): void {
        this.beans.ctrlsSvc.whenReady(this, (p) => {
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
            this.beans.pagination!.unsetAutoCalculatedPageSize();
        } else {
            this.checkPageSize();
        }
    }

    private checkPageSize(): void {
        if (this.notActive()) {
            return;
        }

        const bodyHeight = this.centerRowsCtrl.viewportSizeFeature!.getBodyHeight();

        if (bodyHeight > 0) {
            const beans = this.beans;
            const update = () => {
                const rowHeight = Math.max(_getRowHeightAsNumber(beans), 1); // prevent divide by zero error if row height is 0
                const newPageSize = Math.floor(bodyHeight / rowHeight);
                beans.pagination!.setPageSize(newPageSize, 'autoCalculated');
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
