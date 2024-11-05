import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { ModelUpdatedEvent } from '../events';
import type { WithoutGridCommon } from '../interfaces/iCommon';

export class PageBoundsListener extends BeanStub implements NamedBean {
    beanName = 'pageBoundsListener' as const;

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
        const { pageBounds, pagination, rowModel } = this.beans;
        if (pagination) {
            pagination.calculatePages();
        } else {
            pageBounds.calculateBounds(0, rowModel.getRowCount() - 1);
        }
    }
}
