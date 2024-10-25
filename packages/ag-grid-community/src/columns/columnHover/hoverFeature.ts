import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { AgColumn } from '../../entities/agColumn';
import type { ColumnHoverService } from './columnHoverService';

export class HoverFeature extends BeanStub {
    private colHover: ColumnHoverService;

    public wireBeans(beans: BeanCollection): void {
        this.colHover = beans.colHover!;
    }

    private readonly columns: AgColumn[];

    private element: HTMLElement;

    constructor(columns: AgColumn[], element: HTMLElement) {
        super();
        this.columns = columns;
        this.element = element;
    }

    public postConstruct(): void {
        if (this.gos.get('columnHoverHighlight')) {
            this.addMouseHoverListeners();
        }
    }

    private addMouseHoverListeners(): void {
        this.addManagedListeners(this.element, {
            mouseout: this.onMouseOut.bind(this),
            mouseover: this.onMouseOver.bind(this),
        });
    }

    private onMouseOut(): void {
        this.colHover.clearMouseOver();
    }

    private onMouseOver(): void {
        this.colHover.setMouseOver(this.columns);
    }
}
