import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { ModelUpdatedEvent } from '../events';
import type { WithoutGridCommon } from '../interfaces/iCommon';
import type { IRowModel } from '../interfaces/iRowModel';
import type { PageBoundsService } from './pageBoundsService';
import type { PaginationService } from './paginationService';

export class PageBoundsListener extends BeanStub implements NamedBean {
    beanName = 'pageBoundsListener' as const;

    private rowModel: IRowModel;
    private pagination?: PaginationService;
    private pageBounds: PageBoundsService;

    public wireBeans(beans: BeanCollection): void {
        this.rowModel = beans.rowModel;
        this.pagination = beans.pagination;
        this.pageBounds = beans.pageBounds;
    }

    public postConstruct(): void {
        this.addManagedEventListeners({
            modelUpdated: this.onModelUpdated.bind(this),
            recalculateRowBounds: this.calculatePages.bind(this),
        });

        this.onModelUpdated();
    }

    private onModelUpdated(modelUpdatedEvent?: WithoutGridCommon<ModelUpdatedEvent>): void {
        this.calculatePages();

        this.eventSvc.dispatchEvent({
            type: 'paginationChanged',
            animate: modelUpdatedEvent?.animate ?? false,
            newData: modelUpdatedEvent?.newData ?? false,
            newPage: modelUpdatedEvent?.newPage ?? false,
            newPageSize: modelUpdatedEvent?.newPageSize ?? false,
            keepRenderedRows: modelUpdatedEvent?.keepRenderedRows ?? false,
        });
    }

    private calculatePages(): void {
        if (this.pagination) {
            this.pagination.calculatePages();
        } else {
            this.pageBounds.calculateBounds(0, this.rowModel.getRowCount() - 1);
        }
    }
}
