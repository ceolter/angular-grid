import type {
    AgCheckbox,
    AgColumn,
    AgEvent,
    BeanCollection,
    ColDef,
    ICellRendererComp,
    ISetFilterCellRendererParams,
    ITooltipCtrl,
    Registry,
    SetFilterParams,
    TooltipFeature,
    UserComponentFactory,
    ValueFormatterParams,
    ValueService,
} from 'ag-grid-community';
import {
    AgCheckboxSelector,
    Component,
    RefPlaceholder,
    _createIcon,
    _getCellRendererDetails,
    _getShouldDisplayTooltip,
    _isShowTooltipWhenTruncated,
    _setAriaChecked,
    _setAriaDescribedBy,
    _setAriaExpanded,
    _setAriaLabel,
    _setAriaLabelledBy,
    _setAriaLevel,
    _setDisplayed,
    _toStringOrNull,
    _warn,
} from 'ag-grid-community';

import type { SetFilterModelTreeItem } from './iSetDisplayValueModel';
import type { ISetFilterLocaleText } from './localeText';

export interface SetFilterListItemSelectionChangedEvent<
    I extends SetFilterModelTreeItem | string | null = SetFilterModelTreeItem | string | null,
> extends AgEvent<'selectionChanged'> {
    isSelected: boolean;
    item: I;
}

export interface SetFilterListItemExpandedChangedEvent<
    I extends SetFilterModelTreeItem | string | null = SetFilterModelTreeItem | string | null,
> extends AgEvent<'expandedChanged'> {
    isExpanded: boolean;
    item: I;
}

export interface SetFilterListItemParams<V> {
    focusWrapper: HTMLElement;
    value: V | null | (() => string);
    params: SetFilterParams<any, V>;
    translate: (key: keyof ISetFilterLocaleText) => string;
    valueFormatter?: (params: ValueFormatterParams) => string;
    item: SetFilterModelTreeItem | string | null;
    isSelected: boolean | undefined;
    isTree?: boolean;
    depth?: number;
    groupsExist?: boolean;
    isGroup?: boolean;
    isExpanded?: boolean;
    hasIndeterminateExpandState?: boolean;
}

export type SetFilterListItemEvent = 'selectionChanged' | 'expandedChanged';
/** @param V type of value in the Set Filter */
export class SetFilterListItem<V> extends Component<SetFilterListItemEvent> {
    private valueSvc: ValueService;
    private userCompFactory: UserComponentFactory;
    private registry: Registry;

    public wireBeans(beans: BeanCollection) {
        this.valueSvc = beans.valueSvc;
        this.userCompFactory = beans.userCompFactory;
        this.registry = beans.registry;
    }

    private readonly eCheckbox: AgCheckbox = RefPlaceholder;

    private readonly eGroupOpenedIcon: HTMLElement = RefPlaceholder;
    private readonly eGroupClosedIcon: HTMLElement = RefPlaceholder;
    private readonly eGroupIndeterminateIcon: HTMLElement = RefPlaceholder;

    private readonly focusWrapper: HTMLElement;
    private readonly value: V | null | (() => string);
    private readonly params: SetFilterParams<any, V>;
    private readonly translate: (key: keyof ISetFilterLocaleText) => string;
    private readonly valueFormatter?: (params: ValueFormatterParams) => string;
    private readonly isTree?: boolean;
    private readonly depth: number;
    private readonly isGroup?: boolean;
    private readonly groupsExist?: boolean;
    private readonly hasIndeterminateExpandState?: boolean;

    private item: SetFilterModelTreeItem | string | null;
    private isSelected: boolean | undefined;
    private isExpanded: boolean | undefined;
    // only used for select all
    private valueFunction?: () => string;

    private cellRendererParams: ISetFilterCellRendererParams;
    private cellRendererComponent?: ICellRendererComp;
    private destroyCellRendererComponent?: () => void;
    private tooltipFeature?: TooltipFeature;
    private shouldDisplayTooltip?: () => boolean;
    private formattedValue: string | null = null;

    constructor(params: SetFilterListItemParams<V>) {
        super(
            params.isGroup
                ? /* html */ `
            <div class="ag-set-filter-item" aria-hidden="true">
                <span class="ag-set-filter-group-icons">
                    <span class="ag-set-filter-group-closed-icon" data-ref="eGroupClosedIcon"></span>
                    <span class="ag-set-filter-group-opened-icon" data-ref="eGroupOpenedIcon"></span>
                    <span class="ag-set-filter-group-indeterminate-icon" data-ref="eGroupIndeterminateIcon"></span>
                </span>
                <ag-checkbox data-ref="eCheckbox" class="ag-set-filter-item-checkbox"></ag-checkbox>
            </div>`
                : /* html */ `
            <div class="ag-set-filter-item">
                <ag-checkbox data-ref="eCheckbox" class="ag-set-filter-item-checkbox"></ag-checkbox>
            </div>`,
            [AgCheckboxSelector]
        );
        this.focusWrapper = params.focusWrapper;
        this.value = params.value;
        this.params = params.params;
        this.translate = params.translate;
        this.valueFormatter = params.valueFormatter;
        this.item = params.item;
        this.isSelected = params.isSelected;
        this.isTree = params.isTree;
        this.depth = params.depth ?? 0;
        this.isGroup = params.isGroup;
        this.groupsExist = params.groupsExist;
        this.isExpanded = params.isExpanded;
        this.hasIndeterminateExpandState = params.hasIndeterminateExpandState;
    }

