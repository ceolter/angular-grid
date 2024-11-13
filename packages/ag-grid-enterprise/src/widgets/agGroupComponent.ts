import type { AgCheckbox, AgEvent, ComponentSelector } from 'ag-grid-community';
import {
    AgCheckboxSelector,
    AgToggleButton,
    Component,
    KeyCode,
    RefPlaceholder,
    _createIcon,
    _setAriaExpanded,
    _setDisplayed,
} from 'ag-grid-community';

type GroupItem = Component<any> | HTMLElement;
type Align = 'start' | 'end' | 'center' | 'stretch';
type Direction = 'horizontal' | 'vertical';

export interface AgGroupComponentParams {
    title?: string;
    enabled?: boolean;
    suppressEnabledCheckbox?: boolean;
    suppressOpenCloseIcons?: boolean;
    suppressToggleExpandOnEnableChange?: boolean;
    cssIdentifier?: string;
    items?: GroupItem[];
    alignItems?: Align;
    direction?: Direction;
    onEnableChange?: (enabled: boolean) => void;
    onExpandedChange?: (expanded: boolean) => void;
    expanded?: boolean;
    useToggle?: boolean;
    suppressKeyboardNavigation?: boolean;
}

export type AgGroupComponentEvent = 'expanded' | 'collapsed' | 'enableChange';
export type ExpandedChangedEventType = 'expandedChanged';

interface ExpandChangedEvent extends AgEvent<ExpandedChangedEventType> {
    expanded?: boolean;
}

interface EnableChangeEvent extends AgEvent<'enableChange'> {
    enabled: boolean;
}

function getAgGroupComponentTemplate(params: AgGroupComponentParams) {
    const cssIdentifier = params.cssIdentifier || 'default';
    const direction: Direction = params.direction || 'vertical';

    return /* html */ `
        <div class="ag-group ag-${cssIdentifier}-group" role="presentation">
            <div data-ref="eToolbar" class="ag-group-toolbar ag-${cssIdentifier}-group-toolbar">
                <ag-checkbox data-ref="cbGroupEnabled"></ag-checkbox>
            </div>
            <div data-ref="eContainer" class="ag-group-container ag-group-container-${direction} ag-${cssIdentifier}-group-container"></div>
        </div>
    `;
}

export class AgGroupComponent extends Component<AgGroupComponentEvent> {
    private items: GroupItem[];
    private cssIdentifier: string;
    private enabled: boolean;
    private expanded: boolean;
    private suppressEnabledCheckbox: boolean = true;
    private suppressToggleExpandOnEnableChange: boolean = false;
    private alignItems: Align | undefined;
    private useToggle: boolean;

    private eToggle?: AgToggleButton;
    private eTitleBar?: DefaultTitleBar;

    private readonly eToolbar: HTMLElement = RefPlaceholder;
    private readonly cbGroupEnabled: AgCheckbox = RefPlaceholder;
    private readonly eContainer: HTMLElement = RefPlaceholder;

    constructor(private readonly params: AgGroupComponentParams = {}) {
        super(getAgGroupComponentTemplate(params), [AgCheckboxSelector]);

        const {
            enabled,
            items,
            suppressEnabledCheckbox,
            expanded,
            suppressToggleExpandOnEnableChange,
            useToggle: toggleMode,
        } = params;

        this.cssIdentifier = params.cssIdentifier || 'default';
        this.enabled = enabled != null ? enabled : true;
        this.items = items || [];
        this.useToggle = toggleMode ?? false;

        this.alignItems = params.alignItems || 'center';

        // expanded by default
        this.expanded = expanded == null ? true : expanded;

        if (suppressEnabledCheckbox != null) {
            this.suppressEnabledCheckbox = suppressEnabledCheckbox;
        }

        if (suppressToggleExpandOnEnableChange != null) {
            this.suppressToggleExpandOnEnableChange = suppressToggleExpandOnEnableChange;
        }
    }

