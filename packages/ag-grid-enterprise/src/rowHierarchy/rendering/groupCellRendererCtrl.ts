import type {
    AgColumn,
    BeanCollection,
    CheckboxSelectionComponent,
    Column,
    ColumnModel,
    CtrlsService,
    ExpressionService,
    GroupCellRendererParams,
    IColsService,
    IGroupCellRenderer,
    IGroupCellRendererCtrl,
    IGroupHideOpenParentsService,
    IRowNode,
    ISelectionService,
    RowDragService,
    RowNode,
    UserCompDetails,
    UserComponentFactory,
    ValueService,
    VisibleColsService,
} from 'ag-grid-community';
import {
    BeanStub,
    KeyCode,
    _createIconNoSpan,
    _getCellRendererDetails,
    _getCheckboxLocation,
    _getCheckboxes,
    _getInnerCellRendererDetails,
    _isElementInEventPath,
    _isRowSelection,
    _isStopPropagationForAgGrid,
    _removeAriaExpanded,
    _setAriaExpanded,
    _stopPropagationForAgGrid,
    _warn,
} from 'ag-grid-community';

export class GroupCellRendererCtrl extends BeanStub implements IGroupCellRendererCtrl {
    private expressionSvc?: ExpressionService;
    private valueSvc: ValueService;
    private colModel: ColumnModel;
    private visibleCols: VisibleColsService;
    private userCompFactory: UserComponentFactory;
    private ctrlsSvc: CtrlsService;
    private rowGroupColsSvc?: IColsService;
    private rowDragSvc?: RowDragService;
    private selectionSvc?: ISelectionService;
    private groupHideOpenParentsSvc?: IGroupHideOpenParentsService;

    public wireBeans(beans: BeanCollection): void {
        this.expressionSvc = beans.expressionSvc;
        this.valueSvc = beans.valueSvc;
        this.colModel = beans.colModel;
        this.visibleCols = beans.visibleCols;
        this.userCompFactory = beans.userCompFactory;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.rowGroupColsSvc = beans.rowGroupColsSvc;
        this.selectionSvc = beans.selectionSvc;
        this.groupHideOpenParentsSvc = beans.groupHideOpenParentsSvc;
    }

    private params: GroupCellRendererParams;

    // will be true if the node was pulled down
    private showingValueForOpenedParent: boolean;

    // this is normally the rowNode of this row, however when doing hideOpenParents, it will
    // be the parent who's details we are actually showing if the data was pulled down.
    private displayedGroupNode: RowNode;

    private eGui: HTMLElement;
    private eExpanded: HTMLElement;
    private eContracted: HTMLElement;
    private eCheckbox: HTMLElement;
    private expandListener: (() => null) | null;

    // keep reference to this, so we can remove again when indent changes
    private indentClass: string;

    private comp: IGroupCellRenderer;
    private compClass: any;
    private cbComp?: CheckboxSelectionComponent;

    private isHidingOpenParent = false;
    private isShowingOpenedGroupValue = false;

    public init(
        comp: IGroupCellRenderer,
        eGui: HTMLElement,
        eCheckbox: HTMLElement,
        eExpanded: HTMLElement,
        eContracted: HTMLElement,
        compClass: any,
        params: GroupCellRendererParams
    ): void {
        this.params = params;
        this.eGui = eGui;
        this.eCheckbox = eCheckbox;
        this.eExpanded = eExpanded;
        this.eContracted = eContracted;
        this.comp = comp;
        this.compClass = compClass;

        const { node, column } = params;

        // check full width row pinned left/right cell should be skipped
        const embeddedRowMismatch = this.isEmbeddedRowMismatch();
        if (embeddedRowMismatch) {
            return;
        }

        if (node.footer) {
            this.initFooterCell();
            return;
        }

        // if no column, this is a full width cell
        if (!column) {
            this.initFullWidthCell();
            return;
        }

        // also sets up whether hiding open parent or showing opened group values.
        this.displayedGroupNode = this.getDisplayedNode(node, column) as RowNode;
        if (!this.displayedGroupNode) {
            this.displayedGroupNode = node as RowNode;
        }

        const isNodeForThisCol = node.rowGroupColumn && column.isRowGroupDisplayed(node.rowGroupColumn.getId());
        const isShowingControls = isNodeForThisCol || this.isHidingOpenParent;
        if (isShowingControls) {
            this.addExpandAndContract((this.displayedGroupNode ?? node) as RowNode);
            this.addChildCount((this.displayedGroupNode ?? node) as RowNode);
        }

        this.setupCheckbox();
        this.addGroupValue((this.displayedGroupNode ?? node) as RowNode);
        this.setupIndent();
        this.refreshAriaExpanded();
    }