    public postConstruct(): void {
        this.tooltipFeature = this.createOptionalManagedBean(
            this.registry.createDynamicBean<TooltipFeature>('tooltipFeature', {
                getGui: () => this.getGui(),
                getColDef: () => this.params.colDef,
                getColumn: () => this.params.column as AgColumn,
                getLocation: () => 'setFilterValue',
                shouldDisplayTooltip: () => this.shouldDisplayTooltip?.() ?? true,
                getValueFormatted: () => this.formattedValue,
                getAdditionalParams: () => (this.isTree ? { level: this.depth } : {}),
            } as ITooltipCtrl)
        );

        this.addDestroyFunc(() => this.destroyCellRendererComponent?.());

        this.render();

        this.eCheckbox
            .setLabelEllipsis(true)
            .setValue(this.isSelected, true)
            .setDisabled(!!this.params.readOnly)
            .getInputElement()
            .setAttribute('tabindex', '-1');

        this.refreshVariableAriaLabels();

        if (this.isTree) {
            if (this.depth > 0) {
                this.addCssClass('ag-set-filter-indent-' + this.depth);
                this.getGui().style.setProperty('--ag-indentation-level', String(this.depth));
            }
            if (this.isGroup) {
                this.setupExpansion();
            } else {
                if (this.groupsExist) {
                    this.addCssClass('ag-set-filter-add-group-indent');
                }
            }

            _setAriaLevel(this.getAriaElement(), this.depth + 1);
        }

        this.refreshAriaChecked();

        if (this.params.readOnly) {
            // Don't add event listeners if we're read-only.
            return;
        }

        this.eCheckbox.onValueChange((value) => this.onCheckboxChanged(!!value));
    }

    public override getFocusableElement(): HTMLElement {
        return this.focusWrapper;
    }

    private setupExpansion(): void {
        this.eGroupClosedIcon.appendChild(_createIcon('setFilterGroupClosed', this.beans, null));
        this.eGroupOpenedIcon.appendChild(_createIcon('setFilterGroupOpen', this.beans, null));
        const listener = this.onExpandOrContractClicked.bind(this);
        this.addManagedElementListeners(this.eGroupClosedIcon, { click: listener });
        this.addManagedElementListeners(this.eGroupOpenedIcon, { click: listener });

        if (this.hasIndeterminateExpandState) {
            this.eGroupIndeterminateIcon.appendChild(_createIcon('setFilterGroupIndeterminate', this.beans, null));
            this.addManagedElementListeners(this.eGroupIndeterminateIcon, {
                click: listener,
            });
        }

        this.setExpandedIcons();
        this.refreshAriaExpanded();
    }

    private onExpandOrContractClicked(): void {
        this.setExpanded(!this.isExpanded);
    }

    public setExpanded(isExpanded: boolean | undefined, silent?: boolean): void {
        if (this.isGroup && isExpanded !== this.isExpanded) {
            this.isExpanded = isExpanded;

            const event: SetFilterListItemExpandedChangedEvent = {
                type: 'expandedChanged',
                isExpanded: !!isExpanded,
                item: this.item,
            };

            if (!silent) {
                this.dispatchLocalEvent(event);
            }

            this.setExpandedIcons();
            this.refreshAriaExpanded();
        }
    }

    private setExpandedIcons(): void {
        _setDisplayed(
            this.eGroupClosedIcon,
            this.hasIndeterminateExpandState ? this.isExpanded === false : !this.isExpanded
        );
        _setDisplayed(this.eGroupOpenedIcon, this.isExpanded === true);
        if (this.hasIndeterminateExpandState) {
            _setDisplayed(this.eGroupIndeterminateIcon, this.isExpanded === undefined);
        }
    }

    private onCheckboxChanged(isSelected: boolean): void {
        this.isSelected = isSelected;

        const event: SetFilterListItemSelectionChangedEvent = {
            type: 'selectionChanged',
            isSelected,
            item: this.item,
        };

        this.dispatchLocalEvent(event);
        this.refreshVariableAriaLabels();
        this.refreshAriaChecked();
    }

    public toggleSelected(): void {
        if (this.params.readOnly) {
            return;
        }

        this.setSelected(!this.isSelected);
    }

    private setSelected(isSelected: boolean | undefined, silent?: boolean) {
        this.isSelected = isSelected;
        this.eCheckbox.setValue(isSelected, silent);
        this.refreshAriaChecked();
    }

