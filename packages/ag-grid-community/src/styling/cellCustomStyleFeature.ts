import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { CellClassParams, CellClassRules, ColDef } from '../entities/colDef';
import type { CellStyle, CellStyleFunc } from '../entities/colDef';
import type { CellCtrl, ICellComp } from '../rendering/cell/cellCtrl';
import { processClassRules } from './stylingUtils';

export class CellCustomStyleFeature extends BeanStub {
    private readonly column: AgColumn;
    private staticClasses: string[] = [];

    private cellComp: ICellComp;

    private cellClassRules?: CellClassRules;

    constructor(
        private readonly cellCtrl: CellCtrl,
        beans: BeanCollection
    ) {
        super();

        this.beans = beans;

        this.column = cellCtrl.column;
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
        const cellClassParams = this.getCellClassParams(colDef);

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
            const cellStyleParams = this.getCellClassParams(colDef);
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
        const cellClassParams = this.getCellClassParams(colDef);

        if (this.staticClasses.length) {
            this.staticClasses.forEach((className) => this.cellComp.addOrRemoveCssClass(className, false));
        }

        this.staticClasses = this.beans.cellStyles!.getStaticCellClasses(colDef, cellClassParams);

        if (this.staticClasses.length) {
            this.staticClasses.forEach((className) => this.cellComp.addOrRemoveCssClass(className, true));
        }
    }

    private getCellClassParams(colDef: ColDef): CellClassParams {
        const {
            cellCtrl: { value, rowNode },
            column,
        } = this;
        return this.beans.gos.addGridCommonParams({
            value,
            data: rowNode.data,
            node: rowNode,
            colDef,
            column,
            rowIndex: rowNode.rowIndex!,
        });
    }

    // overriding to make public, as we don't dispose this bean via context
    public override destroy() {
        super.destroy();
    }
}