    private initFooterCell(): void {
        const { node, column } = this.params;
        const isGrandTotal = node.level === -1;
        // is this nodes group column displaying here
        const isThisCol = node.rowGroupColumn && column && column.isRowGroupDisplayed(node.rowGroupColumn.getId());
        if (!isThisCol && !isGrandTotal) {
            // if this isn't the column we are showing the group for, then we don't show anything
            return;
        }
        this.displayedGroupNode = node as RowNode; // temp
        this.setupCheckbox();
        this.addFooterValue();
        // not grand total row
        if (node.level !== -1) {
            this.setupIndent();
        }
    }

    private initFullWidthCell(): void {
        const setupDragger = () => {
            if (!this.params.rowDrag || !this.rowDragSvc) {
                return;
            }

            const rowDragComp = this.rowDragSvc.createRowDragComp(() => this.params.value, this.params.node as RowNode);
            this.createManagedBean(rowDragComp);

            this.eGui.insertAdjacentElement('afterbegin', rowDragComp.getGui());
        };

        const { node } = this.params;
        this.displayedGroupNode = node as RowNode;
        this.addExpandAndContract(node as RowNode);
        this.addChildCount(node as RowNode);
        setupDragger();
        this.setupCheckbox();
        this.addGroupValue(node);
        this.setupIndent();
        this.refreshAriaExpanded();
    }

    private getDisplayedNode(node: IRowNode, column?: Column): RowNode | null {
        // get the opened group values for this column for groupHideOpenParents & showOpenedGroup
        this.isHidingOpenParent = this.gos.get('groupHideOpenParents') && node.firstChild;
        this.isShowingOpenedGroupValue = false;

        // don't traverse tree if neither starts enabled
        if (!this.isHidingOpenParent && !this.isShowingOpenedGroupValue) {
            return null;
        }

        // if cell is a full width row
        if (!column) {
            return null;
        }

        const columnGroupData = (column as AgColumn).getGroupData();
        // if no group data, column is not group col
        if (!columnGroupData) {
            return null;
        }

        let pointer: RowNode | null = node as RowNode;
        while (pointer && pointer.rowGroupColumn != columnGroupData.groupedColumn) {
            if (!pointer.firstChild) {
                this.isHidingOpenParent = false;
                if (!this.isShowingOpenedGroupValue) {
                    // if not first child and not showOpenedGroup then groupHideOpenParents doesn't
                    // display the parent value
                    return null;
                }
            }
            pointer = pointer.parent;
        }

        return pointer;
    }

    public getCellAriaRole(): string {
        const colDefAriaRole = this.params.colDef?.cellAriaRole;
        const columnColDefAriaRole = this.params.column?.getColDef().cellAriaRole;
        return colDefAriaRole || columnColDefAriaRole || 'gridcell';
    }

    public override destroy(): void {
        super.destroy();
        // property cleanup to avoid memory leaks
        this.expandListener = null;
        this.destroyCheckbox();
    }

    private refreshAriaExpanded(): void {
        const { node, eGridCell } = this.params;

        if (this.expandListener) {
            this.expandListener = this.expandListener();
        }

        if (!this.isExpandable()) {
            _removeAriaExpanded(eGridCell);
            return;
        }

        const listener = () => {
            // for react, we don't use JSX, as setting attributes via jsx is slower
            _setAriaExpanded(eGridCell, this.showingValueForOpenedParent || !!node.expanded);
        };

        [this.expandListener] = this.addManagedListeners(node, { expandedChanged: listener }) || null;
        listener();
    }

