import type { ColumnState } from '../columns/columnStateUtils';
import { BeanStub } from '../context/beanStub';
import type { AgEvent, ColumnEvent, ColumnEventType } from '../events';
import type {
    Column,
    ColumnEventName,
    ColumnGroup,
    ColumnGroupShowType,
    ColumnHighlightPosition,
    ColumnInstanceId,
    ColumnPinnedType,
    HeaderColumnId,
    ProvidedColumnGroup,
} from '../interfaces/iColumn';
import type { IFrameworkEventListenerService } from '../interfaces/iFrameworkEventListenerService';
import type { IRowNode } from '../interfaces/iRowNode';
import { LocalEventService } from '../localEventService';
import { _exists, _missing } from '../utils/generic';
import { _mergeDeep } from '../utils/object';
import { _warn } from '../validation/logging';
import type { AgColumnGroup } from './agColumnGroup';
import type { AgProvidedColumnGroup } from './agProvidedColumnGroup';
import type {
    AbstractColDef,
    BaseColDefParams,
    ColDef,
    ColSpanParams,
    ColumnFunctionCallbackParams,
    IAggFunc,
    RowSpanParams,
    SortDirection,
} from './colDef';

const COL_DEF_DEFAULTS: Partial<ColDef> = {
    resizable: true,
    sortable: true,
};

let instanceIdSequence = 0;
export function getNextColInstanceId(): ColumnInstanceId {
    return instanceIdSequence++ as ColumnInstanceId;
}

export function isColumn(col: Column | ColumnGroup | ProvidedColumnGroup): col is AgColumn {
    return col instanceof AgColumn;
}

// Wrapper around a user provide column definition. The grid treats the column definition as ready only.
// This class contains all the runtime information about a column, plus some logic (the definition has no logic).
// This class implements both interfaces ColumnGroupChild and ProvidedColumnGroupChild as the class can
// appear as a child of either the original tree or the displayed tree. However the relevant group classes
// for each type only implements one, as each group can only appear in it's associated tree (eg ProvidedColumnGroup
// can only appear in OriginalColumn tree).
export class AgColumn<TValue = any> extends BeanStub<ColumnEventName> implements Column {
    public readonly isColumn = true as const;

    private frameworkEventListenerService?: IFrameworkEventListenerService<any, any>;

    // used by React (and possibly other frameworks) as key for rendering. also used to
    // identify old vs new columns for destroying cols when no longer used.
    private instanceId = getNextColInstanceId();

    private actualWidth: any;

    // The measured height of this column's header when autoHeaderHeight is enabled
    private autoHeaderHeight: number | null = null;

    private visible: any;
    public pinned: ColumnPinnedType;
    private left: number | null;
    private oldLeft: number | null;
    public aggFunc: string | IAggFunc | null | undefined;
    public sort: SortDirection | undefined;
    public sortIndex: number | null | undefined;
    public moving = false;
    public menuVisible = false;
    public highlighted: ColumnHighlightPosition | null;

    private lastLeftPinned: boolean = false;
    private firstRightPinned: boolean = false;

    public minWidth: number;
    private maxWidth: number;

    public filterActive = false;

    private readonly colEventSvc: LocalEventService<ColumnEventName> = new LocalEventService();

    private fieldContainsDots: boolean;
    private tooltipFieldContainsDots: boolean;
    public tooltipEnabled = false;

    public rowGroupActive = false;
    public pivotActive = false;
    public aggregationActive = false;
    public flex: number | null = null;

    public parent: AgColumnGroup | null;
    public originalParent: AgProvidedColumnGroup | null;

    constructor(
        public colDef: ColDef<any, TValue>,
        // We do NOT use this anywhere, we just keep a reference. this is to check object equivalence
        // when the user provides an updated list of columns - so we can check if we have a column already
        // existing for a col def. we cannot use the this.colDef as that is the result of a merge.
        // This is used in ColumnFactory
        public userProvidedColDef: ColDef<any, TValue> | null,
        private readonly colId: string,
        private readonly primary: boolean
    ) {
        super();
    }