    public postConstruct() {
        this.setupTitleBar();

        if (this.items.length) {
            const initialItems = this.items;
            this.items = [];

            this.addItems(initialItems);
        }

        const localeTextFunc = this.getLocaleTextFunc();
        this.cbGroupEnabled.setLabel(localeTextFunc('enabled', 'Enabled'));

        if (this.enabled) {
            this.setEnabled(this.enabled, undefined, true);
        }

        this.setAlignItems(this.alignItems);

        const { onEnableChange, onExpandedChange, suppressOpenCloseIcons } = this.params;

        this.hideEnabledCheckbox(this.suppressEnabledCheckbox);
        this.hideOpenCloseIcons(suppressOpenCloseIcons ?? false);

        this.refreshChildDisplay();
        _setDisplayed(this.eContainer, this.expanded);

        this.cbGroupEnabled.onValueChange((newSelection: boolean) => {
            this.setEnabled(newSelection, true, this.suppressToggleExpandOnEnableChange);
            this.dispatchEnableChangeEvent(newSelection);
        });

        if (onEnableChange != null) {
            this.onEnableChange(onEnableChange);
        }

        if (onExpandedChange != null) {
            this.onExpandedChange(onExpandedChange);
        }
    }

    private refreshChildDisplay(): void {
        _setDisplayed(this.eToolbar, this.expanded && !this.suppressEnabledCheckbox);
        this.eTitleBar?.refreshOnExpand(this.expanded);
    }

    public isExpanded(): boolean {
        return this.expanded;
    }

    public setAlignItems(alignment: AgGroupComponentParams['alignItems']): this {
        if (this.alignItems !== alignment) {
            this.removeCssClass(`ag-group-item-alignment-${this.alignItems}`);
        }

        this.alignItems = alignment;
        const newCls = `ag-group-item-alignment-${this.alignItems}`;

        this.addCssClass(newCls);

        return this;
    }

    public toggleGroupExpand(expanded?: boolean, silent?: boolean): this {
        if (this.eTitleBar?.isSuppressCollapse() && !this.useToggle) {
            expanded = true;
            silent = true;
        } else {
            expanded = expanded != null ? expanded : !this.expanded;

            if (this.expanded === expanded) {
                return this;
            }
        }

        this.expanded = expanded;
        this.refreshChildDisplay();

        _setDisplayed(this.eContainer, expanded);

        if (!silent) {
            this.dispatchLocalEvent({
                type: expanded ? 'expanded' : 'collapsed',
            });
        }

        return this;
    }

    public addItems(items: GroupItem[]) {
        items.forEach((item) => this.addItem(item));
    }

    public prependItem(item: GroupItem) {
        this.insertItem(item, true);
    }

    public addItem(item: GroupItem) {
        this.insertItem(item, false);
    }

    private insertItem(item: GroupItem, prepend?: boolean) {
        const container = this.eContainer;
        const el = item instanceof Component ? item.getGui() : item;

        el.classList.add('ag-group-item', `ag-${this.cssIdentifier}-group-item`);

        if (prepend) {
            container.insertAdjacentElement('afterbegin', el);
            this.items.unshift(el);
        } else {
            container.appendChild(el);
            this.items.push(el);
        }
    }

    public hideItem(hide: boolean, index: number) {
        const itemToHide = this.items[index] as HTMLElement;
        _setDisplayed(itemToHide, !hide);
    }

    public getItemIndex(item: GroupItem): number | -1 {
        const el = item instanceof Component ? item.getGui() : item;
        return this.items.indexOf(el);
    }

    public setTitle(title: string): this {
        this.eTitleBar?.setTitle(title);
        return this;
    }

    public addTitleBarWidget(el: Element): this {
        this.eTitleBar?.addWidget(el);
        return this;
    }

    public addCssClassToTitleBar(cssClass: string) {
        this.eTitleBar?.addCssClass(cssClass);
    }

    private dispatchEnableChangeEvent(enabled: boolean): void {
        const event: EnableChangeEvent = {
            type: 'enableChange',
            enabled,
        };
        this.dispatchLocalEvent(event);
    }