    // if we are doing embedded full width rows, we only show the renderer when
    // in the body, or if pinning in the pinned section, or if pinning and RTL,
    // in the right section. otherwise we would have the cell repeated in each section.
    private isEmbeddedRowMismatch(): boolean {
        if (!this.params.fullWidth || !this.gos.get('embedFullWidthRows')) {
            return false;
        }

        const pinnedLeftCell = this.params.pinned === 'left';
        const pinnedRightCell = this.params.pinned === 'right';
        const bodyCell = !pinnedLeftCell && !pinnedRightCell;

        if (this.gos.get('enableRtl')) {
            if (this.visibleCols.isPinningLeft()) {
                return !pinnedRightCell;
            }
            return !bodyCell;
        }

        if (this.visibleCols.isPinningLeft()) {
            return !pinnedLeftCell;
        }

        return !bodyCell;
    }

    private addGroupValue(node: IRowNode): void {
        // we try and use the cellRenderer of the column used for the grouping if we can
        const paramsAdjusted = this.adjustParamsWithDetailsFromRelatedColumn(node);
        const { valueFormatted, value } = paramsAdjusted;

        let valueWhenNoRenderer = valueFormatted;
        if (valueWhenNoRenderer == null) {
            const isGroupColForNode =
                node.rowGroupColumn && this.params.column?.isRowGroupDisplayed(node.rowGroupColumn.getId());

            if (node.key === '' && node.group && isGroupColForNode) {
                const localeTextFunc = this.getLocaleTextFunc();
                valueWhenNoRenderer = localeTextFunc('blanks', '(Blanks)');
            } else {
                valueWhenNoRenderer = value ?? null;
            }
        }

        const innerCompDetails = this.getInnerCompDetails(node, paramsAdjusted);
        this.comp.setInnerRenderer(innerCompDetails, valueWhenNoRenderer);
    }

    private adjustParamsWithDetailsFromRelatedColumn(node: IRowNode): GroupCellRendererParams {
        const relatedColumn = node.rowGroupColumn as AgColumn;
        const { column } = this.params;

        if (!relatedColumn) {
            return this.params;
        }

        const fullWidthRow = column == null;
        if (!fullWidthRow) {
            const showingThisRowGroup = column!.isRowGroupDisplayed(relatedColumn.getId());
            if (!showingThisRowGroup) {
                return this.params;
            }
        }

        const params = this.params;

        const valueFormatted = this.valueSvc.formatValue(relatedColumn, node, params.value);

        // we don't update the original params, as they could of come through React,
        // as react has RowGroupCellRenderer, which means the params could be props which
        // would be read only
        return {
            ...params,
            valueFormatted,
        };
    }

    private addFooterValue(): void {
        const totalValueGetter = this.params.totalValueGetter;
        let footerValue = '';

        if (totalValueGetter) {
            // params is same as we were given, except we set the value as the item to display
            const paramsClone = {
                ...this.params,
                value: this.params.value,
            };

            if (typeof totalValueGetter === 'function') {
                footerValue = totalValueGetter(paramsClone);
            } else if (typeof totalValueGetter === 'string') {
                footerValue = this.expressionSvc ? this.expressionSvc.evaluate(totalValueGetter, paramsClone) : '';
            } else {
                _warn(179);
            }
        } else {
            const localeTextFunc = this.getLocaleTextFunc();
            const footerTotalPrefix = localeTextFunc('footerTotal', 'Total');
            footerValue = footerTotalPrefix + ' ' + (this.params.value != null ? this.params.value : '');
        }

        const innerCompDetails = this.getInnerCompDetails(this.params.node, this.params);

        this.comp.setInnerRenderer(innerCompDetails, footerValue);
    }

