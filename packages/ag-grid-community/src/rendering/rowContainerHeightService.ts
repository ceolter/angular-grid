import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import { _getMaxDivHeight } from '../utils/browser';
import { _logIfDebug } from '../utils/function';

/**
 * This class solves the 'max height' problem, where the user might want to show more data than
 * the max div height actually allows.
 */

export class RowContainerHeightService extends BeanStub implements NamedBean {
    beanName = 'rowContainerHeight' as const;

    private ctrlsSvc: CtrlsService;

    public wireBeans(beans: BeanCollection): void {
        this.ctrlsSvc = beans.ctrlsSvc;
    }

    private maxDivHeight: number;

    // if false, then stretching is not active, logic in this class is not used,
    // the pixel height of the row container matches what is actually needed,
    // no scaling applied.
    private stretching: boolean;

    private modelHeight: number | null; // how many pixels the model needs
    private uiContainerHeight: number | null; // how many pixels we actually have
    private pixelsToShave: number; // the number of pixels we need to shave

    // the number of pixels we add to each rowTop - depends on the scroll position
    private divStretchOffset: number;

    // the scrollY position
    private scrollY = 0;
    // how tall the body is
    private uiBodyHeight = 0;

    // the max scroll position
    private maxScrollY: number;

    public postConstruct(): void {
        this.addManagedEventListeners({ bodyHeightChanged: this.updateOffset.bind(this) });
        this.maxDivHeight = _getMaxDivHeight();
        _logIfDebug(this.gos, 'RowContainerHeightService - maxDivHeight = ' + this.maxDivHeight);
    }

    public isStretching(): boolean {
        return this.stretching;
    }

    public getDivStretchOffset(): number {
        return this.divStretchOffset;
    }

    public updateOffset(): void {
        if (!this.stretching) {
            return;
        }

        const gridBodyCon = this.ctrlsSvc.getGridBodyCtrl();
        const newScrollY = gridBodyCon.getScrollFeature().getVScrollPosition().top;
        const newBodyHeight = this.getUiBodyHeight();

        const atLeastOneChanged = newScrollY !== this.scrollY || newBodyHeight !== this.uiBodyHeight;
        if (atLeastOneChanged) {
            this.scrollY = newScrollY;
            this.uiBodyHeight = newBodyHeight;
            this.calculateOffset();
        }
    }

    private calculateOffset(): void {
        this.setUiContainerHeight(this.maxDivHeight);
        this.pixelsToShave = this.modelHeight! - this.uiContainerHeight!;

        this.maxScrollY = this.uiContainerHeight! - this.uiBodyHeight;
        const scrollPercent = this.scrollY / this.maxScrollY;

        const divStretchOffset = scrollPercent * this.pixelsToShave;

        _logIfDebug(
            this.gos,
            `RowContainerHeightService - Div Stretch Offset = ${divStretchOffset} (${this.pixelsToShave} * ${scrollPercent})`
        );

        this.setDivStretchOffset(divStretchOffset);
    }

    private setUiContainerHeight(height: number | null): void {
        if (height !== this.uiContainerHeight) {
            this.uiContainerHeight = height;
            this.eventSvc.dispatchEvent({ type: 'rowContainerHeightChanged' });
        }
    }

    private clearOffset(): void {
        this.setUiContainerHeight(this.modelHeight);
        this.pixelsToShave = 0;
        this.setDivStretchOffset(0);
    }

    private setDivStretchOffset(newOffset: number): void {
        // because we are talking pixels, no point in confusing things with half numbers
        const newOffsetFloor = typeof newOffset === 'number' ? Math.floor(newOffset) : null;
        if (this.divStretchOffset === newOffsetFloor) {
            return;
        }

        this.divStretchOffset = newOffsetFloor!;
        this.eventSvc.dispatchEvent({ type: 'heightScaleChanged' });
    }

    public setModelHeight(modelHeight: number | null): void {
        this.modelHeight = modelHeight;
        this.stretching =
            modelHeight != null && // null happens when in print layout
            this.maxDivHeight > 0 &&
            modelHeight! > this.maxDivHeight;
        if (this.stretching) {
            this.calculateOffset();
        } else {
            this.clearOffset();
        }
    }

    public getUiContainerHeight(): number | null {
        return this.uiContainerHeight;
    }

    public getRealPixelPosition(modelPixel: number): number {
        return modelPixel - this.divStretchOffset;
    }

    private getUiBodyHeight(): number {
        const gridBodyCon = this.ctrlsSvc.getGridBodyCtrl();
        const pos = gridBodyCon.getScrollFeature().getVScrollPosition();
        return pos.bottom - pos.top;
    }

    public getScrollPositionForPixel(rowTop: number): number {
        if (this.pixelsToShave <= 0) {
            return rowTop;
        }

        const modelMaxScroll = this.modelHeight! - this.getUiBodyHeight();
        const scrollPercent = rowTop / modelMaxScroll;
        const scrollPixel = this.maxScrollY * scrollPercent;
        return scrollPixel;
    }
}
