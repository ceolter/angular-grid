import type { NamedBean } from '../../context/bean';
import { BeanStub } from '../../context/beanStub';
import { _createCellId } from '../../entities/positionUtils';
import type { FlashCellsEvent } from '../../events';
import type { FlashCellsParams } from '../../interfaces/iCellsParams';
import { _exists } from '../../utils/generic';
import type { CellCtrl } from './cellCtrl';

export class CellFlashService extends BeanStub implements NamedBean {
    beanName = 'cellFlashSvc' as const;

    public onFlashCells(cellCtrl: CellCtrl, event: FlashCellsEvent): void {
        if (!cellCtrl.getComp()) {
            return;
        }
        const cellId = _createCellId(cellCtrl.getCellPosition());
        const shouldFlash = event.cells[cellId];
        if (shouldFlash) {
            this.animateCell(cellCtrl, 'highlight');
        }
    }

    public flashCell(cellCtrl: CellCtrl, delays?: Pick<FlashCellsParams, 'fadeDuration' | 'flashDuration'>): void {
        this.animateCell(cellCtrl, 'data-changed', delays?.flashDuration, delays?.fadeDuration);
    }

    private animateCell(
        cellCtrl: CellCtrl,
        cssName: string,
        flashDuration?: number | null,
        fadeDuration?: number | null
    ): void {
        const cellComp = cellCtrl.getComp();
        if (!cellComp) {
            return;
        }
        const { gos } = this;

        if (!flashDuration) {
            flashDuration = gos.get('cellFlashDuration');
        }

        if (flashDuration === 0) {
            return;
        }

        if (!_exists(fadeDuration)) {
            fadeDuration = gos.get('cellFadeDuration');
        }

        const fullName = `ag-cell-${cssName}`;
        const animationFullName = `ag-cell-${cssName}-animation`;

        // we want to highlight the cells, without any animation
        cellComp.addOrRemoveCssClass(fullName, true);
        cellComp.addOrRemoveCssClass(animationFullName, false);

        const eGui = cellCtrl.getGui();

        // then once that is applied, we remove the highlight with animation
        this.beans.frameworkOverrides.wrapIncoming(() => {
            window.setTimeout(() => {
                if (!cellCtrl.isAlive()) {
                    return;
                }
                cellComp.addOrRemoveCssClass(fullName, false);
                cellComp.addOrRemoveCssClass(animationFullName, true);

                eGui.style.transition = `background-color ${fadeDuration}ms`;
                window.setTimeout(() => {
                    if (!cellCtrl.isAlive()) {
                        return;
                    }
                    // and then to leave things as we got them, we remove the animation
                    cellComp.addOrRemoveCssClass(animationFullName, false);
                    eGui.style.transition = '';
                }, fadeDuration!);
            }, flashDuration!);
        });
    }
}