    public setEnabled(enabled: boolean, skipToggle?: boolean, skipExpand?: boolean): this {
        this.enabled = enabled;
        this.refreshDisabledStyles();

        if (!skipExpand) {
            this.toggleGroupExpand(enabled);
        }

        if (!skipToggle) {
            this.cbGroupEnabled.setValue(enabled);
            this.eToggle?.setValue(enabled);
        }

        return this;
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public onEnableChange(callbackFn: (enabled: boolean) => void): this {
        this.addManagedListeners(this, { enableChange: (event: EnableChangeEvent) => callbackFn(event.enabled) });

        return this;
    }

    public onExpandedChange(callbackFn: (expanded: boolean) => void): this {
        this.addManagedListeners(this, {
            expanded: () => callbackFn(true),
            collapsed: () => callbackFn(false),
        });

        return this;
    }

    public hideEnabledCheckbox(hide: boolean): this {
        this.suppressEnabledCheckbox = hide;
        this.refreshChildDisplay();
        this.refreshDisabledStyles();
        return this;
    }

    public hideOpenCloseIcons(hide: boolean): this {
        this.eTitleBar?.hideOpenCloseIcons(hide);

        return this;
    }

    private refreshDisabledStyles() {
        const disabled = !this.enabled;
        this.eContainer.classList.toggle('ag-disabled', disabled);
        this.eTitleBar?.refreshDisabledStyles(this.suppressEnabledCheckbox && disabled);
        this.eContainer.classList.toggle('ag-disabled-group-container', disabled);
    }

    private setupTitleBar(): void {
        const titleBar = this.useToggle ? this.createToggleTitleBar() : this.createDefaultTitleBar();
        this.eToolbar.insertAdjacentElement('beforebegin', titleBar.getGui());
    }

    private createDefaultTitleBar(): DefaultTitleBar {
        const titleBar = this.createManagedBean(new DefaultTitleBar(this.params));
        this.eTitleBar = titleBar;
        titleBar.refreshOnExpand(this.expanded);
        this.addManagedListeners(titleBar, {
            expandedChanged: (event: ExpandChangedEvent) => this.toggleGroupExpand(event.expanded),
        });
        return titleBar;
    }

    private createToggleTitleBar(): AgToggleButton {
        const eToggle = this.createManagedBean(
            new AgToggleButton({
                value: this.enabled,
                label: this.params.title,
                labelAlignment: 'left',
                labelWidth: 'flex',
                onValueChange: (enabled) => {
                    this.setEnabled(enabled, true);
                    this.dispatchEnableChangeEvent(enabled);
                },
            })
        );
        eToggle.addCssClass('ag-group-title-bar');
        eToggle.addCssClass(`ag-${this.params.cssIdentifier ?? 'default'}-group-title-bar ag-unselectable`);
        this.eToggle = eToggle;
        this.toggleGroupExpand(this.enabled);
        return eToggle;
    }
}

const TITLE_BAR_DISABLED_CLASS = 'ag-disabled-group-title-bar';
function getDefaultTitleBarTemplate(params: AgGroupComponentParams) {
    const cssIdentifier = params.cssIdentifier ?? 'default';

    const role = params.suppressKeyboardNavigation ? 'presentation' : 'role';

    return /* html */ `
        <div class="ag-group-title-bar ag-${cssIdentifier}-group-title-bar ag-unselectable" role="${role}">
            <span class="ag-group-title-bar-icon ag-${cssIdentifier}-group-title-bar-icon" data-ref="eGroupOpenedIcon" role="presentation"></span>
            <span class="ag-group-title-bar-icon ag-${cssIdentifier}-group-title-bar-icon" data-ref="eGroupClosedIcon" role="presentation"></span>
            <span data-ref="eTitle" class="ag-group-title ag-${cssIdentifier}-group-title"></span>
        </div>
    `;
}
class DefaultTitleBar extends Component<ExpandedChangedEventType> {
    private title: string | undefined;
    private suppressOpenCloseIcons: boolean = false;
    private suppressKeyboardNavigation: boolean = false;

