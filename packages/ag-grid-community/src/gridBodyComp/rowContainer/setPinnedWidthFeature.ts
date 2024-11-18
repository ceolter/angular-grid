import { BeanStub } from '../../context/beanStub';
import { _setDisplayed, _setFixedWidth } from '../../utils/dom';

export class SetPinnedWidthFeature extends BeanStub {
    public readonly getWidth: () => number;

    constructor(
        private readonly element: HTMLElement,
        private readonly isLeft: boolean
    ) {
        super();
        this.getWidth = isLeft ? () => this.beans.pinnedCols!.leftWidth : () => this.beans.pinnedCols!.rightWidth;
    }

    public postConstruct(): void {
        this.addManagedEventListeners({
            [`${this.isLeft ? 'left' : 'right'}PinnedWidthChanged` as const]: this.onPinnedWidthChanged.bind(this),
        });
    }

    private onPinnedWidthChanged(): void {
        const width = this.getWidth();
        const displayed = width > 0;
        _setDisplayed(this.element, displayed);
        _setFixedWidth(this.element, width);
    }
}