    public getInstanceId(): ColumnInstanceId {
        return this.instanceId;
    }

    private setState(): void {
        const {
            colDef,
            beans: { sortSvc, pinnedCols, colFlex },
        } = this;

        sortSvc?.initCol(this);

        const hide = colDef.hide;
        if (hide !== undefined) {
            this.visible = !hide;
        } else {
            this.visible = !colDef.initialHide;
        }

        pinnedCols?.initCol(this);

        colFlex?.initCol(this);
    }

    // gets called when user provides an alternative colDef, eg
    public setColDef(
        colDef: ColDef<any, TValue>,
        userProvidedColDef: ColDef<any, TValue> | null,
        source: ColumnEventType
    ): void {
        this.colDef = colDef;
        this.userProvidedColDef = userProvidedColDef;
        this.initMinAndMaxWidths();
        this.initDotNotation();
        this.initTooltip();
        this.dispatchColEvent('colDefChanged', source);
    }

    public getUserProvidedColDef(): ColDef<any, TValue> | null {
        return this.userProvidedColDef;
    }

    public getParent(): AgColumnGroup | null {
        return this.parent;
    }

    public getOriginalParent(): AgProvidedColumnGroup | null {
        return this.originalParent;
    }

    // this is done after constructor as it uses gridOptionsService
    public postConstruct(): void {
        this.setState();

        this.initMinAndMaxWidths();

        this.resetActualWidth('gridInitializing');

        this.initDotNotation();

        this.initTooltip();
    }

    private initDotNotation(): void {
        const {
            gos,
            colDef: { field, tooltipField },
        } = this;
        const suppressDotNotation = gos.get('suppressFieldDotNotation');
        this.fieldContainsDots = _exists(field) && field.indexOf('.') >= 0 && !suppressDotNotation;
        this.tooltipFieldContainsDots = _exists(tooltipField) && tooltipField.indexOf('.') >= 0 && !suppressDotNotation;
    }

    private initMinAndMaxWidths(): void {
        const colDef = this.colDef;

        this.minWidth = colDef.minWidth ?? this.beans.environment.getDefaultColumnMinWidth();
        this.maxWidth = colDef.maxWidth ?? Number.MAX_SAFE_INTEGER;
    }

    private initTooltip(): void {
        this.beans.tooltipSvc?.initCol(this);
    }

    public resetActualWidth(source: ColumnEventType): void {
        const initialWidth = this.calculateColInitialWidth(this.colDef);
        this.setActualWidth(initialWidth, source, true);
    }

    private calculateColInitialWidth(colDef: ColDef): number {
        let width: number;
        const colDefWidth = colDef.width;
        const colDefInitialWidth = colDef.initialWidth;

        if (colDefWidth != null) {
            width = colDefWidth;
        } else if (colDefInitialWidth != null) {
            width = colDefInitialWidth;
        } else {
            width = 200;
        }

        return Math.max(Math.min(width, this.maxWidth), this.minWidth);
    }

    public isEmptyGroup(): boolean {
        return false;
    }

    public isRowGroupDisplayed(colId: string): boolean {
        return this.beans.showRowGroupCols?.isRowGroupDisplayed(this, colId) ?? false;
    }

    public isPrimary(): boolean {
        return this.primary;
    }

    public isFilterAllowed(): boolean {
        // filter defined means it's a string, class or true.
        // if its false, null or undefined then it's false.
        const filterDefined = !!this.colDef.filter;
        return filterDefined;
    }

    public isFieldContainsDots(): boolean {
        return this.fieldContainsDots;
    }

    public isTooltipEnabled(): boolean {
        return this.tooltipEnabled;
    }

    public isTooltipFieldContainsDots(): boolean {
        return this.tooltipFieldContainsDots;
    }

