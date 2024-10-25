import { BeanStub } from '../context/beanStub';
import type { AgColumn } from '../entities/agColumn';
import type { RowNode } from '../entities/rowNode';
import type { AgEventType } from '../eventTypes';
import type { IRowDragItem } from '../interfaces/iRowDragItem';
import { _createIconNoSpan } from '../utils/icon';
import { Component } from '../widgets/component';
import type { DragSource } from './dragAndDropService';
import { DragSourceType } from './dragAndDropService';

export class RowDragComp extends Component {
    private dragSource: DragSource | null = null;
    private mouseDownListener: (() => void) | undefined;

    constructor(
        private readonly cellValueFn: () => string,
        private readonly rowNode: RowNode,
        private readonly column?: AgColumn,
        private readonly customGui?: HTMLElement,
        private readonly dragStartPixels?: number,
        private readonly suppressVisibilityChange?: boolean
    ) {
        super();
    }

    public isCustomGui(): boolean {
        return this.customGui != null;
    }

    public postConstruct(): void {
        if (!this.customGui) {
            this.setTemplate(/* html */ `<div class="ag-drag-handle ag-row-drag" aria-hidden="true"></div>`);
            this.getGui().appendChild(_createIconNoSpan('rowDrag', this.beans, null)!);
            this.addDragSource();
        } else {
            this.setDragElement(this.customGui, this.dragStartPixels);
        }

        if (!this.suppressVisibilityChange) {
            const strategy = this.gos.get('rowDragManaged')
                ? new ManagedVisibilityStrategy(this, this.rowNode, this.column)
                : new NonManagedVisibilityStrategy(this, this.rowNode, this.column);

            this.createManagedBean(strategy, this.beans.context);
        }
    }

    public setDragElement(dragElement: HTMLElement, dragStartPixels?: number) {
        // We set suppressDataRefValidation as the drag element could contain AG Grid comps with data references
        // that are not part of this row dragger's context. Maybe this should just setGui and not setTemplateFromElement?
        this.setTemplateFromElement(dragElement, undefined, undefined, true);
        this.addDragSource(dragStartPixels);
    }

    private getSelectedNodes(): RowNode[] {
        const isRowDragMultiRow = this.gos.get('rowDragMultiRow');
        if (!isRowDragMultiRow) {
            return [this.rowNode];
        }

        const selection = this.beans.selectionSvc?.getSelectedNodes() ?? [];

        return selection.indexOf(this.rowNode) !== -1 ? selection : [this.rowNode];
    }

    private getDragItem(): IRowDragItem {
        return {
            rowNode: this.rowNode,
            rowNodes: this.getSelectedNodes(),
            columns: this.column ? [this.column] : undefined,
            defaultTextValue: this.cellValueFn(),
        };
    }

    private getRowDragText(column?: AgColumn) {
        if (column) {
            const colDef = column.getColDef();
            if (colDef.rowDragText) {
                return colDef.rowDragText;
            }
        }
        return this.gos.get('rowDragText');
    }

    private addDragSource(dragStartPixels: number = 4): void {
        // if this is changing the drag element, delete the previous dragSource
        if (this.dragSource) {
            this.removeDragSource();
        }

        const eGui = this.getGui();

        if (this.gos.get('enableCellTextSelection')) {
            this.removeMouseDownListener();

            this.mouseDownListener = this.addManagedElementListeners(eGui, {
                mousedown: (e) => {
                    e?.preventDefault();
                },
            })[0];
        }

        const translate = this.getLocaleTextFunc();

        this.dragSource = {
            type: DragSourceType.RowDrag,
            eElement: eGui,
            dragItemName: () => {
                const dragItem = this.getDragItem();
                const dragItemCount = dragItem.rowNodes?.length || 1;

                const rowDragText = this.getRowDragText(this.column);
                if (rowDragText) {
                    return rowDragText(dragItem, dragItemCount);
                }

                return dragItemCount === 1
                    ? this.cellValueFn()
                    : `${dragItemCount} ${translate('rowDragRows', 'rows')}`;
            },
            getDragItem: () => this.getDragItem(),
            dragStartPixels,
            dragSourceDomDataKey: this.gos.getDomDataKey(),
        };

        this.beans.dragAndDrop!.addDragSource(this.dragSource, true);
    }

    public override destroy(): void {
        this.removeDragSource();
        this.removeMouseDownListener();
        super.destroy();
    }

