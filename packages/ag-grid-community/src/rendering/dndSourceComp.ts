import type { AgColumn } from '../entities/agColumn';
import type { DndSourceOnRowDragParams } from '../entities/colDef';
import type { RowNode } from '../entities/rowNode';
import { _createIconNoSpan } from '../utils/icon';
import { Component } from '../widgets/component';

export class DndSourceComp extends Component {
    constructor(
        private readonly rowNode: RowNode,
        private readonly column: AgColumn,
        private readonly eCell: HTMLElement
    ) {
        super(/* html */ `<div class="ag-drag-handle ag-row-drag" draggable="true"></div>`);
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
        const { rowNode, column, eCell, gos } = this;
        const providedOnRowDrag = column.getColDef().dndSourceOnRowDrag;

        const dataTransfer = dragEvent.dataTransfer!;

        dataTransfer.setDragImage(eCell, 0, 0);

        if (providedOnRowDrag) {
            const params: DndSourceOnRowDragParams = gos.addGridCommonParams({
                rowNode,
                dragEvent,
            });
            providedOnRowDrag(params);
        } else {
            // default behaviour is to convert data to json and set into drag component
            try {
                const jsonData = JSON.stringify(rowNode.data);

                dataTransfer.setData('application/json', jsonData);
                dataTransfer.setData('text/plain', jsonData);
            } catch (e) {
                // if we cannot convert the data to json, then we do not set the type
            }
        }
    }

    private checkVisibility(): void {
        const visible = this.column.isDndSource(this.rowNode);
        this.setDisplayed(visible);
    }
}
