import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { AgColumn } from '../entities/agColumn';
import type { AgColumnGroup } from '../entities/agColumnGroup';
import type { RowContainerCtrl } from '../gridBodyComp/rowContainer/rowContainerCtrl';
import type { RowRenderer } from './rowRenderer';

export class AutoWidthCalculator extends BeanStub implements NamedBean {
    beanName = 'autoWidthCalculator' as const;

    private rowRenderer: RowRenderer;
    private ctrlsSvc: CtrlsService;

    public wireBeans(beans: BeanCollection): void {
        this.rowRenderer = beans.rowRenderer;
        this.ctrlsSvc = beans.ctrlsSvc;
    }

    private centerRowContainerCtrl: RowContainerCtrl;

    public postConstruct(): void {
        this.ctrlsSvc.whenReady(this, (p) => {
            this.centerRowContainerCtrl = p.center;
        });
    }

    // this is the trick: we create a dummy container and clone all the cells
    // into the dummy, then check the dummy's width. then destroy the dummy
    // as we don't need it any more.
    // drawback: only the cells visible on the screen are considered
    public getPreferredWidthForColumn(column: AgColumn, skipHeader?: boolean): number {
        const eHeaderCell = this.getHeaderCellForColumn(column);
        // cell isn't visible
        if (!eHeaderCell) {
            return -1;
        }

        const elements = this.rowRenderer.getAllCellsForColumn(column);

        if (!skipHeader) {
            // we only consider the lowest level cell, not the group cell. in 99% of the time, this
            // will be enough. if we consider groups, then it gets too complicated for what it's worth,
            // as the groups can span columns and this class only considers one column at a time.
            elements.push(eHeaderCell);
        }

        return this.addElementsToContainerAndGetWidth(elements);
    }

    public getPreferredWidthForColumnGroup(columnGroup: AgColumnGroup): number {
        const eHeaderCell = this.getHeaderCellForColumn(columnGroup);

        if (!eHeaderCell) {
            return -1;
        }

        return this.addElementsToContainerAndGetWidth([eHeaderCell]);
    }

    private addElementsToContainerAndGetWidth(elements: HTMLElement[]): number {
        // this element has to be a form, otherwise form elements within a cell
        // will be validated while being cloned. This can cause issues such as
        // radio buttons being reset and losing their values.
        const eDummyContainer = document.createElement('form');
        // position fixed, so it isn't restricted to the boundaries of the parent
        eDummyContainer.style.position = 'fixed';

        // we put the dummy into the body container, so it will inherit all the
        // css styles that the real cells are inheriting
        const eBodyContainer = this.centerRowContainerCtrl.getContainerElement();

        elements.forEach((el) => this.cloneItemIntoDummy(el, eDummyContainer));

        // only append the dummyContainer to the DOM after it contains all the necessary items
        eBodyContainer.appendChild(eDummyContainer);

        // at this point, all the clones are lined up vertically with natural widths. the dummy
        // container will have a width wide enough just to fit the largest.
        const dummyContainerWidth = eDummyContainer.offsetWidth;

        // we are finished with the dummy container, so get rid of it
        eBodyContainer.removeChild(eDummyContainer);

        // we add padding as I found sometimes the gui still put '...' after some of the texts. so the
        // user can configure the grid to add a few more pixels after the calculated width
        const autoSizePadding = this.getAutoSizePadding();

        return dummyContainerWidth + autoSizePadding;
    }

    private getAutoSizePadding(): number {
        return this.gos.get('autoSizePadding');
    }

    private getHeaderCellForColumn(column: AgColumnGroup | AgColumn): HTMLElement | null {
        let element: HTMLElement | null = null;

        this.ctrlsSvc.getHeaderRowContainerCtrls().forEach((container) => {
            const res = container.getHtmlElementForColumnHeader(column);
            if (res != null) {
                element = res;
            }
        });

        return element;
    }

    private cloneItemIntoDummy(eCell: HTMLElement, eDummyContainer: HTMLElement): void {
        // make a deep clone of the cell
        const eCellClone: HTMLElement = eCell.cloneNode(true) as HTMLElement;
        // the original has a fixed width, we remove this to allow the natural width based on content
        eCellClone.style.width = '';
        // the original has position = absolute, we need to remove this so it's positioned normally
        eCellClone.style.position = 'static';
        eCellClone.style.left = '';
        // we put the cell into a containing div, as otherwise the cells would just line up
        // on the same line, standard flow layout, by putting them into divs, they are laid
        // out one per line
        const eCloneParent = document.createElement('div');
        const eCloneParentClassList = eCloneParent.classList;
        const isHeader = ['ag-header-cell', 'ag-header-group-cell'].some((cls) => eCellClone.classList.contains(cls));

        if (isHeader) {
            eCloneParentClassList.add('ag-header', 'ag-header-row');
            eCloneParent.style.position = 'static';
        } else {
            eCloneParentClassList.add('ag-row');
        }

        // find parent using classes (headers have ag-header-cell, rows have ag-row), and copy classes from it.
        // if we didn't do this, things like ag-row-level-2 would be missing if present, which sets indents
        // onto group items.
        let pointer = eCell.parentElement;
        while (pointer) {
            const isRow = ['ag-header-row', 'ag-row'].some((cls) => pointer!.classList.contains(cls));
            if (isRow) {
                for (let i = 0; i < pointer.classList.length; i++) {
                    const item = pointer.classList[i];

                    // we skip ag-row-position-absolute, as this has structural CSS applied that stops the
                    // element from fitting into it's parent, and we need the element to stretch the parent
                    // as we are measuring the parents width
                    if (item != 'ag-row-position-absolute') {
                        eCloneParentClassList.add(item);
                    }
                }
                break;
            }
            pointer = pointer.parentElement;
        }

        // the twig on the branch, the branch on the tree, the tree in the hole,
        // the hole in the bog, the bog in the clone, the clone in the parent,
        // the parent in the dummy, and the dummy down in the vall-e-ooo, OOOOOOOOO! Oh row the rattling bog....
        eCloneParent.appendChild(eCellClone);
        eDummyContainer.appendChild(eCloneParent);
    }
}