    private refreshVariableAriaLabels(): void {
        if (!this.isTree) {
            return;
        }
        const translate = this.getLocaleTextFunc();
        const checkboxValue = this.eCheckbox.getValue();
        const state =
            checkboxValue === undefined
                ? translate('ariaIndeterminate', 'indeterminate')
                : checkboxValue
                  ? translate('ariaVisible', 'visible')
                  : translate('ariaHidden', 'hidden');
        const visibilityLabel = translate('ariaToggleVisibility', 'Press SPACE to toggle visibility');
        _setAriaLabelledBy(this.eCheckbox.getInputElement(), undefined as any);
        this.eCheckbox.setInputAriaLabel(`${visibilityLabel} (${state})`);
    }

    private setupFixedAriaLabels(value: any): void {
        if (!this.isTree) {
            return;
        }
        const translate = this.getLocaleTextFunc();
        const itemLabel = translate('ariaFilterValue', 'Filter Value');
        const ariaEl = this.getAriaElement();
        _setAriaLabel(ariaEl, `${value} ${itemLabel}`);
        _setAriaDescribedBy(ariaEl, this.eCheckbox.getInputElement().id);
    }

    private refreshAriaChecked(): void {
        const ariaEl = this.getAriaElement();

        _setAriaChecked(ariaEl, this.eCheckbox.getValue());
    }

    private refreshAriaExpanded(): void {
        _setAriaExpanded(this.getAriaElement(), !!this.isExpanded);
    }

    public refresh(
        item: SetFilterModelTreeItem | string | null,
        isSelected: boolean | undefined,
        isExpanded: boolean | undefined
    ): void {
        this.item = item;
        // setExpanded checks if value has changed, setSelected does not
        if (isSelected !== this.isSelected) {
            this.setSelected(isSelected, true);
        }
        this.setExpanded(isExpanded, true);
        if (this.valueFunction) {
            // underlying value might have changed, so call again and re-render
            const value = this.valueFunction();
            this.setTooltipAndCellRendererParams(value as any, value);
            if (!this.cellRendererComponent) {
                this.renderCellWithoutCellRenderer();
            }
        }
        if (this.cellRendererComponent) {
            const success = this.cellRendererComponent.refresh?.(this.cellRendererParams as any);
            if (!success) {
                const oldComponent = this.cellRendererComponent;
                this.renderCell();
                this.destroyBean(oldComponent);
            }
        }
    }

    public render(): void {
        const {
            params: { column },
        } = this;

        let { value } = this;
        let formattedValue: string | null = null;

        if (typeof value === 'function') {
            this.valueFunction = value as () => string;
            formattedValue = this.valueFunction();
            // backwards compatibility for select all in value
            value = formattedValue as any;
        } else if (this.isTree) {
            // tree values are already formatted via treeListFormatter
            formattedValue = _toStringOrNull(value);
        } else {
            formattedValue = this.getFormattedValue(column as AgColumn, value);
        }
        this.formattedValue = formattedValue;

        this.setTooltipAndCellRendererParams(value, formattedValue);

        this.renderCell();
    }

    private setTooltipAndCellRendererParams(value: V | null | (() => string), formattedValue: string | null): void {
        if (this.params.showTooltips && (!_isShowTooltipWhenTruncated(this.gos) || !this.params.cellRenderer)) {
            const newTooltipText = formattedValue != null ? formattedValue : _toStringOrNull(value);
            this.shouldDisplayTooltip = _getShouldDisplayTooltip(
                this.gos,
                () => this.eCheckbox.getGui().querySelector('.ag-label') as HTMLElement | undefined
            );
            this.tooltipFeature?.setTooltipAndRefresh(newTooltipText);
        }

        this.cellRendererParams = this.gos.addGridCommonParams({
            value,
            valueFormatted: formattedValue,
            colDef: this.params.colDef,
            column: this.params.column,
            setTooltip: (value: string, shouldDisplayTooltip: () => boolean) => {
                this.shouldDisplayTooltip = shouldDisplayTooltip;
                this.tooltipFeature?.setTooltipAndRefresh(value);
            },
        });
    }

    private getFormattedValue(column: AgColumn, value: any) {
        return this.valueSvc.formatValue(column, null, value, this.valueFormatter, false);
    }

    private renderCell(): void {
        const compDetails = _getCellRendererDetails<SetFilterParams<any, V>, ISetFilterCellRendererParams>(
            this.userCompFactory,
            this.params,
            this.cellRendererParams
        );
        const cellRendererPromise = compDetails ? compDetails.newAgStackInstance() : undefined;

        if (cellRendererPromise == null) {
            this.renderCellWithoutCellRenderer();
            return;
        }

        cellRendererPromise.then((component) => {
            if (component) {
                this.cellRendererComponent = component;
                this.eCheckbox.setLabel(component.getGui());
                this.destroyCellRendererComponent = () => this.destroyBean(component);
            }
        });
    }

    private renderCellWithoutCellRenderer(): void {
        let valueToRender =
            (this.cellRendererParams.valueFormatted == null
                ? this.cellRendererParams.value
                : this.cellRendererParams.valueFormatted) ?? this.translate('blanks');
        if (typeof valueToRender !== 'string') {
            _warn(208);
            valueToRender = '';
        }

        this.eCheckbox.setLabel(valueToRender);
        this.setupFixedAriaLabels(valueToRender);
    }

    public getComponentHolder(): ColDef {
        return this.params.column.getColDef();
    }
}
