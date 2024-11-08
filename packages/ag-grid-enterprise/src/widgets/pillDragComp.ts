import type {
    AgEvent,
    BeanCollection,
    ComponentSelector,
    DragAndDropIcon,
    DragAndDropService,
    DragItem,
    DragSource,
    DragSourceType,
    DropTarget,
    ITooltipCtrl,
    Registry,
    TooltipFeature,
} from 'ag-grid-community';
import {
    Component,
    KeyCode,
    RefPlaceholder,
    TouchListener,
    _createIconNoSpan,
    _escapeString,
    _setAriaLabel,
    _setDisplayed,
} from 'ag-grid-community';

export type PillDragCompEvent = 'columnRemove';
export abstract class PillDragComp<TItem> extends Component<PillDragCompEvent> {
    private dragAndDrop?: DragAndDropService;
    private registry: Registry;

    public wireBeans(beans: BeanCollection) {
        this.dragAndDrop = beans.dragAndDrop;
        this.registry = beans.registry;
    }

    private readonly eText: HTMLElement = RefPlaceholder;
    private readonly eDragHandle: HTMLElement = RefPlaceholder;
    private readonly eButton: HTMLElement = RefPlaceholder;

    public abstract getItem(): TItem;
    protected abstract getDisplayName(): string;
    protected abstract getAriaDisplayName(): string;
    protected abstract getTooltip(): string | null | undefined;
    protected abstract createGetDragItem(): () => DragItem<TItem>;
    protected abstract getDragSourceType(): DragSourceType;
    private tooltipFeature?: TooltipFeature;

    constructor(
        private dragSourceDropTarget: DropTarget,
        private ghost: boolean,
        private horizontal: boolean,
        protected template?: string,
        protected agComponents?: ComponentSelector[]
    ) {
        super();
    }

    public postConstruct(): void {
        this.setTemplate(
            this.template ??
                /* html */ `
            <span role="option">
              <span data-ref="eDragHandle" class="ag-drag-handle ag-column-drop-cell-drag-handle" role="presentation"></span>
              <span data-ref="eText" class="ag-column-drop-cell-text" aria-hidden="true"></span>
              <span data-ref="eButton" class="ag-column-drop-cell-button" role="presentation"></span>
            </span>`,
            this.agComponents
        );
        const eGui = this.getGui();

        this.addElementClasses(eGui);
        this.addElementClasses(this.eDragHandle, 'drag-handle');
        this.addElementClasses(this.eText, 'text');
        this.addElementClasses(this.eButton, 'button');

        this.eDragHandle.appendChild(_createIconNoSpan('columnDrag', this.beans)!);

        this.eButton.appendChild(_createIconNoSpan('cancel', this.beans)!);

        this.tooltipFeature = this.createOptionalManagedBean(
            this.registry.createDynamicBean<TooltipFeature>('tooltipFeature', false, {
                getGui: () => this.getGui(),
            } as ITooltipCtrl)
        );

        this.setupComponents();

        if (!this.ghost && this.isDraggable()) {
            this.addDragSource();
        }

        this.setupAria();

        this.setupTooltip();
        this.activateTabIndex();

        this.refreshDraggable();
    }

    protected isDraggable(): boolean {
        return true;
    }

    protected refreshDraggable(): void {
        this.eDragHandle.classList.toggle('ag-column-select-column-readonly', !this.isDraggable());
    }

    protected setupAria() {
        const translate = this.getLocaleTextFunc();

        const ariaInstructions = [this.getAriaDisplayName()];

        this.addAdditionalAriaInstructions(ariaInstructions, translate);

        _setAriaLabel(this.getGui(), ariaInstructions.join('. '));
    }

    protected addAdditionalAriaInstructions(
        ariaInstructions: string[],
        translate: (key: string, defaultValue: string) => string
    ): void {
        if (this.isRemovable()) {
            const deleteAria = translate('ariaDropZoneColumnComponentDescription', 'Press DELETE to remove');
            ariaInstructions.push(deleteAria);
        }
    }

    private setupTooltip(): void {
        const refresh = () => this.tooltipFeature?.setTooltipAndRefresh(this.getTooltip());

        refresh();

        this.addManagedEventListeners({ newColumnsLoaded: refresh });
    }

    protected getDragSourceId(): string | undefined {
        return undefined;
    }

    protected getDefaultIconName(): DragAndDropIcon {
        return 'notAllowed';
    }

    private addDragSource(): void {
        const { dragAndDrop, eDragHandle } = this;
        const getDragItem = this.createGetDragItem();
        const defaultIconName = this.getDefaultIconName();
        const dragSource: DragSource = {
            type: this.getDragSourceType(),
            sourceId: this.getDragSourceId(),
            eElement: eDragHandle,
            getDefaultIconName: () => defaultIconName,
            getDragItem,
            dragItemName: this.getDisplayName(),
        };

        dragAndDrop?.addDragSource(dragSource, true);
        this.addDestroyFunc(() => dragAndDrop?.removeDragSource(dragSource));
    }

    protected setupComponents(): void {
        this.setTextValue();
        this.setupRemove();

        if (this.ghost) {
            this.addCssClass('ag-column-drop-cell-ghost');
        }
    }

    protected isRemovable(): boolean {
        return true;
    }

    protected refreshRemove(): void {
        _setDisplayed(this.eButton, this.isRemovable());
    }

    private setupRemove(): void {
        this.refreshRemove();

        const agEvent: AgEvent<PillDragCompEvent> = { type: 'columnRemove' };

        this.addGuiEventListener('keydown', (e: KeyboardEvent) => this.onKeyDown(e));

        this.addManagedElementListeners(this.eButton, {
            click: (mouseEvent: MouseEvent) => {
                this.dispatchLocalEvent(agEvent);
                mouseEvent.stopPropagation();
            },
        });

        const touchListener = new TouchListener(this.eButton);
        this.addManagedListeners(touchListener, {
            tap: () => this.dispatchLocalEvent(agEvent),
        });
        this.addDestroyFunc(touchListener.destroy.bind(touchListener));
    }

    protected onKeyDown(e: KeyboardEvent): void {
        const isDelete = e.key === KeyCode.DELETE;

        if (isDelete) {
            if (this.isRemovable()) {
                e.preventDefault();
                this.dispatchLocalEvent({ type: 'columnRemove' });
            }
        }
    }

    protected getDisplayValue(): string {
        return this.getDisplayName();
    }

    private setTextValue(): void {
        const displayValue = this.getDisplayValue();
        const displayValueSanitised: any = _escapeString(displayValue);

        this.eText.innerHTML = displayValueSanitised;
    }

    private addElementClasses(el: HTMLElement, suffix?: string) {
        suffix = suffix ? `-${suffix}` : '';
        const direction = this.horizontal ? 'horizontal' : 'vertical';
        el.classList.add(`ag-column-drop-cell${suffix}`, `ag-column-drop-${direction}-cell${suffix}`);
    }

    public override destroy(): void {
        super.destroy();
        (this.dragSourceDropTarget as any) = null;
    }
}
