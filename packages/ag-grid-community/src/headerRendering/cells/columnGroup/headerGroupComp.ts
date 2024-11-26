import { _getInnerHeaderGroupCompDetails } from '../../../components/framework/userCompUtils';
import type { UserComponentFactory } from '../../../components/framework/userComponentFactory';
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

    /** The component to use for inside the header group (replaces the text value and leaves the remainder of the Grid's original component). */
    innerHeaderGroupComponent?: any;
    /** Additional params to customise to the `innerHeaderGroupComponent`. */
    innerHeaderGroupComponentParams?: any;
}

export interface IHeaderGroup {}

export interface IHeaderGroupComp extends IHeaderGroup, IComponent<IHeaderGroupParams> {}

export interface IInnerHeaderGroupComponent<
    TData = any,
    TContext = any,
    TParams extends Readonly<IHeaderGroupParams<TData, TContext>> = IHeaderGroupParams<TData, TContext>,
> extends IComponent<TParams>,
        IHeaderGroup {}

export class HeaderGroupComp extends Component implements IHeaderGroupComp {
    private params: IHeaderGroupParams;

    private readonly agOpened: HTMLElement = RefPlaceholder;
    private readonly agClosed: HTMLElement = RefPlaceholder;
    private readonly agLabel: HTMLElement = RefPlaceholder;

    private innerHeaderGroupComponent: IInnerHeaderGroupComponent | undefined;
    private isLoadingInnerComponent: boolean = false;

    constructor() {
        super(/* html */ `<div class="ag-header-group-cell-label" role="presentation">
            <span data-ref="agLabel" class="ag-header-group-text" role="presentation"></span>
            <span data-ref="agOpened" class="ag-header-icon ag-header-expand-icon ag-header-expand-icon-expanded"></span>
            <span data-ref="agClosed" class="ag-header-icon ag-header-expand-icon ag-header-expand-icon-collapsed"></span>
        </div>`);
    }

    public init(params: IHeaderGroupParams): void {
        const { userCompFactory } = this.beans;
        this.params = params;

        this.checkWarnings();
        this.workOutInnerHeaderGroupComponent(userCompFactory, params);
        this.setupLabel(params);
        this.addGroupExpandIcon(params);
        this.setupExpandIcons();
    }

    private checkWarnings(): void {
        const paramsAny = this.params as any;

        if (paramsAny.template) {
            _warn(89);
        }
    }

    private workOutInnerHeaderGroupComponent(userCompFactory: UserComponentFactory, params: IHeaderGroupParams): void {
        const userCompDetails = _getInnerHeaderGroupCompDetails(userCompFactory, params, params);

        if (!userCompDetails) {
            return;
        }

        this.isLoadingInnerComponent = true;
        userCompDetails.newAgStackInstance().then((comp) => {
            this.isLoadingInnerComponent = false;
            if (!comp) {
                return;
            }

            if (this.isAlive()) {
                this.innerHeaderGroupComponent = comp;
                this.agLabel.appendChild(comp.getGui());
            } else {
                this.destroyBean(comp);
            }
        });
    }

    private setupExpandIcons(): void {
        const {
            agOpened,
            agClosed,
            params: { columnGroup },
            beans,
        } = this;
        this.addInIcon('columnGroupOpened', agOpened);
        this.addInIcon('columnGroupClosed', agClosed);

        const expandAction = (event: MouseEvent) => {
            if (_isStopPropagationForAgGrid(event)) {
                return;
            }

            const newExpandedValue = !columnGroup.isExpanded();
            beans.colGroupSvc!.setColumnGroupOpened(
                (columnGroup as AgColumnGroup).getProvidedColumnGroup(),
                newExpandedValue,
                'uiColumnExpanded'
            );
        };

        this.addTouchAndClickListeners(beans, agClosed, expandAction);
        this.addTouchAndClickListeners(beans, agOpened, expandAction);

        const stopPropagationAction = (event: MouseEvent) => {
            _stopPropagationForAgGrid(event);
        };

        // adding stopPropagation to the double click for the icons prevents double click action happening
        // when the icons are clicked. if the icons are double clicked, then the groups should open and
        // then close again straight away. if we also listened to double click, then the group would open,
        // close, then open, which is not what we want. double click should only action if the user double
        // clicks outside of the icons.
        this.addManagedElementListeners(agClosed, { dblclick: stopPropagationAction });
        this.addManagedElementListeners(agOpened, { dblclick: stopPropagationAction });

        this.addManagedElementListeners(this.getGui(), { dblclick: expandAction });

        this.updateIconVisibility();

        const providedColumnGroup = columnGroup.getProvidedColumnGroup();
        const updateIcon = this.updateIconVisibility.bind(this);
        this.addManagedListeners(providedColumnGroup, {
            expandedChanged: updateIcon,
            expandableChanged: updateIcon,
        });
    }

    private addTouchAndClickListeners(
        beans: BeanCollection,
        eElement: HTMLElement,
        action: (event: MouseEvent) => void
    ): void {
        beans.touchSvc?.setupForHeaderGroup(this, eElement, action);
        this.addManagedElementListeners(eElement, { click: action });
    }

    private updateIconVisibility(): void {
        const {
            agOpened,
            agClosed,
            params: { columnGroup },
        } = this;
        if (columnGroup.isExpandable()) {
            const expanded = columnGroup.isExpanded();
            _setDisplayed(agOpened, expanded);
            _setDisplayed(agClosed, !expanded);
        } else {
            _setDisplayed(agOpened, false);
            _setDisplayed(agClosed, false);
        }
    }

    private addInIcon(iconName: IconName, element: HTMLElement): void {
        const eIcon = _createIconNoSpan(iconName, this.beans, null);
        if (eIcon) {
            element.appendChild(eIcon);
        }
    }

    private addGroupExpandIcon(params: IHeaderGroupParams) {
        if (!params.columnGroup.isExpandable()) {
            const { agOpened, agClosed } = this;
            _setDisplayed(agOpened, false);
            _setDisplayed(agClosed, false);
            return;
        }
    }

    private setupLabel(params: IHeaderGroupParams): void {
        // no renderer, default text render
        const { displayName, columnGroup } = params;

        const hasInnerComponent = this.innerHeaderGroupComponent || this.isLoadingInnerComponent;

        if (_exists(displayName) && !hasInnerComponent) {
            const displayNameSanitised = _escapeString(displayName, true);
            this.agLabel.textContent = displayNameSanitised!;
        }

        this.addOrRemoveCssClass('ag-sticky-label', !columnGroup.getColGroupDef()?.suppressStickyLabel);
    }

    public override destroy(): void {
        super.destroy();

        if (this.innerHeaderGroupComponent) {
            this.destroyBean(this.innerHeaderGroupComponent);
            this.innerHeaderGroupComponent = undefined;
        }
    }
}