    private getInnerCompDetails(node: IRowNode, params: GroupCellRendererParams): UserCompDetails | undefined {
        // for full width rows, we don't do any of the below
        if (params.fullWidth) {
            return _getInnerCellRendererDetails(this.userCompFactory, this.gos.get('groupRowRendererParams'), params);
        }

        // when grouping, the normal case is we use the cell renderer of the grouped column. eg if grouping by country
        // and then rating, we will use the country cell renderer for each country group row and likewise the rating
        // cell renderer for each rating group row.
        //
        // however if the user has innerCellRenderer defined, this gets preference and we don't use cell renderers
        // of the grouped columns.
        //
        // so we check and use in the following order:
        //
        // 1) thisColDef.cellRendererParams.innerRenderer of the column showing the groups (eg auto group column)
        // 2) groupedColDef.cellRenderer of the grouped column
        // 3) groupedColDef.cellRendererParams.innerRenderer

        // we check if cell renderer provided for the group cell renderer, eg colDef.cellRendererParams.innerRenderer
        const innerCompDetails = _getInnerCellRendererDetails<GroupCellRendererParams>(
            this.userCompFactory,
            params,
            params
        );

        // avoid using GroupCellRenderer again, otherwise stack overflow, as we insert same renderer again and again.
        // this covers off chance user is grouping by a column that is also configured with GroupCellRenderer
        const isGroupRowRenderer = (details: UserCompDetails | undefined) =>
            details && details.componentClass == this.compClass;

        if (innerCompDetails && !isGroupRowRenderer(innerCompDetails)) {
            // use the renderer defined in cellRendererParams.innerRenderer
            return innerCompDetails;
        }

        const relatedColumn = node.rowGroupColumn;
        const relatedColDef = relatedColumn?.getColDef();

        if (!relatedColDef) {
            return;
        }

        // otherwise see if we can use the cellRenderer of the column we are grouping by
        const relatedCompDetails = _getCellRendererDetails(this.userCompFactory, relatedColDef, params);

        if (relatedCompDetails && !isGroupRowRenderer(relatedCompDetails)) {
            // Only if the original column is using a specific renderer, it it is a using a DEFAULT one ignore it
            return relatedCompDetails;
        }

        if (
            isGroupRowRenderer(relatedCompDetails) &&
            relatedColDef.cellRendererParams &&
            relatedColDef.cellRendererParams.innerRenderer
        ) {
            // edge case - this comes from a column which has been grouped dynamically, that has a renderer 'group'
            // and has an inner cell renderer
            return _getInnerCellRendererDetails<GroupCellRendererParams>(
                this.userCompFactory,
                relatedColDef.cellRendererParams,
                params
            );
        }
    }

    private addChildCount(node: RowNode): void {
        // only include the child count if it's included, eg if user doing custom aggregation,
        // then this could be left out, or set to -1, ie no child count
        if (this.params.suppressCount) {
            return;
        }

        const updateChildCount = () => {
            const { allChildrenCount } = node;
            const showCount = allChildrenCount != null && allChildrenCount >= 0;
            const countString = showCount ? `(${allChildrenCount})` : ``;
            this.comp.setChildCount(countString);
        };

        this.addManagedListeners(node, {
            // filtering changes the child count, so need to cater for it
            allChildrenCountChanged: updateChildCount,
        });

        updateChildCount();
    }

    private isShowRowGroupForThisRow(): boolean {
        if (this.gos.get('treeData')) {
            return true;
        }

        const rowGroupColumn = this.displayedGroupNode.rowGroupColumn;

        if (!rowGroupColumn) {
            return false;
        }

        // column is null for fullWidthRows
        const column = this.params.column;
        const thisColumnIsInterested = column == null || column.isRowGroupDisplayed(rowGroupColumn.getId());

        return thisColumnIsInterested;
    }

