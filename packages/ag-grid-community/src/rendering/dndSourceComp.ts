import type { AgColumn } from '../entities/agColumn';
import type { DndSourceOnRowDragParams } from '../entities/colDef';
import type { RowNode } from '../entities/rowNode';
import { _createIconNoSpan } from '../utils/icon';
import { Component } from '../widgets/component';

export class DndSourceComp extends Component {
    private readonly rowNode: RowNode;
    private readonly column: AgColumn;
    private readonly eCell: HTMLElement;

    constructor(rowNode: RowNode, column: AgColumn, eCell: HTMLElement) {
        super(/* html */ `<div class="ag-drag-handle ag-row-drag" draggable="true"></div>`);
        this.rowNode = rowNode;
        this.column = column;
        this.eCell = eCell;
    }

    public postConstruct(): void {
        const eGui = this.getGui();
        eGui.appendChild(_createIconNoSpan('rowDrag', this.beans, null)!);
        // we need to stop the event propagation here to avoid starting a range selection while dragging
        this.addGuiEventListener('mousedown', (e: MouseEvent) => {
            e.stopPropagation();
        });
        this.addDragSource();
        this.checkVisibility();
    }

    private addDragSource(): void {
        this.addGuiEventListener('dragstart', this.onDragStart.bind(this));
    }

    private onDragStart(dragEvent: DragEvent): void {
        const providedOnRowDrag = this.column.getColDef().dndSourceOnRowDrag;

        dragEvent.dataTransfer!.setDragImage(this.eCell, 0, 0);

        // default behaviour is to convert data to json and set into drag component
        const defaultOnRowDrag = () => {
            try {
                const jsonData = JSON.stringify(this.rowNode.data);

                dragEvent.dataTransfer!.setData('application/json', jsonData);
                dragEvent.dataTransfer!.setData('text/plain', jsonData);
            } catch (e) {
                // if we cannot convert the data to json, then we do not set the type
            }
        };

        if (providedOnRowDrag) {
            const params: DndSourceOnRowDragParams = this.gos.addGridCommonParams({
                rowNode: this.rowNode,
                dragEvent: dragEvent,
            });
            providedOnRowDrag(params);
        } else {
            defaultOnRowDrag();
        }
    }

    private checkVisibility(): void {
        const visible = this.column.isDndSource(this.rowNode);
        this.setDisplayed(visible);
    }
}
