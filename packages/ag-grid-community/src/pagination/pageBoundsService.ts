import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { RowBounds } from '../interfaces/iRowModel';

// note that everything in this service is used even when pagination is off
export class PageBoundsService extends BeanStub implements NamedBean {
    beanName = 'pageBounds' as const;

    private topRowBounds?: Required<RowBounds> | null;
    private bottomRowBounds?: Required<RowBounds> | null;
    private pixelOffset = 0;

    public getFirstRow(): number {
        return this.topRowBounds?.rowIndex ?? -1;
    }

    public getLastRow(): number {
        return this.bottomRowBounds?.rowIndex ?? -1;
    }

    public getCurrentPageHeight(): number {
        const { topRowBounds, bottomRowBounds } = this;
        if (!topRowBounds || !bottomRowBounds) {
            return 0;
        }
        return Math.max(bottomRowBounds.rowTop + bottomRowBounds.rowHeight - topRowBounds.rowTop, 0);
    }

    public getCurrentPagePixelRange(): { pageFirstPixel: number; pageLastPixel: number } {
        const { topRowBounds, bottomRowBounds } = this;
        const pageFirstPixel = topRowBounds?.rowTop ?? 0;
        const pageLastPixel = bottomRowBounds ? bottomRowBounds.rowTop + bottomRowBounds.rowHeight : 0;
        return { pageFirstPixel, pageLastPixel };
    }

    public calculateBounds(topDisplayedRowIndex: number, bottomDisplayedRowIndex: number): void {
        const { rowModel } = this.beans;
        const topRowBounds = rowModel.getRowBounds(topDisplayedRowIndex)!;
        if (topRowBounds) {
            topRowBounds.rowIndex = topDisplayedRowIndex;
        }
        this.topRowBounds = topRowBounds as Required<RowBounds> | null;

        const bottomRowBounds = rowModel.getRowBounds(bottomDisplayedRowIndex)!;
        if (bottomRowBounds) {
            bottomRowBounds.rowIndex = bottomDisplayedRowIndex;
        }
        this.bottomRowBounds = bottomRowBounds as Required<RowBounds> | null;

        this.calculatePixelOffset();
    }

    public getPixelOffset(): number {
        return this.pixelOffset;
    }

    private calculatePixelOffset(): void {
        const value = this.topRowBounds?.rowTop ?? 0;

        if (this.pixelOffset === value) {
            return;
        }

        this.pixelOffset = value;
        // this event is required even when pagination is off
        this.eventSvc.dispatchEvent({ type: 'paginationPixelOffsetChanged' });
    }
}