    private addExpandAndContract(node: RowNode): void {
        // Inserts the expand/collapse icons into the dom
        const setupIcon = (iconName: 'groupExpanded' | 'groupContracted', element: HTMLElement) => {
            const icon = _createIconNoSpan(iconName, this.beans, null);
            if (icon) {
                element.appendChild(icon);
                this.addDestroyFunc(() => element.removeChild(icon));
            }
        };

        setupIcon('groupExpanded', this.eExpanded);
        setupIcon('groupContracted', this.eContracted);

        //
        const setIconVisibility = () => {
            const isExpandable = this.isExpandable();

            if (isExpandable) {
                // if expandable, show one based on expand state.
                // if we were dragged down, means our parent is always expanded
                const expanded = node.expanded;
                this.comp.setExpandedDisplayed(expanded);
                this.comp.setContractedDisplayed(!expanded);
            } else {
                // it not expandable, show neither
                this.comp.setExpandedDisplayed(false);
                this.comp.setContractedDisplayed(false);
            }

            // compensation padding for leaf nodes, so there is blank space instead of the expand icon
            const pivotMode = this.colModel.isPivotMode();
            const pivotModeAndLeafGroup = pivotMode && node.leafGroup;
            const addExpandableCss = isExpandable && !pivotModeAndLeafGroup;
            const isTotalFooterNode = node.footer && node.level === -1;

            this.comp.addOrRemoveCssClass('ag-cell-expandable', addExpandableCss);
            this.comp.addOrRemoveCssClass('ag-row-group', addExpandableCss);

            if (pivotMode) {
                this.comp.addOrRemoveCssClass('ag-pivot-leaf-group', !!pivotModeAndLeafGroup);
            } else if (!isTotalFooterNode) {
                this.comp.addOrRemoveCssClass('ag-row-group-leaf-indent', !addExpandableCss);
            }
        };

        const { eGridCell, column, suppressDoubleClickExpand } = this.params;

        // if editing groups, then double click is to start editing
        const isDoubleClickEdit = column?.isCellEditable(node) && this.gos.get('enableGroupEdit');
        if (!isDoubleClickEdit && this.isExpandable() && !suppressDoubleClickExpand) {
            this.addManagedListeners(eGridCell, { dblclick: this.onCellDblClicked.bind(this) });
        }

        this.addManagedListeners(this.eExpanded, { click: this.onExpandClicked.bind(this) });
        this.addManagedListeners(this.eContracted, { click: this.onExpandClicked.bind(this) });

        // expand / contract as the user hits enter
        this.addManagedListeners(eGridCell, { keydown: this.onKeyDown.bind(this) });
        this.addManagedListeners(node, { expandedChanged: setIconVisibility });

        setIconVisibility();

        // because we don't show the expand / contract when there are no children, we need to check every time
        // the number of children change.
        const expandableChangedListener = () => {
            // maybe if no children now, we should hide the expand / contract icons
            setIconVisibility();
            // if we have no children, this impacts the indent
            this.setIndent();
            this.refreshAriaExpanded();
        };

        this.addManagedListeners(node, {
            allChildrenCountChanged: expandableChangedListener,
            masterChanged: expandableChangedListener,
            groupChanged: expandableChangedListener,
            hasChildrenChanged: expandableChangedListener,
        });
    }

    private onExpandClicked(mouseEvent: MouseEvent): void {
        if (_isStopPropagationForAgGrid(mouseEvent)) {
            return;
        }

        // so if we expand a node, it does not also get selected.
        _stopPropagationForAgGrid(mouseEvent);

        this.onExpandOrContract(mouseEvent);
    }

    private onExpandOrContract(e: MouseEvent | KeyboardEvent): void {
        // must use the displayedGroup, so if data was dragged down, we expand the parent, not this row
        const rowNode: RowNode = this.displayedGroupNode;
        const nextExpandState = !rowNode.expanded;

        if (!nextExpandState && rowNode.sticky) {
            this.scrollToStickyNode(rowNode);
        }

        rowNode.setExpanded(nextExpandState, e);
    }

    private scrollToStickyNode(rowNode: RowNode): void {
        this.ctrlsSvc.getScrollFeature().setVerticalScrollPosition(rowNode.rowTop! - rowNode.stickyRowTop);
    }

    private isExpandable(): boolean {
        if (this.showingValueForOpenedParent) {
            return true;
        }

        const rowNode = this.displayedGroupNode;
        const reducedLeafNode = this.colModel.isPivotMode() && rowNode.leafGroup;
        const expandableGroup = rowNode.isExpandable() && !rowNode.footer && !reducedLeafNode;

        if (!expandableGroup) {
            return false;
        }

        // column is null for fullWidthRows
        const column = this.params.column;
        const displayingForOneColumnOnly = column != null && typeof column.getColDef().showRowGroup === 'string';

        if (displayingForOneColumnOnly) {
            const showing = this.isShowRowGroupForThisRow();
            return showing;
        }

        return true;
    }

    private setupIndent(): void {
        // only do this if an indent - as this overwrites the padding that
        // the theme set, which will make things look 'not aligned' for the
        // first group level.
        const node: RowNode = this.params.node as RowNode;
        const suppressPadding = this.params.suppressPadding;

        if (!suppressPadding) {
            this.addManagedListeners(node, { uiLevelChanged: this.setIndent.bind(this) });
            this.setIndent();
        }
    }