    public getHighlighted(): ColumnHighlightPosition | null {
        return this.highlighted;
    }

    public override addEventListener<T extends ColumnEventName>(
        eventType: T,
        userListener: (params: ColumnEvent<T>) => void
    ): void {
        this.frameworkEventListenerService = this.beans.frameworkOverrides.createLocalEventListenerWrapper?.(
            this.frameworkEventListenerService,
            this.colEventSvc
        );
        const listener = this.frameworkEventListenerService?.wrap(userListener) ?? userListener;

        this.colEventSvc.addEventListener(eventType, listener);
    }

    public override removeEventListener<T extends ColumnEventName>(
        eventType: T,
        userListener: (params: ColumnEvent<T>) => void
    ): void {
        const listener = this.frameworkEventListenerService?.unwrap(userListener) ?? userListener;
        this.colEventSvc.removeEventListener(eventType, listener);
    }

    public createColumnFunctionCallbackParams(rowNode: IRowNode): ColumnFunctionCallbackParams {
        return this.gos.addGridCommonParams({
            node: rowNode,
            data: rowNode.data,
            column: this,
            colDef: this.colDef,
        });
    }

    public isSuppressNavigable(rowNode: IRowNode): boolean {
        return this.beans.cellNavigation?.isSuppressNavigable(this, rowNode) ?? false;
    }

    public isCellEditable(rowNode: IRowNode): boolean {
        return this.beans.editSvc?.isCellEditable(this, rowNode) ?? false;
    }

    public isSuppressFillHandle(): boolean {
        return !!this.colDef.suppressFillHandle;
    }

    public isAutoHeight(): boolean {
        return !!this.colDef.autoHeight;
    }

    public isAutoHeaderHeight(): boolean {
        return !!this.colDef.autoHeaderHeight;
    }

    public isRowDrag(rowNode: IRowNode): boolean {
        return this.isColumnFunc(rowNode, this.colDef.rowDrag);
    }

    public isDndSource(rowNode: IRowNode): boolean {
        return this.isColumnFunc(rowNode, this.colDef.dndSource);
    }

    public isCellCheckboxSelection(rowNode: IRowNode): boolean {
        return this.beans.selectionSvc?.isCellCheckboxSelection(this, rowNode) ?? false;
    }

    public isSuppressPaste(rowNode: IRowNode): boolean {
        return this.isColumnFunc(rowNode, this.colDef?.suppressPaste ?? null);
    }

    public isResizable(): boolean {
        return !!this.getColDefValue('resizable');
    }

    /** Get value from ColDef or default if it exists. */
    private getColDefValue<K extends keyof ColDef>(key: K): ColDef[K] {
        return this.colDef[key] ?? COL_DEF_DEFAULTS[key];
    }

    public isColumnFunc(
        rowNode: IRowNode,
        value?: boolean | ((params: ColumnFunctionCallbackParams) => boolean) | null
    ): boolean {
        // if boolean set, then just use it
        if (typeof value === 'boolean') {
            return value;
        }

        // if function, then call the function to find out
        if (typeof value === 'function') {
            const params = this.createColumnFunctionCallbackParams(rowNode);
            const editableFunc = value;
            return editableFunc(params);
        }

        return false;
    }

    private createColumnEvent<T extends ColumnEventName>(type: T, source: ColumnEventType): ColumnEvent<T> {
        return this.gos.addGridCommonParams({
            type,
            column: this,
            columns: [this],
            source,
        });
    }

    public isMoving(): boolean {
        return this.moving;
    }

    public getSort(): SortDirection | undefined {
        return this.sort;
    }

    public isSortable(): boolean {
        return !!this.getColDefValue('sortable');
    }

    /** @deprecated v32 use col.getSort() === 'asc */
    public isSortAscending(): boolean {
        return this.sort === 'asc';
    }

