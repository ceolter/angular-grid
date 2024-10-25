import type { NamedBean } from '../../context/bean';
import { BeanStub } from '../../context/beanStub';
import type { AgColumn } from '../../entities/agColumn';
import type { IHeaderCellComp } from '../../headerRendering/cells/column/headerCellCtrl';
import type { IHeaderFilterCellComp } from '../../headerRendering/cells/floatingFilter/iHeaderFilterCellComp';
import type { ICellComp } from '../../rendering/cell/cellCtrl';
import { HoverFeature } from './hoverFeature';

const CSS_COLUMN_HOVER = 'ag-column-hover';

export class ColumnHoverService extends BeanStub implements NamedBean {
    beanName = 'colHover' as const;

    private selectedColumns: AgColumn[] | null;

    public setMouseOver(columns: AgColumn[]): void {
        this.updateState(columns);
    }

    public clearMouseOver(): void {
        this.updateState(null);
    }

    public isHovered(column: AgColumn): boolean {
        return !!this.selectedColumns && this.selectedColumns.indexOf(column) >= 0;
    }

    public addHeaderColumnHoverListener(compBean: BeanStub, comp: IHeaderCellComp, column: AgColumn): void {
        const listener = () => {
            if (!this.gos.get('columnHoverHighlight')) {
                return;
            }
            const isHovered = this.isHovered(column);
            comp.addOrRemoveCssClass('ag-column-hover', isHovered);
        };

        compBean.addManagedEventListeners({ columnHoverChanged: listener });
        listener();
    }

    public onCellColumnHover(column: AgColumn, cellComp?: ICellComp): void {
        if (!cellComp) {
            return;
        }
        if (!this.gos.get('columnHoverHighlight')) {
            return;
        }

        const isHovered = this.isHovered(column);
        cellComp.addOrRemoveCssClass(CSS_COLUMN_HOVER, isHovered);
    }

    public addHeaderFilterColumnHoverListener(
        compBean: BeanStub,
        comp: IHeaderFilterCellComp,
        column: AgColumn,
        eGui: HTMLElement
    ): void {
        this.createHoverFeature(compBean, [column], eGui);

        const listener = () => {
            if (!this.gos.get('columnHoverHighlight')) {
                return;
            }
            const hovered = this.isHovered(column);
            comp.addOrRemoveCssClass('ag-column-hover', hovered);
        };

        compBean.addManagedEventListeners({ columnHoverChanged: listener });
        listener();
    }

    public createHoverFeature(compBean: BeanStub, columns: AgColumn[], eGui: HTMLElement): void {
        compBean.createManagedBean(new HoverFeature(columns, eGui));
    }

    private updateState(columns: AgColumn[] | null): void {
        this.selectedColumns = columns;
        this.eventSvc.dispatchEvent({
            type: 'columnHoverChanged',
        });
    }
}
