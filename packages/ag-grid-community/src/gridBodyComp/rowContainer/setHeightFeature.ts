import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { RowContainerHeightService } from '../../rendering/rowContainerHeightService';

export class SetHeightFeature extends BeanStub {
    private maxDivHeightScaler: RowContainerHeightService;

    public wireBeans(beans: BeanCollection) {
        this.maxDivHeightScaler = beans.rowContainerHeight;
    }

    constructor(
        private readonly eContainer: HTMLElement,
        private readonly eViewport?: HTMLElement
    ) {
        super();
    }

    public postConstruct(): void {
        this.addManagedEventListeners({ rowContainerHeightChanged: this.onHeightChanged.bind(this) });
    }

    private onHeightChanged(): void {
        const height = this.maxDivHeightScaler.uiContainerHeight;
        const heightString = height != null ? `${height}px` : ``;

        this.eContainer.style.height = heightString;
        if (this.eViewport) {
            this.eViewport.style.height = heightString;
        }
    }
}
