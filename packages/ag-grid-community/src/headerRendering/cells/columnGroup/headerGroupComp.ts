import type { ColumnGroupService } from '../../../columns/columnGroups/columnGroupService';
import type { BeanCollection } from '../../../context/context';
import type { AgColumnGroup } from '../../../entities/agColumnGroup';
import type { ColumnGroup } from '../../../interfaces/iColumn';
import type { AgGridCommon } from '../../../interfaces/iCommon';
import type { IComponent } from '../../../interfaces/iComponent';
import { _setDisplayed } from '../../../utils/dom';
import { _isStopPropagationForAgGrid, _stopPropagationForAgGrid } from '../../../utils/event';
import { _exists } from '../../../utils/generic';
import type { IconName } from '../../../utils/icon';
import { _createIconNoSpan } from '../../../utils/icon';
import { _escapeString } from '../../../utils/string';
import { _warn } from '../../../validation/logging';
import { Component, RefPlaceholder } from '../../../widgets/component';

export interface IHeaderGroupParams<TData = any, TContext = any> extends AgGridCommon<TData, TContext> {
    /** The column group the header is for. */
    columnGroup: ColumnGroup;
    /**
     * The text label to render.
     * If the column is using a headerValueGetter, the displayName will take this into account.
     */
    displayName: string;
    /** Opens / closes the column group */
    setExpanded: (expanded: boolean) => void;
    /**
     * Sets a tooltip to the main element of this component.
     * @param value The value to be displayed by the tooltip
     * @param shouldDisplayTooltip A function returning a boolean that allows the tooltip to be displayed conditionally. This option does not work when `enableBrowserTooltips={true}`.
     */
    setTooltip: (value: string, shouldDisplayTooltip?: () => boolean) => void;
}

export interface IHeaderGroup {}

export interface IHeaderGroupComp extends IHeaderGroup, IComponent<IHeaderGroupParams> {}

export class HeaderGroupComp extends Component implements IHeaderGroupComp {
    private colGroupSvc: ColumnGroupService;

    public wireBeans(beans: BeanCollection) {
        this.colGroupSvc = beans.colGroupSvc!;
    }

    private params: IHeaderGroupParams;

    private readonly agOpened: HTMLElement = RefPlaceholder;
    private readonly agClosed: HTMLElement = RefPlaceholder;
    private readonly agLabel: HTMLElement = RefPlaceholder;

    constructor() {
        super(/* html */ `<div class="ag-header-group-cell-label" role="presentation">
            <span data-ref="agLabel" class="ag-header-group-text" role="presentation"></span>
            <span data-ref="agOpened" class="ag-header-icon ag-header-expand-icon ag-header-expand-icon-expanded"></span>
            <span data-ref="agClosed" class="ag-header-icon ag-header-expand-icon ag-header-expand-icon-collapsed"></span>
        </div>`);
    }

    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so we need to override destroy() just to make the method public.
    public override destroy(): void {
        super.destroy();
    }

    public init(params: IHeaderGroupParams): void {
        this.params = params;

        this.checkWarnings();

        this.setupLabel();
        this.addGroupExpandIcon();
        this.setupExpandIcons();
    }

    private checkWarnings(): void {
        const paramsAny = this.params as any;

        if (paramsAny.template) {
            _warn(89);
        }
    }

    private setupExpandIcons(): void {
        this.addInIcon('columnGroupOpened', this.agOpened);
        this.addInIcon('columnGroupClosed', this.agClosed);

        const expandAction = (event: MouseEvent) => {
            if (_isStopPropagationForAgGrid(event)) {
                return;
            }

            const newExpandedValue = !this.params.columnGroup.isExpanded();
            this.colGroupSvc.setColumnGroupOpened(
                (this.params.columnGroup as AgColumnGroup).getProvidedColumnGroup(),
                newExpandedValue,
                'uiColumnExpanded'
            );
        };

        this.addTouchAndClickListeners(this.agClosed, expandAction);
        this.addTouchAndClickListeners(this.agOpened, expandAction);

        const stopPropagationAction = (event: MouseEvent) => {
            _stopPropagationForAgGrid(event);
        };

        // adding stopPropagation to the double click for the icons prevents double click action happening
        // when the icons are clicked. if the icons are double clicked, then the groups should open and
        // then close again straight away. if we also listened to double click, then the group would open,
        // close, then open, which is not what we want. double click should only action if the user double
        // clicks outside of the icons.
        this.addManagedElementListeners(this.agClosed, { dblclick: stopPropagationAction });
        this.addManagedElementListeners(this.agOpened, { dblclick: stopPropagationAction });

        this.addManagedElementListeners(this.getGui(), { dblclick: expandAction });

        this.updateIconVisibility();

        const providedColumnGroup = this.params.columnGroup.getProvidedColumnGroup();
        const updateIcon = this.updateIconVisibility.bind(this);
        this.addManagedListeners(providedColumnGroup, {
            expandedChanged: updateIcon,
            expandableChanged: updateIcon,
        });
    }

    private addTouchAndClickListeners(eElement: HTMLElement, action: (event: MouseEvent) => void): void {
        this.beans.touchSvc?.setupForHeaderGroup(this, eElement, action);
        this.addManagedElementListeners(eElement, { click: action });
    }

    private updateIconVisibility(): void {
        const columnGroup = this.params.columnGroup;
        if (columnGroup.isExpandable()) {
            const expanded = this.params.columnGroup.isExpanded();
            _setDisplayed(this.agOpened, expanded);
            _setDisplayed(this.agClosed, !expanded);
        } else {
            _setDisplayed(this.agOpened, false);
            _setDisplayed(this.agClosed, false);
        }
    }

    private addInIcon(iconName: IconName, element: HTMLElement): void {
        const eIcon = _createIconNoSpan(iconName, this.beans, null);
        if (eIcon) {
            element.appendChild(eIcon);
        }
    }

    private addGroupExpandIcon() {
        if (!this.params.columnGroup.isExpandable()) {
            _setDisplayed(this.agOpened, false);
            _setDisplayed(this.agClosed, false);
            return;
        }
    }

    private setupLabel(): void {
        // no renderer, default text render
        const { displayName, columnGroup } = this.params;

        if (_exists(displayName)) {
            const displayNameSanitised = _escapeString(displayName, true);
            this.agLabel.textContent = displayNameSanitised!;
        }

        this.addOrRemoveCssClass('ag-sticky-label', !columnGroup.getColGroupDef()?.suppressStickyLabel);
    }
}
