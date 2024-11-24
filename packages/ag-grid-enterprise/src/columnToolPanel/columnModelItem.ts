import type { AgColumn, AgProvidedColumnGroup, IEventEmitter, IEventListener } from 'ag-grid-community';
import { LocalEventService } from 'ag-grid-community';

export type ColumnModelItemEvent = 'expandedChanged';
export class ColumnModelItem implements IEventEmitter<ColumnModelItemEvent> {
    private localEventService: LocalEventService<ColumnModelItemEvent> = new LocalEventService();

    public readonly columnGroup: AgProvidedColumnGroup;
    public readonly column: AgColumn;
    public readonly children: ColumnModelItem[];

    private _expanded: boolean | undefined;
    public passesFilter: boolean;

    constructor(
        public readonly displayName: string | null,
        columnOrGroup: AgColumn | AgProvidedColumnGroup,
        public readonly depth: number,
        public readonly group = false,
        expanded?: boolean
    ) {
        if (group) {
            this.columnGroup = columnOrGroup as AgProvidedColumnGroup;
            this._expanded = expanded;
            this.children = [];
        } else {
            this.column = columnOrGroup as AgColumn;
        }
    }

    public get expanded(): boolean {
        return !!this._expanded;
    }

    public set expanded(expanded: boolean) {
        if (expanded === this._expanded) {
            return;
        }
        this._expanded = expanded;
        this.localEventService.dispatchEvent({ type: 'expandedChanged' });
    }

    public addEventListener<T extends ColumnModelItemEvent>(
        eventType: T,
        listener: IEventListener<ColumnModelItemEvent>
    ): void {
        this.localEventService.addEventListener(eventType, listener);
    }

    public removeEventListener<T extends ColumnModelItemEvent>(
        eventType: T,
        listener: IEventListener<ColumnModelItemEvent>
    ): void {
        this.localEventService.removeEventListener(eventType, listener);
    }
}
