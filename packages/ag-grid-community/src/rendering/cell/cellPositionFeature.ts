import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { AgColumn } from '../../entities/agColumn';
import type { RowNode } from '../../entities/rowNode';
import { _getRowHeightAsNumber } from '../../gridOptionsUtils';
import { _areEqual, _last } from '../../utils/array';
import { _missing } from '../../utils/generic';
import type { CellCtrl } from './cellCtrl';

/**
 * Takes care of:
 *  #) Cell Width (including when doing cell spanning, which makes width cover many columns)
 *  #) Cell Height (when doing row span, otherwise we don't touch the height as it's just row height)
 *  #) Cell Left (the horizontal positioning of the cell, the vertical positioning is on the row)
 */
export class CellPositionFeature extends BeanStub {
    private cellCtrl: CellCtrl;
    private eGui: HTMLElement;

    private readonly column: AgColumn;
    private readonly rowNode: RowNode;

    private colsSpanning: AgColumn[];
    private rowSpan: number;

    constructor(ctrl: CellCtrl, beans: BeanCollection) {
        super();

        this.cellCtrl = ctrl;
        this.beans = beans;

        this.column = ctrl.getColumn();
        this.rowNode = ctrl.getRowNode();
    }

    private setupRowSpan(): void {
        this.rowSpan = this.column.getRowSpan(this.rowNode);

        this.addManagedListeners(this.beans.eventSvc, { newColumnsLoaded: () => this.onNewColumnsLoaded() });
    }

    public setComp(eGui: HTMLElement): void {
        this.eGui = eGui;

        // add event handlers only after GUI is attached,
        // so we don't get events before we are ready
        this.setupColSpan();
        this.setupRowSpan();

        this.onLeftChanged();
        this.onWidthChanged();
        this.applyRowSpan();
    }

    private onNewColumnsLoaded(): void {
        const rowSpan = this.column.getRowSpan(this.rowNode);
        if (this.rowSpan === rowSpan) {
            return;
        }

        this.rowSpan = rowSpan;
        this.applyRowSpan(true);
    }

    private onDisplayColumnsChanged(): void {
        const colsSpanning: AgColumn[] = this.getColSpanningList();

        if (!_areEqual(this.colsSpanning, colsSpanning)) {
            this.colsSpanning = colsSpanning;
            this.onWidthChanged();
            this.onLeftChanged(); // left changes when doing RTL
        }
    }

    private setupColSpan(): void {
        // if no col span is active, then we don't set it up, as it would be wasteful of CPU
        if (this.column.getColDef().colSpan == null) {
            return;
        }

        this.colsSpanning = this.getColSpanningList();

        this.addManagedListeners(this.beans.eventSvc, {
            // because we are col spanning, a reorder of the cols can change what cols we are spanning over
            displayedColumnsChanged: this.onDisplayColumnsChanged.bind(this),
            // because we are spanning over multiple cols, we check for width any time any cols width changes.
            // this is expensive - really we should be explicitly checking only the cols we are spanning over
            // instead of every col, however it would be tricky code to track the cols we are spanning over, so
            // because hardly anyone will be using colSpan, am favouring this easier way for more maintainable code.
            displayedColumnsWidthChanged: this.onWidthChanged.bind(this),
        });
    }

    public onWidthChanged(): void {
        if (!this.eGui) {
            return;
        }
        const width = this.getCellWidth();
        this.eGui.style.width = `${width}px`;
    }

    private getCellWidth(): number {
        if (!this.colsSpanning) {
            return this.column.getActualWidth();
        }

        return this.colsSpanning.reduce((width, col) => width + col.getActualWidth(), 0);
    }

    public getColSpanningList(): AgColumn[] {
        const colSpan = this.column.getColSpan(this.rowNode);
        const colsSpanning: AgColumn[] = [];

        // if just one col, the col span is just the column we are in
        if (colSpan === 1) {
            colsSpanning.push(this.column);
        } else {
            let pointer: AgColumn | null = this.column;
            const pinned = this.column.getPinned();
            for (let i = 0; pointer && i < colSpan; i++) {
                colsSpanning.push(pointer);
                pointer = this.beans.visibleCols.getColAfter(pointer);
                if (!pointer || _missing(pointer)) {
                    break;
                }
                // we do not allow col spanning to span outside of pinned areas
                if (pinned !== pointer.getPinned()) {
                    break;
                }
            }
        }

        return colsSpanning;
    }

    public onLeftChanged(): void {
        if (!this.eGui) {
            return;
        }
        const left = this.modifyLeftForPrintLayout(this.getCellLeft());
        this.eGui.style.left = left + 'px';
    }

    private getCellLeft(): number | null {
        let mostLeftCol: AgColumn;

        if (this.beans.gos.get('enableRtl') && this.colsSpanning) {
            mostLeftCol = _last(this.colsSpanning);
        } else {
            mostLeftCol = this.column;
        }

        return mostLeftCol.getLeft();
    }

    private modifyLeftForPrintLayout(leftPosition: number | null): number | null {
        if (!this.cellCtrl.isPrintLayout() || this.column.getPinned() === 'left') {
            return leftPosition;
        }

        const leftWidth = this.beans.visibleCols.getColsLeftWidth();

        if (this.column.getPinned() === 'right') {
            const bodyWidth = this.beans.visibleCols.getBodyContainerWidth();
            return leftWidth + bodyWidth + (leftPosition || 0);
        }

        // is in body
        return leftWidth + (leftPosition || 0);
    }

    private applyRowSpan(force?: boolean): void {
        if (this.rowSpan === 1 && !force) {
            return;
        }

        const singleRowHeight = _getRowHeightAsNumber(this.beans.gos);
        const totalRowHeight = singleRowHeight * this.rowSpan;

        this.eGui.style.height = `${totalRowHeight}px`;
        this.eGui.style.zIndex = '1';
    }

    // overriding to make public, as we don't dispose this bean via context
    public override destroy() {
        super.destroy();
    }
}
