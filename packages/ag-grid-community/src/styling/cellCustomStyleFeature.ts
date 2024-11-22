import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { CellClassParams, CellClassRules, ColDef } from '../entities/colDef';
import type { CellStyle } from '../entities/colDef';
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
        const { column, cellComp } = this;
        const colDef = column.colDef;
        const cellClassRules = colDef.cellClassRules;
        const cellClassParams = this.getCellClassParams(column, colDef);

        processClassRules(
            this.beans.expressionSvc,
            // if current was previous, skip
            cellClassRules === this.cellClassRules ? undefined : this.cellClassRules,
            cellClassRules,
            cellClassParams,
            (className) => cellComp.addOrRemoveCssClass(className, true),
            (className) => cellComp.addOrRemoveCssClass(className, false)
        );
        this.cellClassRules = cellClassRules;
    }

    public applyUserStyles() {
        const column = this.column;
        const colDef = column.colDef;
        const cellStyle = colDef.cellStyle;

        if (!cellStyle) {
            return;
        }

        let styles: CellStyle | null | undefined;

        if (typeof cellStyle === 'function') {
            const cellStyleParams = this.getCellClassParams(column, colDef);
            styles = cellStyle(cellStyleParams);
        } else {
            styles = cellStyle;
        }

        if (styles) {
            this.cellComp.setUserStyles(styles);
        }
    }

    public applyClassesFromColDef() {
        const { column, cellComp } = this;
        const colDef = column.colDef;
        const cellClassParams = this.getCellClassParams(column, colDef);

        this.staticClasses.forEach((className) => cellComp.addOrRemoveCssClass(className, false));

        const newStaticClasses = this.beans.cellStyles!.getStaticCellClasses(colDef, cellClassParams);
        this.staticClasses = newStaticClasses;

        newStaticClasses.forEach((className) => cellComp.addOrRemoveCssClass(className, true));
    }

    private getCellClassParams(column: AgColumn, colDef: ColDef): CellClassParams {
        const { value, rowNode } = this.cellCtrl;
        return this.beans.gos.addGridCommonParams({
            value,
            data: rowNode.data,
            node: rowNode,
            colDef,
            column,
            rowIndex: rowNode.rowIndex!,
        });
    }
}
