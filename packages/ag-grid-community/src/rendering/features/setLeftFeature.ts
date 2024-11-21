import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { AgColumn } from '../../entities/agColumn';
import type { AgColumnGroup } from '../../entities/agColumnGroup';
import { isColumnGroup } from '../../entities/agColumnGroup';
import { _isDomLayout } from '../../gridOptionsUtils';
import { _setAriaColSpan } from '../../utils/aria';
import { _last } from '../../utils/array';
import { _exists } from '../../utils/generic';

export class SetLeftFeature extends BeanStub {
    private ariaEl: HTMLElement;

    private actualLeft: number;

    constructor(
        private readonly columnOrGroup: AgColumn | AgColumnGroup,
        private eCell: HTMLElement,
        beans: BeanCollection,
        private colsSpanning?: AgColumn[]
    ) {
        super();
        this.columnOrGroup = columnOrGroup;
        this.ariaEl = eCell.querySelector('[role=columnheader]') || eCell;
        this.beans = beans;
    }

    public setColsSpanning(colsSpanning: AgColumn[]): void {
        this.colsSpanning = colsSpanning;
        this.onLeftChanged();
    }

    public getColumnOrGroup(): AgColumn | AgColumnGroup {
        const { beans, colsSpanning } = this;
        if (beans.gos.get('enableRtl') && colsSpanning) {
            return _last(colsSpanning);
        }
        return this.columnOrGroup;
    }

    public postConstruct(): void {
        const onLeftChanged = this.onLeftChanged.bind(this);
        this.addManagedListeners(this.columnOrGroup, { leftChanged: onLeftChanged });
        this.setLeftFirstTime();

        // when in print layout, the left position is also dependent on the width of the pinned sections.
        // so additionally update left if any column width changes.
        this.addManagedEventListeners({ displayedColumnsWidthChanged: onLeftChanged });

        // setting left has a dependency on print layout
        this.addManagedPropertyListener('domLayout', onLeftChanged);
    }

    private setLeftFirstTime(): void {
        const { gos, colAnimation } = this.beans;
        const suppressMoveAnimation = gos.get('suppressColumnMoveAnimation');
        const oldLeftExists = _exists(this.columnOrGroup.getOldLeft());
        const animateColumnMove = colAnimation?.isActive() && oldLeftExists && !suppressMoveAnimation;
        if (animateColumnMove) {
            this.animateInLeft();
        } else {
            this.onLeftChanged();
        }
    }

    private animateInLeft(): void {
        const colOrGroup = this.getColumnOrGroup();

        const oldActualLeft = this.modifyLeftForPrintLayout(colOrGroup, colOrGroup.getOldLeft()!);
        const actualLeft = this.modifyLeftForPrintLayout(colOrGroup, colOrGroup.getLeft()!);

        this.setLeft(oldActualLeft!);

        // we must keep track of the left we want to set to, as this would otherwise lead to a race
        // condition, if the user changed the left value many times in one VM turn, then we want to make
        // make sure the actualLeft we set in the timeout below (in the next VM turn) is the correct left
        // position. eg if user changes column position twice, then setLeft() below executes twice in next
        // VM turn, but only one (the correct one) should get applied.
        this.actualLeft = actualLeft;

        this.beans.colAnimation!.executeNextVMTurn(() => {
            // test this left value is the latest one to be applied, and if not, do nothing
            if (this.actualLeft === actualLeft) {
                this.setLeft(actualLeft);
            }
        });
    }

    private onLeftChanged(): void {
        const colOrGroup = this.getColumnOrGroup();
        const left = colOrGroup.getLeft();
        this.actualLeft = this.modifyLeftForPrintLayout(colOrGroup, left!);
        this.setLeft(this.actualLeft);
    }

    private modifyLeftForPrintLayout(colOrGroup: AgColumn | AgColumnGroup, leftPosition: number): number {
        const { gos, visibleCols } = this.beans;
        const printLayout = _isDomLayout(gos, 'print');

        if (!printLayout) {
            return leftPosition;
        }

        if (colOrGroup.getPinned() === 'left') {
            return leftPosition;
        }

        const leftWidth = visibleCols.getColsLeftWidth();

        if (colOrGroup.getPinned() === 'right') {
            const bodyWidth = visibleCols.bodyWidth;
            return leftWidth + bodyWidth + leftPosition;
        }

        // is in body
        return leftWidth + leftPosition;
    }

    private setLeft(value: number): void {
        // if the value is null, then that means the column is no longer
        // displayed. there is logic in the rendering to fade these columns
        // out, so we don't try and change their left positions.
        if (_exists(value)) {
            this.eCell.style.left = `${value}px`;
        }

        if (isColumnGroup(this.columnOrGroup)) {
            const children = this.columnOrGroup.getLeafColumns();

            if (!children.length) {
                return;
            }

            if (children.length > 1) {
                _setAriaColSpan(this.ariaEl, children.length);
            }
        }
    }
}
