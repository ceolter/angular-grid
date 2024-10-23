import type { DragAndDropIcon, DragItem, DraggingEvent, DropTarget, ListOption } from 'ag-grid-community';
import {
    AgSelect,
    Component,
    DragSourceType,
    _escapeString,
    _getActiveDomElement,
    _removeFromParent,
} from 'ag-grid-community';

import { PillDragComp } from '../../widgets/pillDragComp';
import { PillDropZonePanel } from '../../widgets/pillDropZonePanel';
import { agPillSelectCSS } from './agPillSelect.css-GENERATED';

export interface AgPillSelectParams<TValue = string | null> {
    valueList?: TValue[];
    selectedValueList?: TValue[];
    valueFormatter?: (value: TValue) => string;
    ariaLabel?: string;
    selectPlaceholder?: string;
    onValuesChange?: (params: AgPillSelectChangeParams<TValue>) => void;
    dragSourceId?: string;
    maxSelection?: number;
}

export interface AgPillSelectChangeParams<TValue> {
    added: TValue[];
    removed: TValue[];
    updated: TValue[];
    selected: TValue[];
}

export class AgPillSelect<TValue = string | null> extends Component {
    private dropZonePanel: PillSelectDropZonePanel<TValue>;
    private eSelect?: AgSelect<TValue>;

    private readonly config: AgPillSelectParams<TValue>;
    private valueList: TValue[];
    private selectedValues: TValue[];
    private valueFormatter: (value: TValue) => string;
    private onValuesChange?: (params: AgPillSelectChangeParams<TValue>) => void;

    constructor(config?: AgPillSelectParams<TValue>) {
        super(/* html */ `<div class="ag-pill-select" role="presentation"></div>`);
        this.config = config ?? {};

        const { selectedValueList, valueFormatter, valueList } = this.config;
        this.selectedValues = selectedValueList ?? [];
        this.valueList = valueList ?? [];
        this.valueFormatter = valueFormatter ?? ((value) => _escapeString(value as any)!);
        this.registerCSS(agPillSelectCSS);
    }

    public postConstruct(): void {
        const { ariaLabel, onValuesChange, dragSourceId } = this.config;
        this.dropZonePanel = this.createManagedBean(
            new PillSelectDropZonePanel(
                {
                    getValues: () => this.selectedValues,
                    setValues: (values) => this.updateValues(values),
                    isDraggable: () => this.selectedValues.length > 1,
                },
                (value) => this.valueFormatter(value),
                ariaLabel!,
                dragSourceId
            )
        );
        const eGui = this.getGui();
        eGui.appendChild(this.dropZonePanel.getGui());
        this.initSelect();
        if (onValuesChange != null) {
            this.onValuesChange = onValuesChange;
        }
    }

    public setValues(valueList: TValue[], selectedValues: TValue[]): this {
        const { added, removed, updated } = this.getChanges(this.valueList, valueList);
        let refreshSelect = false;
        if (added.length || removed.length || updated.length) {
            refreshSelect = true;
        }
        this.valueList = valueList;
        this.updateValues(selectedValues, refreshSelect, true);
        return this;
    }

    public setValueFormatter(valueFormatter: (value: TValue) => string): this {
        this.valueFormatter = valueFormatter;
        return this;
    }

    private initSelect(): boolean {
        const options = this.createSelectOptions();
        if (!options.length) {
            return false;
        }
        const { selectPlaceholder: placeholder } = this.config;
        this.eSelect = this.createBean(
            new AgSelect({
                options,
                placeholder,
                onValueChange: (value) => this.addValue(value),
                pickerIcon: 'chartsMenuAdd',
            })
        );
        this.getGui().appendChild(this.eSelect.getGui());
        return true;
    }

    private createSelectOptions(): ListOption<TValue>[] {
        const options: ListOption<TValue>[] = [];
        const { maxSelection } = this.config;
        if (maxSelection && this.selectedValues.length >= maxSelection) {
            return options;
        }
        this.valueList.forEach((value) => {
            if (!this.selectedValues.includes(value)) {
                options.push({ value, text: this.valueFormatter(value) });
            }
        });
        return options;
    }

    private addValue(value: TValue): void {
        this.dropZonePanel.addItem(value);
    }