    private setIndent(): void {
        if (this.gos.get('groupHideOpenParents')) {
            return;
        }

        const { node, colDef } = this.params;
        // if we are only showing one group column, we don't want to be indenting based on level
        const fullWidthRow = !!colDef;
        const treeData = this.gos.get('treeData');
        const manyDimensionThisColumn = !fullWidthRow || treeData || colDef!.showRowGroup === true;
        const paddingCount = manyDimensionThisColumn ? node.uiLevel : 0;

        // if indent has already been set, remove it.
        if (this.indentClass) {
            this.comp.addOrRemoveCssClass(this.indentClass, false);
        }

        this.indentClass = 'ag-row-group-indent-' + paddingCount;
        this.comp.addOrRemoveCssClass(this.indentClass, true);
        this.eGui.style.setProperty('--ag-indentation-level', String(paddingCount));
    }

    private setupCheckbox(): void {
        this.addManagedPropertyListener('rowSelection', ({ currentValue, previousValue }) => {
            const curr = typeof currentValue === 'object' ? currentValue : undefined;
            const prev = typeof previousValue === 'object' ? previousValue : undefined;

            if (curr?.checkboxLocation !== prev?.checkboxLocation) {
                this.destroyCheckbox();
                this.addCheckbox();
            }
        });
        this.addCheckbox();
    }

    private addCheckbox(): void {
        const node = this.params.node as RowNode;
        const rowSelection = this.gos.get('rowSelection');
        const checkboxLocation = _getCheckboxLocation(rowSelection);
        const checkboxes =
            typeof rowSelection === 'object'
                ? checkboxLocation === 'autoGroupColumn' && _getCheckboxes(rowSelection)
                : this.params.checkbox;
        const userWantsSelected = typeof checkboxes === 'function' || checkboxes === true;

        const checkboxNeeded =
            userWantsSelected &&
            // footers cannot be selected
            !node.footer &&
            // pinned rows cannot be selected
            !node.rowPinned &&
            // details cannot be selected
            !node.detail &&
            !!this.selectionSvc &&
            _isRowSelection(this.gos);

        if (checkboxNeeded) {
            const cbSelectionComponent = this.selectionSvc!.createCheckboxSelectionComponent();
            this.cbComp = cbSelectionComponent;
            this.createBean(cbSelectionComponent);

            cbSelectionComponent.init({
                rowNode: node, // when groupHideOpenParents = true and group expanded, we want the checkbox to refer to leaf node state (not group node state)
                column: this.params.column as AgColumn,
                overrides: {
                    isVisible: checkboxes,
                    callbackParams: this.params,
                    removeHidden: true,
                },
            });
            this.eCheckbox.appendChild(cbSelectionComponent.getGui());
        }

        this.comp.setCheckboxVisible(checkboxNeeded);
    }

    private destroyCheckbox(): void {
        this.cbComp && this.eCheckbox.removeChild(this.cbComp.getGui());
        this.cbComp = this.destroyBean(this.cbComp);
    }

    private onKeyDown(event: KeyboardEvent): void {
        const isEnterKey = event.key === KeyCode.ENTER;

        if (!isEnterKey || this.params.suppressEnterExpand) {
            return;
        }

        const cellEditable = this.params.column && this.params.column.isCellEditable(this.params.node);

        if (cellEditable) {
            return;
        }

        this.onExpandOrContract(event);
    }

    private onCellDblClicked(mouseEvent: MouseEvent): void {
        if (_isStopPropagationForAgGrid(mouseEvent)) {
            return;
        }

        // we want to avoid acting on double click events on the expand / contract icon,
        // as that icons already has expand / collapse functionality on it. otherwise if
        // the icon was double clicked, we would get 'click', 'click', 'dblclick' which
        // is open->close->open, however double click should be open->close only.
        const targetIsExpandIcon =
            _isElementInEventPath(this.eExpanded, mouseEvent) || _isElementInEventPath(this.eContracted, mouseEvent);

        if (!targetIsExpandIcon) {
            this.onExpandOrContract(mouseEvent);
        }
    }
}
