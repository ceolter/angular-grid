import type { GroupResizeFeature } from '../../../columnResize/groupResizeFeature';
import { setupCompBean } from '../../../components/emptyBean';
import { _getHeaderGroupCompDetails } from '../../../components/framework/userCompUtils';
import { KeyCode } from '../../../constants/keyCode';
import type { BeanStub } from '../../../context/beanStub';
import type { AgColumn } from '../../../entities/agColumn';
import type { AgColumnGroup } from '../../../entities/agColumnGroup';
import type { ColumnEventType } from '../../../events';
import { ColumnHighlightPosition } from '../../../interfaces/iColumn';
import type { UserCompDetails } from '../../../interfaces/iUserCompDetails';
import { SetLeftFeature } from '../../../rendering/features/setLeftFeature';
import type { TooltipFeature } from '../../../tooltip/tooltipFeature';
import { _last } from '../../../utils/array';
import { ManagedFocusFeature } from '../../../widgets/managedFocusFeature';
import type { IAbstractHeaderCellComp } from '../abstractCell/abstractHeaderCellCtrl';
import { AbstractHeaderCellCtrl } from '../abstractCell/abstractHeaderCellCtrl';
import { _getHeaderClassesFromColDef } from '../cssClassApplier';
import { GroupWidthFeature } from './groupWidthFeature';
import type { IHeaderGroupComp, IHeaderGroupParams } from './headerGroupComp';

export interface IHeaderGroupCellComp extends IAbstractHeaderCellComp {
    setResizableDisplayed(displayed: boolean): void;
    setWidth(width: string): void;
    setHeaderWrapperMaxHeight(value: number | null): void;
    setHeaderWrapperHidden(value: boolean): void;
    setAriaExpanded(expanded: 'true' | 'false' | undefined): void;
    setUserCompDetails(compDetails: UserCompDetails): void;
    getUserCompInstance(): IHeaderGroupComp | undefined;
}

export class HeaderGroupCellCtrl extends AbstractHeaderCellCtrl<
    IHeaderGroupCellComp,
    AgColumnGroup,
    GroupResizeFeature
