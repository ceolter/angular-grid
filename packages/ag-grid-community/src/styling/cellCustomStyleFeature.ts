import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { CellClassParams, CellClassRules } from '../entities/colDef';
import type { CellStyle, CellStyleFunc } from '../entities/colDef';
import type { RowNode } from '../entities/rowNode';
import type { CellCtrl, ICellComp } from '../rendering/cell/cellCtrl';
import { processClassRules } from './stylingUtils';

export class CellCustomStyleFeature extends BeanStub {
    private readonly cellCtrl: CellCtrl;
    private readonly column: AgColumn;
    private readonly rowNode: RowNode;
    private staticClasses: string[] = [];

    private cellComp: ICellComp;

    private cellClassRules?: CellClassRules;

    constructor(ctrl: CellCtrl, beans: BeanCollection) {
        super();

        this.cellCtrl = ctrl;
        this.beans = beans;

        this.column = ctrl.getColumn();
        this.rowNode = ctrl.getRowNode();
    }

    public setComp(comp: ICellComp): void {
        this.cellComp = comp;

        this.applyUserStyles();
        this.applyCellClassRules();
        this.applyClassesFromColDef();
    }

    public applyCellClassRules(): void {
        const colDef = this.column.getColDef();
        const { cellClassRules } = colDef;
        const cellClassParams: CellClassParams = this.beans.gos.addGridCommonParams({
            value: this.cellCtrl.getValue(),
            data: this.rowNode.data,
            node: this.rowNode,
            colDef: colDef,
            column: this.column,
            rowIndex: this.rowNode.rowIndex!,
        });

        processClassRules(
            this.beans.expressionSvc,
            // if current was previous, skip
            cellClassRules === this.cellClassRules ? undefined : this.cellClassRules,
            cellClassRules,
            cellClassParams,
            (className) => this.cellComp.addOrRemoveCssClass(className, true),
            (className) => this.cellComp.addOrRemoveCssClass(className, false)
        );
        this.cellClassRules = cellClassRules;
    }

    public applyUserStyles() {
        const colDef = this.column.getColDef();

        if (!colDef.cellStyle) {
            return;
        }

        let styles: CellStyle | null | undefined;

        if (typeof colDef.cellStyle === 'function') {
            const cellStyleParams: CellClassParams = this.beans.gos.addGridCommonParams({
                column: this.column,
                value: this.cellCtrl.getValue(),
                colDef: colDef,
                data: this.rowNode.data,
                node: this.rowNode,
                rowIndex: this.rowNode.rowIndex!,
            });
            const cellStyleFunc = colDef.cellStyle as CellStyleFunc;
            styles = cellStyleFunc(cellStyleParams);
        } else {
            styles = colDef.cellStyle;
        }

        if (styles) {
            this.cellComp.setUserStyles(styles);
        }
    }

    public applyClassesFromColDef() {
        const colDef = this.column.getColDef();
        const cellClassParams: CellClassParams = this.beans.gos.addGridCommonParams({
            value: this.cellCtrl.getValue(),
            data: this.rowNode.data,
            node: this.rowNode,
            column: this.column,
            colDef: colDef,
            rowIndex: this.rowNode.rowIndex!,
        });

        if (this.staticClasses.length) {
            this.staticClasses.forEach((className) => this.cellComp.addOrRemoveCssClass(className, false));
        }

        this.staticClasses = this.beans.cellStyles!.getStaticCellClasses(colDef, cellClassParams);

        if (this.staticClasses.length) {
            this.staticClasses.forEach((className) => this.cellComp.addOrRemoveCssClass(className, true));
        }
    }

    // overriding to make public, as we don't dispose this bean via context
    public override destroy() {
        super.destroy();
    }
}
