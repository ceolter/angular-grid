import { BeanStub } from '../../../context/beanStub';
import type { AgColumnGroup } from '../../../entities/agColumnGroup';
import type { IHeaderGroupCellComp } from './headerGroupCellCtrl';

export class GroupWidthFeature extends BeanStub {
    private columnGroup: AgColumnGroup;
    private comp: IHeaderGroupCellComp;

    // the children can change, we keep destroy functions related to listening to the children here
    private removeChildListenersFuncs: (() => void)[] = [];

    constructor(comp: IHeaderGroupCellComp, columnGroup: AgColumnGroup) {
        super();
        this.columnGroup = columnGroup;
        this.comp = comp;
    }

    public postConstruct(): void {
        // we need to listen to changes in child columns, as they impact our width
        this.addListenersToChildrenColumns();

        // the children belonging to this group can change, so we need to add and remove listeners as they change
        this.addManagedListeners(this.columnGroup, {
            displayedChildrenChanged: this.onDisplayedChildrenChanged.bind(this),
        });

        this.onWidthChanged();

        // the child listeners are not tied to this components life-cycle, as children can get added and removed
        // to the group - hence they are on a different life-cycle. so we must make sure the existing children
        // listeners are removed when we finally get destroyed
        this.addDestroyFunc(this.removeListenersOnChildrenColumns.bind(this));
    }

    private addListenersToChildrenColumns(): void {
        // first destroy any old listeners
        this.removeListenersOnChildrenColumns();

        // now add new listeners to the new set of children
        const widthChangedListener = this.onWidthChanged.bind(this);
        this.columnGroup.getLeafColumns().forEach((column) => {
            column.__addEventListener('widthChanged', widthChangedListener);
            column.__addEventListener('visibleChanged', widthChangedListener);
            this.removeChildListenersFuncs.push(() => {
                column.__removeEventListener('widthChanged', widthChangedListener);
                column.__removeEventListener('visibleChanged', widthChangedListener);
            });
        });
    }

    private removeListenersOnChildrenColumns(): void {
        this.removeChildListenersFuncs.forEach((func) => func());
        this.removeChildListenersFuncs = [];
    }

    private onDisplayedChildrenChanged(): void {
        this.addListenersToChildrenColumns();
        this.onWidthChanged();
    }

    private onWidthChanged(): void {
        const columnWidth = this.columnGroup.getActualWidth();
        this.comp.setWidth(`${columnWidth}px`);
        this.comp.addOrRemoveCssClass('ag-hidden', columnWidth === 0);
    }
}
