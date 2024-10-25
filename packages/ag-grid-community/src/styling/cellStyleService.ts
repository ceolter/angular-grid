import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CellClassParams, ColDef } from '../entities/colDef';
import type { CellCtrl } from '../rendering/cell/cellCtrl';
import type { ExpressionService } from '../valueService/expressionService';
import { CellCustomStyleFeature } from './cellCustomStyleFeature';
import { processClassRules } from './stylingUtils';

export class CellStyleService extends BeanStub implements NamedBean {
    beanName = 'cellStyles' as const;

    private expressionSvc?: ExpressionService;

    public wireBeans(beans: BeanCollection): void {
        this.expressionSvc = beans.expressionSvc;
    }

    public processAllCellClasses(
        colDef: ColDef,
        params: CellClassParams,
        onApplicableClass: (className: string) => void,
        onNotApplicableClass?: (className: string) => void
    ) {
        processClassRules(
            this.expressionSvc,
            undefined,
            colDef.cellClassRules,
            params,
            onApplicableClass,
            onNotApplicableClass
        );
        this.processStaticCellClasses(colDef, params, onApplicableClass);
    }

    public getStaticCellClasses(colDef: ColDef, params: CellClassParams): string[] {
        const { cellClass } = colDef;

        if (!cellClass) {
            return [];
        }

        let classOrClasses: string | string[] | null | undefined;

        if (typeof cellClass === 'function') {
            const cellClassFunc = cellClass;
            classOrClasses = cellClassFunc(params);
        } else {
            classOrClasses = cellClass;
        }

        if (typeof classOrClasses === 'string') {
            classOrClasses = [classOrClasses];
        }

        return classOrClasses || [];
    }

    public createCellCustomStyleFeature(ctrl: CellCtrl, beans: BeanCollection): CellCustomStyleFeature {
        return new CellCustomStyleFeature(ctrl, beans);
    }

    private processStaticCellClasses(
        colDef: ColDef,
        params: CellClassParams,
        onApplicableClass: (className: string) => void
    ) {
        const classOrClasses = this.getStaticCellClasses(colDef, params);

        classOrClasses.forEach((cssClassItem: string) => {
            onApplicableClass(cssClassItem);
        });
    }
}
