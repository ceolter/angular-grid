import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { IRowModel, RowBounds } from '../interfaces/iRowModel';
import { _exists, _missing } from '../utils/generic';

// note that everything in this service is used even when pagination is off
export class PageBoundsService extends BeanStub implements NamedBean {
    beanName = 'pageBounds' as const;

    private rowModel: IRowModel;

    private topRowBounds: RowBounds;
    private bottomRowBounds: RowBounds;
    private pixelOffset = 0;

    public wireBeans(beans: BeanCollection): void {
        this.rowModel = beans.rowModel;
    }

    public getFirstRow(): number {
        return this.topRowBounds ? this.topRowBounds.rowIndex! : -1;
    }

    public getLastRow(): number {
        return this.bottomRowBounds ? this.bottomRowBounds.rowIndex! : -1;
    }

    public getCurrentPageHeight(): number {
        if (_missing(this.topRowBounds) || _missing(this.bottomRowBounds)) {
            return 0;
        }
        return Math.max(this.bottomRowBounds.rowTop + this.bottomRowBounds.rowHeight - this.topRowBounds.rowTop, 0);
    }

    public getCurrentPagePixelRange(): { pageFirstPixel: number; pageLastPixel: number } {
        const pageFirstPixel = this.topRowBounds ? this.topRowBounds.rowTop : 0;
        const pageLastPixel = this.bottomRowBounds ? this.bottomRowBounds.rowTop + this.bottomRowBounds.rowHeight : 0;
        return { pageFirstPixel, pageLastPixel };
    }

    public calculateBounds(topDisplayedRowIndex: number, bottomDisplayedRowIndex: number): void {
        this.topRowBounds = this.rowModel.getRowBounds(topDisplayedRowIndex)!;
        if (this.topRowBounds) {
            this.topRowBounds.rowIndex = topDisplayedRowIndex;
        }

        this.bottomRowBounds = this.rowModel.getRowBounds(bottomDisplayedRowIndex)!;
        if (this.bottomRowBounds) {
            this.bottomRowBounds.rowIndex = bottomDisplayedRowIndex;
        }

        this.calculatePixelOffset();
    }

    public getPixelOffset(): number {
        return this.pixelOffset;
    }

    private calculatePixelOffset(): void {
        const value = _exists(this.topRowBounds) ? this.topRowBounds.rowTop : 0;

        if (this.pixelOffset === value) {
            return;
        }

        this.pixelOffset = value;
        // this event is required even when pagination is off
        this.eventSvc.dispatchEvent({ type: 'paginationPixelOffsetChanged' });
    }
}