    private updateValues(values: TValue[], forceRefreshSelect?: boolean, silent?: boolean): void {
        const previousSelectedValues = this.selectedValues;
        this.selectedValues = values;
        const changes = this.getChanges(previousSelectedValues, values);
        const refreshSelect = forceRefreshSelect || changes.added.length || changes.removed.length;
        const activeElement = _getActiveDomElement(this.gos);
        const selectHasFocus = this.eSelect?.getGui().contains(activeElement);
        const dropZoneHasFocus = this.dropZonePanel?.getGui().contains(activeElement);
        if (!silent) {
            this.onValuesChange?.(changes);
        }
        const emptyRefreshedSelect = refreshSelect ? !this.refreshSelect() : false;
        this.dropZonePanel.refreshGui();
        if (refreshSelect && selectHasFocus) {
            if (emptyRefreshedSelect) {
                this.dropZonePanel.focusList(true);
            } else {
                this.eSelect?.getFocusableElement().focus();
            }
        }
        if (dropZoneHasFocus && !values.length) {
            this.eSelect?.getFocusableElement().focus();
        }
    }

    private getChanges(
        previousSelectedValues: TValue[],
        newSelectedValues: TValue[]
    ): AgPillSelectChangeParams<TValue> {
        const added = newSelectedValues.filter((value) => !previousSelectedValues.includes(value));
        const removed = previousSelectedValues.filter((value) => !newSelectedValues.includes(value));
        const updated = newSelectedValues.filter((value, index) => previousSelectedValues[index] !== value);
        return { added, removed, updated, selected: newSelectedValues };
    }

    private refreshSelect(): boolean {
        if (!this.eSelect) {
            return this.initSelect();
        }
        const options = this.createSelectOptions();
        if (!options.length) {
            _removeFromParent(this.eSelect.getGui());
            this.eSelect = this.destroyBean(this.eSelect);
            return false;
        }
        this.eSelect.clearOptions().addOptions(options).setValue(undefined, true);
        return true;
    }

    public override destroy(): void {
        this.destroyBean(this.eSelect);
        super.destroy();
    }
}

class PillSelectDragComp<TValue> extends PillDragComp<TValue> {
    constructor(
        private readonly value: TValue,
        dragSourceDropTarget: DropTarget,
        ghost: boolean,
        private readonly valueFormatter: (value: TValue) => string,
        private readonly draggable: boolean,
        private readonly sourceId?: string
    ) {
        super(dragSourceDropTarget, ghost, false);
    }

    public getItem(): TValue {
        return this.value;
    }

    protected getDisplayName(): string {
        return this.valueFormatter(this.value);
    }

    protected getAriaDisplayName(): string {
        return this.getDisplayName();
    }

    protected getTooltip(): string | null | undefined {
        return undefined;
    }

    protected createGetDragItem(): () => DragItem<TValue> {
        return () => ({
            value: this.value,
        });
    }

    protected getDragSourceType(): DragSourceType {
        return DragSourceType.ChartPanel;
    }

    protected override getDragSourceId(): string | undefined {
        return this.sourceId;
    }

    protected override isDraggable(): boolean {
        return this.draggable;
    }
}

class PillSelectDropZonePanel<TValue> extends PillDropZonePanel<PillSelectDragComp<TValue>, TValue> {
    constructor(
        private readonly model: {
            getValues: () => TValue[];
            setValues: (values: TValue[]) => void;
            isDraggable: () => boolean;
        },
        private readonly valueFormatter: (value: TValue) => string,
        private readonly ariaLabel: string,
        private readonly sourceId?: string
    ) {
        super(false);
    }

    public postConstruct(): void {
        super.init();
    }

    protected isItemDroppable(item: TValue, draggingEvent: DraggingEvent): boolean {
        return (
            this.isSourceEventFromTarget(draggingEvent) ||
            (this.sourceId != null && this.sourceId === draggingEvent.dragSource.sourceId)
        );
    }

    protected updateItems(items: TValue[]): void {
        this.model.setValues(items);
    }

    protected getExistingItems(): TValue[] {
        return this.model.getValues();
    }

    protected getIconName(): DragAndDropIcon {
        return this.isPotentialDndItems() ? 'move' : 'notAllowed';
    }

    protected getAriaLabel(): string {
        return this.ariaLabel;
    }

    protected createPillComponent(item: TValue, dropTarget: DropTarget, ghost: boolean): PillSelectDragComp<TValue> {
        return new PillSelectDragComp(
            item,
            dropTarget,
            ghost,
            this.valueFormatter,
            this.model.isDraggable(),
            this.sourceId
        );
    }

    protected getItems(dragItem: DragItem): TValue[] {
        return [dragItem.value];
    }

    protected isInterestedIn(type: DragSourceType): boolean {
        return type === DragSourceType.ChartPanel;
    }
}
