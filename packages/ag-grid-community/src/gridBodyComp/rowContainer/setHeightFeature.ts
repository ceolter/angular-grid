import { BeanStub } from '../../context/beanStub';
import type { RowContainerHeightService } from '../../rendering/rowContainerHeightService';

export class SetHeightFeature extends BeanStub {
    constructor(
        private readonly eContainer: HTMLElement,
        private readonly eViewport?: HTMLElement
    ) {
        super();
    }

    public postConstruct(): void {
        this.addManagedEventListeners({
            rowContainerHeightChanged: this.onHeightChanged.bind(this, this.beans.rowContainerHeight),
        });
    }

    private onHeightChanged(maxDivHeightScaler: RowContainerHeightService): void {
        const height = maxDivHeightScaler.uiContainerHeight;
        const heightString = height != null ? `${height}px` : ``;

        this.eContainer.style.height = heightString;
        if (this.eViewport) {
            this.eViewport.style.height = heightString;
        }
    }
}
