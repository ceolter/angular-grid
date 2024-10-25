import type { ColumnState } from '../columns/columnStateService';
import { isColumnSelectionCol } from '../columns/columnUtils';
import { BeanStub } from '../context/beanStub';
import type { AgEvent, ColumnEvent, ColumnEventType } from '../events';
import { _getCheckboxes } from '../gridOptionsUtils';
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

    private readonly colId: any;
    private colDef: ColDef<any, TValue>;

    // used by React (and possibly other frameworks) as key for rendering. also used to
    // identify old vs new columns for destroying cols when no longer used.
    private instanceId = getNextColInstanceId();

    // We do NOT use this anywhere, we just keep a reference. this is to check object equivalence
    // when the user provides an updated list of columns - so we can check if we have a column already
    // existing for a col def. we cannot use the this.colDef as that is the result of a merge.
    // This is used in ColumnFactory
    private userProvidedColDef: ColDef<any, TValue> | null;

    private actualWidth: any;

    // The measured height of this column's header when autoHeaderHeight is enabled
    private autoHeaderHeight: number | null = null;

    private visible: any;
    private pinned: ColumnPinnedType;
    private left: number | null;
    private oldLeft: number | null;
    private aggFunc: string | IAggFunc | null | undefined;
    private sort: SortDirection | undefined;
    private sortIndex: number | null | undefined;
    private moving = false;
    private menuVisible = false;
    private highlighted: ColumnHighlightPosition | null;

    private lastLeftPinned: boolean = false;
    private firstRightPinned: boolean = false;

    private minWidth: number;
    private maxWidth: number;

    private filterActive = false;

    private columnEventService: LocalEventService<ColumnEventName> = new LocalEventService();

    private fieldContainsDots: boolean;
    private tooltipFieldContainsDots: boolean;
    private tooltipEnabled = false;

    private rowGroupActive = false;
    private pivotActive = false;
    private aggregationActive = false;
    private flex: number | null = null;

    private readonly primary: boolean;

    private parent: AgColumnGroup | null;
    private originalParent: AgProvidedColumnGroup | null;

    constructor(
        colDef: ColDef<any, TValue>,
        userProvidedColDef: ColDef<any, TValue> | null,
        colId: string,
        primary: boolean
    ) {
        super();
        this.colDef = colDef;
        this.userProvidedColDef = userProvidedColDef;
        this.colId = colId;
        this.primary = primary;

        this.setState(colDef);
    }

    public getInstanceId(): ColumnInstanceId {
        return this.instanceId;
    }

    private setState(colDef: ColDef): void {
        // sort
        if (colDef.sort !== undefined) {
            if (colDef.sort === 'asc' || colDef.sort === 'desc') {
                this.sort = colDef.sort;
            }
        } else {
            if (colDef.initialSort === 'asc' || colDef.initialSort === 'desc') {
                this.sort = colDef.initialSort;
            }
        }

        // sortIndex
        const sortIndex = colDef.sortIndex;
        const initialSortIndex = colDef.initialSortIndex;
        if (sortIndex !== undefined) {
            if (sortIndex !== null) {
                this.sortIndex = sortIndex;
            }
        } else {
            if (initialSortIndex !== null) {
                this.sortIndex = initialSortIndex;
            }
        }

        // hide
        const hide = colDef.hide;
        const initialHide = colDef.initialHide;

        if (hide !== undefined) {
            this.visible = !hide;
        } else {
            this.visible = !initialHide;
        }

        // pinned
        if (colDef.pinned !== undefined) {
            this.setPinned(colDef.pinned);
        } else {
            this.setPinned(colDef.initialPinned);
        }

        // flex
        const flex = colDef.flex;
        const initialFlex = colDef.initialFlex;
        if (flex !== undefined) {
            this.flex = flex;
        } else if (initialFlex !== undefined) {
            this.flex = initialFlex;
        }
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
        this.columnEventService.dispatchEvent(this.createColumnEvent('colDefChanged', source));
    }

    public getUserProvidedColDef(): ColDef<any, TValue> | null {
        return this.userProvidedColDef;
    }

    public setParent(parent: AgColumnGroup | null): void {
        this.parent = parent;
    }

    public getParent(): AgColumnGroup | null {
        return this.parent;
    }

    public setOriginalParent(originalParent: AgProvidedColumnGroup | null): void {
        this.originalParent = originalParent;
    }

    public getOriginalParent(): AgProvidedColumnGroup | null {
        return this.originalParent;
    }

    // this is done after constructor as it uses gridOptionsService
    public postConstruct(): void {
        this.initMinAndMaxWidths();

        this.resetActualWidth('gridInitializing');

        this.initDotNotation();

        this.initTooltip();
    }

    private initDotNotation(): void {
        const suppressDotNotation = this.gos.get('suppressFieldDotNotation');
        this.fieldContainsDots =
            _exists(this.colDef.field) && this.colDef.field.indexOf('.') >= 0 && !suppressDotNotation;
        this.tooltipFieldContainsDots =
            _exists(this.colDef.tooltipField) && this.colDef.tooltipField.indexOf('.') >= 0 && !suppressDotNotation;
    }

    private initMinAndMaxWidths(): void {
        const colDef = this.colDef;

        this.minWidth = colDef.minWidth ?? this.gos.environment.getDefaultColumnMinWidth();
        this.maxWidth = colDef.maxWidth ?? Number.MAX_SAFE_INTEGER;
    }

    private initTooltip(): void {
        this.tooltipEnabled =
            _exists(this.colDef.tooltipField) ||
            _exists(this.colDef.tooltipValueGetter) ||
            _exists(this.colDef.tooltipComponent);
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
        if (_missing(this.colDef) || _missing(this.colDef.showRowGroup)) {
            return false;
        }

        const showingAllGroups = this.colDef.showRowGroup === true;
        const showingThisGroup = this.colDef.showRowGroup === colId;

        return showingAllGroups || showingThisGroup;
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
            this.columnEventService
        );
        const listener = this.frameworkEventListenerService?.wrap(userListener) ?? userListener;

        this.columnEventService.addEventListener(eventType, listener);
    }

    public override removeEventListener<T extends ColumnEventName>(
        eventType: T,
        userListener: (params: ColumnEvent<T>) => void
    ): void {
        const listener = this.frameworkEventListenerService?.unwrap(userListener) ?? userListener;
        this.columnEventService.removeEventListener(eventType, listener);
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
        // if boolean set, then just use it
        if (typeof this.colDef.suppressNavigable === 'boolean') {
            return this.colDef.suppressNavigable;
        }

        // if function, then call the function to find out
        if (typeof this.colDef.suppressNavigable === 'function') {
            const params = this.createColumnFunctionCallbackParams(rowNode);
            const userFunc = this.colDef.suppressNavigable;
            return userFunc(params);
        }

        return false;
    }

    public isCellEditable(rowNode: IRowNode): boolean {
        if (rowNode.group) {
            // This is a group - it could be a tree group or a grouping group...
            if (this.gos.get('treeData')) {
                // tree - allow editing of groups with data by default.
                // Allow editing filler nodes (node without data) only if enableGroupEdit is true.
                if (!rowNode.data && !this.gos.get('enableGroupEdit')) {
                    return false;
                }
            } else {
                // grouping - allow editing of groups if the user has enableGroupEdit option enabled
                if (!this.gos.get('enableGroupEdit')) {
                    return false;
                }
            }
        }

        return this.isColumnFunc(rowNode, this.colDef.editable);
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
        const so = this.gos.get('rowSelection');

        if (so && typeof so !== 'string') {
            const checkbox = isColumnSelectionCol(this) && _getCheckboxes(so);
            return this.isColumnFunc(rowNode, checkbox);
        } else {
            return this.isColumnFunc(rowNode, this.colDef.checkboxSelection);
        }
    }

    public isSuppressPaste(rowNode: IRowNode): boolean {
        return this.isColumnFunc(rowNode, this.colDef ? this.colDef.suppressPaste : null);
    }

    public isResizable(): boolean {
        return !!this.getColDefValue('resizable');
    }

    /** Get value from ColDef or default if it exists. */
    private getColDefValue<K extends keyof ColDef>(key: K): ColDef[K] {
        return this.colDef[key] ?? COL_DEF_DEFAULTS[key];
    }

    private isColumnFunc(
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

    public setHighlighted(highlighted: ColumnHighlightPosition | null): void {
        if (this.highlighted === highlighted) {
            return;
        }

        this.highlighted = highlighted;
        this.columnEventService.dispatchEvent(this.createColumnEvent('headerHighlightChanged', 'uiColumnMoved'));
    }

    public setMoving(moving: boolean, source: ColumnEventType): void {
        this.moving = moving;
        this.columnEventService.dispatchEvent(this.createColumnEvent('movingChanged', source));
    }

    private createColumnEvent<T extends ColumnEventName>(type: T, source: ColumnEventType): ColumnEvent<T> {
        return this.gos.addGridCommonParams({
            type: type,
            column: this,
            columns: [this],
            source: source,
        });
    }

    public isMoving(): boolean {
        return this.moving;
    }

    public getSort(): SortDirection | undefined {
        return this.sort;
    }

    public setSort(sort: SortDirection | undefined, source: ColumnEventType): void {
        if (this.sort !== sort) {
            this.sort = sort;
            this.columnEventService.dispatchEvent(this.createColumnEvent('sortChanged', source));
        }
        this.dispatchStateUpdatedEvent('sort');
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

    public setSortIndex(sortOrder?: number | null): void {
        this.sortIndex = sortOrder;
        this.dispatchStateUpdatedEvent('sortIndex');
    }
    public setMenuVisible(visible: boolean, source: ColumnEventType): void {
        if (this.menuVisible !== visible) {
            this.menuVisible = visible;
            this.columnEventService.dispatchEvent(this.createColumnEvent('menuVisibleChanged', source));
        }
    }

    public isMenuVisible(): boolean {
        return this.menuVisible;
    }

    public setAggFunc(aggFunc: string | IAggFunc | null | undefined): void {
        this.aggFunc = aggFunc;
        this.dispatchStateUpdatedEvent('aggFunc');
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
            this.columnEventService.dispatchEvent(this.createColumnEvent('leftChanged', source));
        }
    }

    public isFilterActive(): boolean {
        return this.filterActive;
    }

    // additionalEventAttributes is used by provided simple floating filter, so it can add 'floatingFilter=true' to the event
    public setFilterActive(active: boolean, source: ColumnEventType, additionalEventAttributes?: any): void {
        if (this.filterActive !== active) {
            this.filterActive = active;
            this.columnEventService.dispatchEvent(this.createColumnEvent('filterActiveChanged', source));
        }
        const filterChangedEvent = this.createColumnEvent('filterChanged', source);
        if (additionalEventAttributes) {
            _mergeDeep(filterChangedEvent, additionalEventAttributes);
        }
        this.columnEventService.dispatchEvent(filterChangedEvent);
    }

    public isHovered(): boolean {
        return !!this.beans.colHover?.isHovered(this);
    }

    public setPinned(pinned: ColumnPinnedType): void {
        if (pinned === true || pinned === 'left') {
            this.pinned = 'left';
        } else if (pinned === 'right') {
            this.pinned = 'right';
        } else {
            this.pinned = null;
        }
        this.dispatchStateUpdatedEvent('pinned');
    }

    public setFirstRightPinned(firstRightPinned: boolean, source: ColumnEventType): void {
        if (this.firstRightPinned !== firstRightPinned) {
            this.firstRightPinned = firstRightPinned;
            this.columnEventService.dispatchEvent(this.createColumnEvent('firstRightPinnedChanged', source));
        }
    }

    public setLastLeftPinned(lastLeftPinned: boolean, source: ColumnEventType): void {
        if (this.lastLeftPinned !== lastLeftPinned) {
            this.lastLeftPinned = lastLeftPinned;
            this.columnEventService.dispatchEvent(this.createColumnEvent('lastLeftPinnedChanged', source));
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
            this.columnEventService.dispatchEvent(this.createColumnEvent('visibleChanged', source));
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
        return this.colId;
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
        this.columnEventService.dispatchEvent(this.createColumnEvent('widthChanged', source));
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

    // this method should only be used by the colModel to
    // change flex when required by the applyColumnState method.
    public setFlex(flex: number | null) {
        this.flex = flex ?? null;
        this.dispatchStateUpdatedEvent('flex');
    }

    public setMinimum(source: ColumnEventType): void {
        this.setActualWidth(this.minWidth, source);
    }

    public setRowGroupActive(rowGroup: boolean, source: ColumnEventType): void {
        if (this.rowGroupActive !== rowGroup) {
            this.rowGroupActive = rowGroup;
            this.columnEventService.dispatchEvent(this.createColumnEvent('columnRowGroupChanged', source));
        }
        this.dispatchStateUpdatedEvent('rowGroup');
    }

    public isRowGroupActive(): boolean {
        return this.rowGroupActive;
    }

    public setPivotActive(pivot: boolean, source: ColumnEventType): void {
        if (this.pivotActive !== pivot) {
            this.pivotActive = pivot;
            this.columnEventService.dispatchEvent(this.createColumnEvent('columnPivotChanged', source));
        }
        this.dispatchStateUpdatedEvent('pivot');
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

    public setValueActive(value: boolean, source: ColumnEventType): void {
        if (this.aggregationActive !== value) {
            this.aggregationActive = value;
            this.columnEventService.dispatchEvent(this.createColumnEvent('columnValueChanged', source));
        }
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

    private dispatchStateUpdatedEvent(key: keyof ColumnState): void {
        this.columnEventService.dispatchEvent({
            type: 'columnStateUpdated',
            key,
        } as AgEvent<'columnStateUpdated'>);
    }
}