> {
    private expandable: boolean;
    private displayName: string | null;
    private tooltipFeature: TooltipFeature | undefined;

    public setComp(
        comp: IHeaderGroupCellComp,
        eGui: HTMLElement,
        eResize: HTMLElement,
        eHeaderCompWrapper: HTMLElement,
        compBean: BeanStub<any> | undefined
    ): void {
        const { context, colNames, colHover, colResize } = this.beans;
        this.comp = comp;
        compBean = setupCompBean(this, context, compBean);
        this.setGui(eGui, compBean);

        this.displayName = colNames.getDisplayNameForColumnGroup(this.column, 'header');

        this.addClasses();
        this.setupMovingCss(compBean);
        this.setupExpandable(compBean);
        this.setupTooltip();

        this.setupAutoHeight({
            wrapperElement: eHeaderCompWrapper,
            compBean,
        });

        this.setupUserComp();
        this.addHeaderMouseListeners(compBean);

        this.addManagedPropertyListener('groupHeaderHeight', this.refreshMaxHeaderHeight.bind(this));
        this.refreshMaxHeaderHeight();

        const pinned = this.rowCtrl.pinned;
        const leafCols = this.column.getProvidedColumnGroup().getLeafColumns();

        colHover?.createHoverFeature(compBean, leafCols, eGui);
        compBean.createManagedBean(new SetLeftFeature(this.column, eGui, this.beans));
        compBean.createManagedBean(new GroupWidthFeature(comp, this.column));
        if (colResize) {
            this.resizeFeature = compBean.createManagedBean(
                colResize.createGroupResizeFeature(comp, eResize, pinned, this.column)
            );
        } else {
            comp.setResizableDisplayed(false);
        }

        compBean.createManagedBean(
            new ManagedFocusFeature(eGui, {
                shouldStopEventPropagation: this.shouldStopEventPropagation.bind(this),
                onTabKeyDown: () => undefined,
                handleKeyDown: this.handleKeyDown.bind(this),
                onFocusIn: this.onFocusIn.bind(this),
            })
        );

        this.addHighlightListeners(compBean, leafCols);

        compBean.addManagedPropertyListener('suppressMovableColumns', this.onSuppressColMoveChange);
        this.addResizeAndMoveKeyboardListeners(compBean);
        // Make sure this is the last destroy func as it clears the gui and comp
        compBean.addDestroyFunc(() => this.clearComponent());
    }

    private refreshMaxHeaderHeight(): void {
        const { gos, comp } = this;

        const groupHeaderHeight = gos.get('groupHeaderHeight');

        if (groupHeaderHeight != null) {
            if (groupHeaderHeight === 0) {
                comp.setHeaderWrapperHidden(true);
            } else {
                comp.setHeaderWrapperMaxHeight(groupHeaderHeight);
            }
        } else {
            comp.setHeaderWrapperHidden(false);
            comp.setHeaderWrapperMaxHeight(null);
        }
    }

    private addHighlightListeners(compBean: BeanStub, columns: AgColumn[]): void {
        if (!this.beans.gos.get('suppressMoveWhenColumnDragging')) {
            return;
        }

        for (const column of columns) {
            compBean.addManagedListeners(column, {
                headerHighlightChanged: this.onLeafColumnHighlightChanged.bind(this, column),
            });
        }
    }

    private onLeafColumnHighlightChanged(column: AgColumn): void {
        const displayedColumns = this.column.getDisplayedLeafColumns();
        const isFirst = displayedColumns[0] === column;
        const isLast = _last(displayedColumns) === column;

        if (!isFirst && !isLast) {
            return;
        }

        const highlighted = column.getHighlighted();
        const isColumnMoveAtThisLevel = !!this.rowCtrl.findHeaderCellCtrl((ctrl) => {
            return ctrl.column.isMoving();
        });

        let beforeOn = false;
        let afterOn = false;

        if (isColumnMoveAtThisLevel) {
            const isRtl = this.beans.gos.get('enableRtl');
            const isHighlightAfter = highlighted === ColumnHighlightPosition.After;
            const isHighlightBefore = highlighted === ColumnHighlightPosition.Before;

            if (isFirst) {
                if (isRtl) {
                    afterOn = isHighlightAfter;
                } else {
                    beforeOn = isHighlightBefore;
                }
            }

            if (isLast) {
                if (isRtl) {
                    beforeOn = isHighlightBefore;
                } else {
                    afterOn = isHighlightAfter;
                }
            }
        }

        this.comp.addOrRemoveCssClass('ag-header-highlight-before', beforeOn);
        this.comp.addOrRemoveCssClass('ag-header-highlight-after', afterOn);
    }

    protected resizeHeader(delta: number, shiftKey: boolean): void {
        const { resizeFeature } = this;
        // check to avoid throwing when a component has not been setup yet (React 18)
        if (!resizeFeature) {
            return;
        }

        const initialValues = resizeFeature.getInitialValues(shiftKey);

        resizeFeature.resizeColumns(initialValues, initialValues.resizeStartWidth + delta, 'uiColumnResized', true);
    }

    public resizeLeafColumnsToFit(source: ColumnEventType): void {
        // check to avoid throwing when a component has not been setup yet (React 18)
        this.resizeFeature?.resizeLeafColumnsToFit(source);
    }

    private setupUserComp(): void {
        const { colGroupSvc, userCompFactory, gos } = this.beans;
        const params: IHeaderGroupParams = gos.addGridCommonParams({
            displayName: this.displayName!,
            columnGroup: this.column,
            setExpanded: (expanded: boolean) => {
                colGroupSvc!.setColumnGroupOpened(this.column.getProvidedColumnGroup(), expanded, 'gridInitializing');
            },
            setTooltip: (value: string, shouldDisplayTooltip: () => boolean) => {
                this.setupTooltip(value, shouldDisplayTooltip);
            },
        });

        const compDetails = _getHeaderGroupCompDetails(userCompFactory, params)!;
        this.comp.setUserCompDetails(compDetails);
    }

    private addHeaderMouseListeners(compBean: BeanStub): void {
        const listener = (e: MouseEvent) => this.handleMouseOverChange(e.type === 'mouseenter');
        const clickListener = () =>
            this.dispatchColumnMouseEvent('columnHeaderClicked', this.column.getProvidedColumnGroup());
        const contextMenuListener = (event: MouseEvent) =>
            this.handleContextMenuMouseEvent(event, undefined, this.column.getProvidedColumnGroup());

        compBean.addManagedListeners(this.eGui, {
            mouseenter: listener,
            mouseleave: listener,
            click: clickListener,
            contextmenu: contextMenuListener,
        });
    }

    private handleMouseOverChange(isMouseOver: boolean): void {
        this.eventSvc.dispatchEvent({
            type: isMouseOver ? 'columnHeaderMouseOver' : 'columnHeaderMouseLeave',
            column: this.column.getProvidedColumnGroup(),
        });
    }

    private setupTooltip(value?: string, shouldDisplayTooltip?: () => boolean): void {
        this.tooltipFeature = this.beans.tooltipSvc?.setupHeaderGroupTooltip(
            this.tooltipFeature,
            this,
            value,
            shouldDisplayTooltip
        );
    }

    private setupExpandable(compBean: BeanStub): void {
        const providedColGroup = this.column.getProvidedColumnGroup();

        this.refreshExpanded();

        const listener = this.refreshExpanded.bind(this);
        compBean.addManagedListeners(providedColGroup, {
            expandedChanged: listener,
            expandableChanged: listener,
        });
    }

    private refreshExpanded(): void {
        const { column } = this;
        this.expandable = column.isExpandable();
        const expanded = column.isExpanded();

        if (this.expandable) {
            this.comp.setAriaExpanded(expanded ? 'true' : 'false');
        } else {
            this.comp.setAriaExpanded(undefined);
        }
    }

    private addClasses(): void {
        const colGroupDef = this.column.getColGroupDef();
        const classes = _getHeaderClassesFromColDef(colGroupDef, this.gos, null, this.column);

        // having different classes below allows the style to not have a bottom border
        // on the group header, if no group is specified
        if (this.column.isPadding()) {
            classes.push('ag-header-group-cell-no-group');
            const leafCols = this.column.getLeafColumns();
            if (leafCols.every((col) => col.isSpanHeaderHeight())) {
                classes.push('ag-header-span-height');
            }
        } else {
            classes.push('ag-header-group-cell-with-group');
            if (colGroupDef?.wrapHeaderText) {
                classes.push('ag-header-cell-wrap-text');
            }
        }

        classes.forEach((c) => this.comp.addOrRemoveCssClass(c, true));
    }

    private setupMovingCss(compBean: BeanStub): void {
        const providedColumnGroup = this.column.getProvidedColumnGroup();
        const leafColumns = providedColumnGroup.getLeafColumns();

        // function adds or removes the moving css, based on if the col is moving.
        // this is what makes the header go dark when it is been moved (gives impression to
        // user that the column was picked up).
        const listener = () => this.comp.addOrRemoveCssClass('ag-header-cell-moving', this.column.isMoving());

        leafColumns.forEach((col) => {
            compBean.addManagedListeners(col, { movingChanged: listener });
        });

        listener();
    }

    private onSuppressColMoveChange = () => {
        if (!this.isAlive() || this.isSuppressMoving()) {
            this.removeDragSource();
        } else {
            if (!this.dragSource) {
                this.setDragSource(this.eGui);
            }
        }
    };

    private onFocusIn(e: FocusEvent) {
        if (!this.eGui.contains(e.relatedTarget as HTMLElement)) {
            this.focusThis();
        }
    }

    protected override handleKeyDown(e: KeyboardEvent): void {
        super.handleKeyDown(e);

        const wrapperHasFocus = this.getWrapperHasFocus();

        if (!this.expandable || !wrapperHasFocus) {
            return;
        }

        if (e.key === KeyCode.ENTER) {
            const column = this.column;
            const newExpandedValue = !column.isExpanded();

            this.beans.colGroupSvc!.setColumnGroupOpened(
                column.getProvidedColumnGroup(),
                newExpandedValue,
                'uiColumnExpanded'
            );
        }
    }

    // unlike columns, this will only get called once, as we don't react on props on column groups
    // (we will always destroy and recreate this comp if something changes)
    public setDragSource(eHeaderGroup: HTMLElement): void {
        if (!this.isAlive() || this.isSuppressMoving()) {
            return;
        }

        this.removeDragSource();

        if (!eHeaderGroup) {
            return;
        }

        this.dragSource =
            this.beans.colMoves?.setDragSourceForHeader(eHeaderGroup, this.column, this.displayName) ?? null;
    }

    private isSuppressMoving(): boolean {
        // if any child is fixed, then don't allow moving
        return (
            this.gos.get('suppressMovableColumns') ||
            this.column
                .getLeafColumns()
                .some((column) => column.getColDef().suppressMovable || column.getColDef().lockPosition)
        );
    }

    public override destroy(): void {
        this.tooltipFeature = this.destroyBean(this.tooltipFeature);
        super.destroy();
    }
}
