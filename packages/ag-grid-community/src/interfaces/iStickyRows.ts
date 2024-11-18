import type { BeanStub } from '../context/beanStub';
import type { RowNode } from '../entities/rowNode';
import type { RowCtrl } from '../rendering/row/rowCtrl';

export interface IStickyRowFeature {
    getStickyTopRowCtrls(): RowCtrl[];

    getStickyBottomRowCtrls(): RowCtrl[];

    refreshStickyNode(stickRowNode: RowNode): void;

    checkStickyRows(): boolean;

    getExtraTopHeight(): number;

    getExtraBottomHeight(): number;

    resetOffsets(): void;

    destroyStickyCtrls(): void;

    ensureRowHeightsValid(): boolean;
}

export interface IStickyRowService {
    createStickyRowFeature(
        ctrl: BeanStub,
        createRowCon: (rowNode: RowNode, animate: boolean, afterScroll: boolean) => RowCtrl,
        destroyRowCtrls: (rowCtrlsMap: Record<string, RowCtrl> | null | undefined, animate: boolean) => void
    ): IStickyRowFeature | undefined;
}
