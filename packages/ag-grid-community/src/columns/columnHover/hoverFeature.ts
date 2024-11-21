import { BeanStub } from '../../context/beanStub';
import type { AgColumn } from '../../entities/agColumn';

export class HoverFeature extends BeanStub {
    constructor(
        private readonly columns: AgColumn[],
        private readonly element: HTMLElement
    ) {
        super();
    }

    public postConstruct(): void {
        if (this.gos.get('columnHoverHighlight')) {
            const colHover = this.beans.colHover!;
            this.addManagedListeners(this.element, {
                mouseout: colHover.clearMouseOver.bind(this),
                mouseover: colHover.setMouseOver.bind(this, this.columns),
            });
        }
    }
}