    private removeDragSource() {
        if (!this.dragSource) {
            return;
        }

        this.beans.dragAndDrop!.removeDragSource(this.dragSource);
        this.dragSource = null;
    }

    private removeMouseDownListener() {
        if (!this.mouseDownListener) {
            return;
        }

        this.mouseDownListener();
        this.mouseDownListener = undefined;
    }
}

class VisibilityStrategy extends BeanStub {
    private readonly parent: RowDragComp;
    private readonly column: AgColumn | undefined;
    protected readonly rowNode: RowNode;

    constructor(parent: RowDragComp, rowNode: RowNode, column?: AgColumn) {
        super();
        this.parent = parent;
        this.rowNode = rowNode;
        this.column = column;
    }

    protected setDisplayedOrVisible(neverDisplayed: boolean): void {
        const displayedOptions = { skipAriaHidden: true };
        if (neverDisplayed) {
            this.parent.setDisplayed(false, displayedOptions);
        } else {
            let shown: boolean = true;
            let isShownSometimes: boolean = false;

            if (this.column) {
                shown = this.column.isRowDrag(this.rowNode) || this.parent.isCustomGui();
                isShownSometimes = typeof this.column.getColDef().rowDrag === 'function';
            }

            // if shown sometimes, them some rows can have drag handle while other don't,
            // so we use setVisible to keep the handles horizontally aligned (as _setVisible
            // keeps the empty space, whereas setDisplayed looses the space)
            if (isShownSometimes) {
                this.parent.setDisplayed(true, displayedOptions);
                this.parent.setVisible(shown, displayedOptions);
            } else {
                this.parent.setDisplayed(shown, displayedOptions);
                this.parent.setVisible(true, displayedOptions);
            }
        }
    }
}

// when non managed, the visibility depends on suppressRowDrag property only
class NonManagedVisibilityStrategy extends VisibilityStrategy {
    constructor(parent: RowDragComp, rowNode: RowNode, column?: AgColumn) {
        super(parent, rowNode, column);
    }

    public postConstruct(): void {
        this.addManagedPropertyListener('suppressRowDrag', this.onSuppressRowDrag.bind(this));

        // in case data changes, then we need to update visibility of drag item
        const listener = this.workOutVisibility.bind(this);
        this.addManagedListeners(this.rowNode, {
            dataChanged: listener,
            cellChanged: listener,
        });

        this.addManagedListeners(this.beans.eventSvc, { newColumnsLoaded: listener });

        this.workOutVisibility();
    }

    private onSuppressRowDrag(): void {
        this.workOutVisibility();
    }

    private workOutVisibility(): void {
        // only show the drag if both sort and filter are not present
        const neverDisplayed = this.gos.get('suppressRowDrag');
        this.setDisplayedOrVisible(neverDisplayed);
    }
}

// when managed, the visibility depends on sort, filter and row group, as well as suppressRowDrag property
class ManagedVisibilityStrategy extends VisibilityStrategy {
    constructor(parent: RowDragComp, rowNode: RowNode, column?: AgColumn) {
        super(parent, rowNode, column);
    }

    public postConstruct(): void {
        const listener = this.workOutVisibility.bind(this);
        // we do not show the component if sort, filter or grouping is active
        this.addManagedListeners<AgEventType>(this.beans.eventSvc, {
            sortChanged: listener,
            filterChanged: listener,
            columnRowGroupChanged: listener,
            newColumnsLoaded: listener,
        });

        // in case data changes, then we need to update visibility of drag item
        this.addManagedListeners(this.rowNode, {
            dataChanged: listener,
            cellChanged: listener,
        });

        this.addManagedPropertyListener('suppressRowDrag', this.onSuppressRowDrag.bind(this));

        this.workOutVisibility();
    }

    private onSuppressRowDrag(): void {
        this.workOutVisibility();
    }

    private workOutVisibility(): void {
        // only show the drag if both sort and filter are not present
        const rowDragFeature = this.beans.rowDragSvc!.getRowDragFeature();
        const shouldPreventRowMove = rowDragFeature && rowDragFeature.shouldPreventRowMove();
        const suppressRowDrag = this.gos.get('suppressRowDrag');
        const hasExternalDropZones = this.beans.dragAndDrop!.hasExternalDropZones();
        const neverDisplayed = (shouldPreventRowMove && !hasExternalDropZones) || suppressRowDrag;

        this.setDisplayedOrVisible(neverDisplayed);
    }
}