    /** @deprecated v32 use col.getSort() === 'desc */
    public isSortDescending(): boolean {
        return this.sort === 'desc';
    }
    /** @deprecated v32 use col.getSort() === undefined */
    public isSortNone(): boolean {
        return _missing(this.sort);
    }

    /** @deprecated v32 use col.getSort() !== undefined */
    public isSorting(): boolean {
        return _exists(this.sort);
    }

    public getSortIndex(): number | null | undefined {
        return this.sortIndex;
    }

    public isMenuVisible(): boolean {
        return this.menuVisible;
    }

    public getAggFunc(): string | IAggFunc | null | undefined {
        return this.aggFunc;
    }

    public getLeft(): number | null {
        return this.left;
    }

    public getOldLeft(): number | null {
        return this.oldLeft;
    }

    public getRight(): number {
        return this.left + this.actualWidth;
    }

    public setLeft(left: number | null, source: ColumnEventType) {
        this.oldLeft = this.left;
        if (this.left !== left) {
            this.left = left;
            this.dispatchColEvent('leftChanged', source);
        }
    }

    public isFilterActive(): boolean {
        return this.filterActive;
    }

    /** @deprecated v33 Use `api.isColumnHovered(column)` instead. */
    public isHovered(): boolean {
        _warn(261);
        return !!this.beans.colHover?.isHovered(this);
    }

    public setFirstRightPinned(firstRightPinned: boolean, source: ColumnEventType): void {
        if (this.firstRightPinned !== firstRightPinned) {
            this.firstRightPinned = firstRightPinned;
            this.dispatchColEvent('firstRightPinnedChanged', source);
        }
    }

    public setLastLeftPinned(lastLeftPinned: boolean, source: ColumnEventType): void {
        if (this.lastLeftPinned !== lastLeftPinned) {
            this.lastLeftPinned = lastLeftPinned;
            this.dispatchColEvent('lastLeftPinnedChanged', source);
        }
    }

    public isFirstRightPinned(): boolean {
        return this.firstRightPinned;
    }

    public isLastLeftPinned(): boolean {
        return this.lastLeftPinned;
    }

    public isPinned(): boolean {
        return this.pinned === 'left' || this.pinned === 'right';
    }

    public isPinnedLeft(): boolean {
        return this.pinned === 'left';
    }

    public isPinnedRight(): boolean {
        return this.pinned === 'right';
    }

    public getPinned(): ColumnPinnedType {
        return this.pinned;
    }

    public setVisible(visible: boolean, source: ColumnEventType): void {
        const newValue = visible === true;
        if (this.visible !== newValue) {
            this.visible = newValue;
            this.dispatchColEvent('visibleChanged', source);
        }
        this.dispatchStateUpdatedEvent('hide');
    }

    public isVisible(): boolean {
        return this.visible;
    }

    public isSpanHeaderHeight(): boolean {
        const colDef = this.getColDef();
        return !colDef.suppressSpanHeaderHeight;
    }

    public getColumnGroupPaddingInfo(): { numberOfParents: number; isSpanningTotal: boolean } {
        let parent = this.getParent();

        if (!parent || !parent.isPadding()) {
            return { numberOfParents: 0, isSpanningTotal: false };
        }

        const numberOfParents = parent.getPaddingLevel() + 1;
        let isSpanningTotal = true;

        while (parent) {
            if (!parent.isPadding()) {
                isSpanningTotal = false;
                break;
            }
            parent = parent.getParent();
        }

        return { numberOfParents, isSpanningTotal };
    }

    public getColDef(): ColDef<any, TValue> {
        return this.colDef;
    }
    public getDefinition(): AbstractColDef<any, TValue> {
        return this.colDef;
    }

    public getColumnGroupShow(): ColumnGroupShowType | undefined {
        return this.colDef.columnGroupShow;
    }

    public getColId(): string {
        return this.colId;
    }

    public getId(): string {
        return this.colId;
    }

