import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { PinnedColumnService } from '../../pinnedColumns/pinnedColumnService';
import { _setDisplayed, _setFixedWidth } from '../../utils/dom';

export class SetPinnedWidthFeature extends BeanStub {
    private pinnedCols: PinnedColumnService;

    public readonly getWidth: () => number;

    public wireBeans(beans: BeanCollection): void {
        this.pinnedCols = beans.pinnedCols!;
    }

    constructor(
        private readonly element: HTMLElement,
        private readonly isLeft: boolean
    ) {
        super();
        this.getWidth = isLeft
            ? () => this.pinnedCols.getPinnedLeftWidth()
            : () => this.pinnedCols.getPinnedRightWidth();
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