    private readonly eGroupOpenedIcon: HTMLElement = RefPlaceholder;
    private readonly eGroupClosedIcon: HTMLElement = RefPlaceholder;
    private readonly eTitle: HTMLElement = RefPlaceholder;

    constructor(params: AgGroupComponentParams = {}) {
        super(getDefaultTitleBarTemplate(params));

        const { title, suppressOpenCloseIcons, suppressKeyboardNavigation } = params;

        if (!!title && title.length > 0) {
            this.title = title;
        }

        if (suppressOpenCloseIcons != null) {
            this.suppressOpenCloseIcons = suppressOpenCloseIcons;
        }

        this.suppressKeyboardNavigation = suppressKeyboardNavigation ?? false;
    }

    public postConstruct() {
        this.setTitle(this.title);

        this.hideOpenCloseIcons(this.suppressOpenCloseIcons);

        this.setupExpandContract();
    }

    private setupExpandContract(): void {
        this.eGroupClosedIcon.appendChild(_createIcon('accordionClosed', this.beans, null));
        this.eGroupOpenedIcon.appendChild(_createIcon('accordionOpen', this.beans, null));
        this.addManagedElementListeners(this.getGui(), {
            click: () => this.dispatchExpandChanged(),
            keydown: (e: KeyboardEvent) => {
                switch (e.key) {
                    case KeyCode.ENTER:
                    case KeyCode.SPACE:
                        e.preventDefault();
                        this.dispatchExpandChanged();
                        break;
                    case KeyCode.RIGHT:
                    case KeyCode.LEFT:
                        e.preventDefault();
                        this.dispatchExpandChanged(e.key === KeyCode.RIGHT);
                        break;
                }
            },
        });
    }

    public refreshOnExpand(expanded: boolean): void {
        this.refreshAriaStatus(expanded);
        this.refreshOpenCloseIcons(expanded);
    }

    private refreshAriaStatus(expanded: boolean): void {
        if (!this.suppressOpenCloseIcons) {
            _setAriaExpanded(this.getGui(), expanded);
        }
    }

    private refreshOpenCloseIcons(expanded: boolean): void {
        const showIcon = !this.suppressOpenCloseIcons;

        _setDisplayed(this.eGroupOpenedIcon, showIcon && expanded);
        _setDisplayed(this.eGroupClosedIcon, showIcon && !expanded);
    }

    public isSuppressCollapse(): boolean {
        return this.suppressOpenCloseIcons;
    }

    private dispatchExpandChanged(expanded?: boolean): void {
        const event: ExpandChangedEvent = {
            type: 'expandedChanged',
            expanded,
        };
        this.dispatchLocalEvent(event);
    }

    public setTitle(title: string | undefined): this {
        const eGui = this.getGui();
        const hasTitle = !!title && title.length > 0;
        title = hasTitle ? title : undefined;

        this.eTitle.textContent = title ?? '';
        _setDisplayed(eGui, hasTitle);

        if (title !== this.title) {
            this.title = title;
        }

        const disabled = eGui.classList.contains(TITLE_BAR_DISABLED_CLASS);
        this.refreshDisabledStyles(disabled);

        return this;
    }

    public addWidget(el: Element): this {
        this.getGui().appendChild(el);

        return this;
    }

    public hideOpenCloseIcons(hide: boolean): this {
        this.suppressOpenCloseIcons = hide;

        if (hide) {
            this.dispatchExpandChanged(true);
        }

        return this;
    }

    public refreshDisabledStyles(disabled: boolean) {
        const eGui = this.getGui();
        if (disabled) {
            eGui.classList.add(TITLE_BAR_DISABLED_CLASS);
            eGui.removeAttribute('tabindex');
        } else {
            eGui.classList.remove(TITLE_BAR_DISABLED_CLASS);
            if (typeof this.title === 'string' && !this.suppressKeyboardNavigation) {
                eGui.setAttribute('tabindex', '0');
            } else {
                eGui.removeAttribute('tabindex');
            }
        }
    }
}

export const AgGroupComponentSelector: ComponentSelector = {
    selector: 'AG-GROUP-COMPONENT',
    component: AgGroupComponent,
};