    public getUniqueId(): HeaderColumnId {
        return this.colId as HeaderColumnId;
    }

    public getActualWidth(): number {
        return this.actualWidth;
    }

    public getAutoHeaderHeight(): number | null {
        return this.autoHeaderHeight;
    }

    /** Returns true if the header height has changed */
    public setAutoHeaderHeight(height: number): boolean {
        const changed = height !== this.autoHeaderHeight;
        this.autoHeaderHeight = height;
        return changed;
    }

    private createBaseColDefParams(rowNode: IRowNode): BaseColDefParams {
        const params: BaseColDefParams = this.gos.addGridCommonParams({
            node: rowNode,
            data: rowNode.data,
            colDef: this.colDef,
            column: this,
        });
        return params;
    }

    public getColSpan(rowNode: IRowNode): number {
        if (_missing(this.colDef.colSpan)) {
            return 1;
        }
        const params: ColSpanParams = this.createBaseColDefParams(rowNode);
        const colSpan = this.colDef.colSpan(params);
        // colSpan must be number equal to or greater than 1

        return Math.max(colSpan, 1);
    }

    public getRowSpan(rowNode: IRowNode): number {
        if (_missing(this.colDef.rowSpan)) {
            return 1;
        }
        const params: RowSpanParams = this.createBaseColDefParams(rowNode);
        const rowSpan = this.colDef.rowSpan(params);
        // rowSpan must be number equal to or greater than 1

        return Math.max(rowSpan, 1);
    }

    public setActualWidth(actualWidth: number, source: ColumnEventType, silent: boolean = false): void {
        actualWidth = Math.max(actualWidth, this.minWidth);
        actualWidth = Math.min(actualWidth, this.maxWidth);
        if (this.actualWidth !== actualWidth) {
            // disable flex for this column if it was manually resized.
            this.actualWidth = actualWidth;
            if (this.flex && source !== 'flex' && source !== 'gridInitializing') {
                this.flex = null;
            }

            if (!silent) {
                this.fireColumnWidthChangedEvent(source);
            }
        }
        this.dispatchStateUpdatedEvent('width');
    }

    public fireColumnWidthChangedEvent(source: ColumnEventType): void {
        this.dispatchColEvent('widthChanged', source);
    }

    public isGreaterThanMax(width: number): boolean {
        return width > this.maxWidth;
    }

    public getMinWidth(): number {
        return this.minWidth;
    }

    public getMaxWidth(): number {
        return this.maxWidth;
    }

    public getFlex(): number | null {
        return this.flex;
    }

    public isRowGroupActive(): boolean {
        return this.rowGroupActive;
    }

    public isPivotActive(): boolean {
        return this.pivotActive;
    }

    public isAnyFunctionActive(): boolean {
        return this.isPivotActive() || this.isRowGroupActive() || this.isValueActive();
    }

    public isAnyFunctionAllowed(): boolean {
        return this.isAllowPivot() || this.isAllowRowGroup() || this.isAllowValue();
    }

    public isValueActive(): boolean {
        return this.aggregationActive;
    }

    public isAllowPivot(): boolean {
        return this.colDef.enablePivot === true;
    }

    public isAllowValue(): boolean {
        return this.colDef.enableValue === true;
    }

    public isAllowRowGroup(): boolean {
        return this.colDef.enableRowGroup === true;
    }

    public dispatchColEvent(type: ColumnEventName, source: ColumnEventType, additionalEventAttributes?: any): void {
        const colEvent = this.createColumnEvent(type, source);
        if (additionalEventAttributes) {
            _mergeDeep(colEvent, additionalEventAttributes);
        }
        this.colEventSvc.dispatchEvent(colEvent);
    }

    public dispatchStateUpdatedEvent(key: keyof ColumnState): void {
        this.colEventSvc.dispatchEvent({
            type: 'columnStateUpdated',
            key,
        } as AgEvent<'columnStateUpdated'>);
    }
}
