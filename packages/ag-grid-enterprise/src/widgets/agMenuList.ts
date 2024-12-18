import type { BeanStub, IMenuActionParams, MenuItemDef, WithoutGridCommon } from 'ag-grid-community';
import {
    AgPromise,
    KeyCode,
    TabGuardComp,
    _last,
    _loadTemplate,
    _preserveRangesWhile,
    _stopPropagationForAgGrid,
    _warn,
} from 'ag-grid-community';

import type { AgMenuItemComponentEvent, CloseMenuEvent, MenuItemActivatedEvent } from './agMenuItemComponent';
import { AgMenuItemComponent } from './agMenuItemComponent';

export type AgMenuListEvent = AgMenuItemComponentEvent;

export class AgMenuList extends TabGuardComp<AgMenuListEvent> {
    private menuItems: AgMenuItemComponent[] = [];
    private activeMenuItem: AgMenuItemComponent | null;
    private params: WithoutGridCommon<IMenuActionParams>;

    constructor(
        private readonly level = 0,
        params?: WithoutGridCommon<IMenuActionParams>
    ) {
        super(/* html */ `<div class="ag-menu-list" role="tree"></div>`);
        this.params = params ?? {
            column: null,
            node: null,
            value: null,
        };
    }

    public postConstruct() {
        this.initialiseTabGuard({
            onTabKeyDown: (e) => this.onTabKeyDown(e),
            handleKeyDown: (e) => _preserveRangesWhile(this.beans, () => this.handleKeyDown(e)),
            onFocusIn: (e) => this.handleFocusIn(e),
            onFocusOut: (e) => this.handleFocusOut(e),
        });
    }

    private onTabKeyDown(e: KeyboardEvent) {
        const parent = this.getParentComponent();
        const isManaged = parent?.getGui()?.classList.contains('ag-focus-managed');

        if (!isManaged) {
            e.preventDefault();
        }

        if (e.shiftKey) {
            this.closeIfIsChild(e);
        }
    }

    private handleKeyDown(e: KeyboardEvent): void {
        switch (e.key) {
            case KeyCode.UP:
            case KeyCode.RIGHT:
            case KeyCode.DOWN:
            case KeyCode.LEFT:
                e.preventDefault();
                this.handleNavKey(e.key);
                break;
            case KeyCode.ESCAPE:
                if (this.closeIfIsChild()) {
                    _stopPropagationForAgGrid(e);
                }
                break;
        }
    }

    private handleFocusIn(e: FocusEvent): void {
        // if focus is coming from outside the menu list, then re-activate an item
        const oldFocusedElement = e.relatedTarget as HTMLElement;
        if (
            !this.tabGuardFeature.getTabGuardCtrl().isTabGuard(oldFocusedElement) &&
            (this.getGui().contains(oldFocusedElement) ||
                this.activeMenuItem?.getSubMenuGui()?.contains(oldFocusedElement))
        ) {
            return;
        }
        if (this.activeMenuItem) {
            this.activeMenuItem.activate();
        } else {
            this.activateFirstItem();
        }
    }

    private handleFocusOut(e: FocusEvent): void {
        // if focus is going outside the menu list, deactivate the current item
        const newFocusedElement = e.relatedTarget as HTMLElement;
        if (
            !this.activeMenuItem ||
            this.getGui().contains(newFocusedElement) ||
            this.activeMenuItem.getSubMenuGui()?.contains(newFocusedElement)
        ) {
            return;
        }
        if (!this.activeMenuItem.isSubMenuOpening()) {
            this.activeMenuItem.deactivate();
        }
    }

    public clearActiveItem(): void {
        if (this.activeMenuItem) {
            this.activeMenuItem.deactivate();
            this.activeMenuItem = null;
        }
    }

    public addMenuItems(menuItems?: (MenuItemDef | string)[]): void {
        if (menuItems == null) {
            return;
        }

        AgPromise.all(
            menuItems.map<AgPromise<{ eGui: HTMLElement | null; comp?: AgMenuItemComponent }>>((menuItemOrString) => {
                if (menuItemOrString === 'separator') {
                    return AgPromise.resolve({ eGui: this.createSeparator() });
                } else if (typeof menuItemOrString === 'string') {
                    _warn(228, { menuItemOrString });
                    return AgPromise.resolve({ eGui: null });
                } else {
                    return this.addItem(menuItemOrString);
                }
            })
        ).then((elements) => {
            (elements ?? []).forEach((element) => {
                if (element?.eGui) {
                    this.appendChild(element.eGui);
                    if (element.comp) {
                        this.menuItems.push(element.comp);
                    }
                }
            });
        });
    }

    private addItem(menuItemDef: MenuItemDef): AgPromise<{ comp: AgMenuItemComponent; eGui: HTMLElement }> {
        const menuItem = this.createManagedBean(new AgMenuItemComponent());
        return menuItem
            .init({
                menuItemDef,
                isAnotherSubMenuOpen: () => this.menuItems.some((m) => m.isSubMenuOpen()),
                level: this.level,
                contextParams: this.params,
            })
            .then(() => {
                menuItem.setParentComponent(this);

                this.addManagedListeners(menuItem, {
                    closeMenu: (event: CloseMenuEvent) => {
                        this.dispatchLocalEvent(event);
                    },
                    menuItemActivated: (event: MenuItemActivatedEvent) => {
                        if (this.activeMenuItem && this.activeMenuItem !== event.menuItem) {
                            this.activeMenuItem.deactivate();
                        }

                        this.activeMenuItem = event.menuItem;
                    },
                });

                return {
                    comp: menuItem,
                    eGui: menuItem.getGui(),
                };
            });
    }

    public activateFirstItem(): void {
        const item = this.menuItems.filter((currentItem) => !currentItem.isDisabled())[0];

        if (!item) {
            return;
        }

        item.activate();
    }

    private createSeparator(): HTMLElement {
        const separatorHtml = /* html */ `
            <div class="ag-menu-separator" aria-hidden="true">
                <div class="ag-menu-separator-part"></div>
                <div class="ag-menu-separator-part"></div>
                <div class="ag-menu-separator-part"></div>
                <div class="ag-menu-separator-part"></div>
            </div>`;

        return _loadTemplate(separatorHtml);
    }

    private handleNavKey(key: string): void {
        switch (key) {
            case KeyCode.UP:
            case KeyCode.DOWN: {
                const nextItem = this.findNextItem(key === KeyCode.UP);

                if (nextItem && nextItem !== this.activeMenuItem) {
                    nextItem.activate();
                }

                return;
            }
        }

        const left = this.gos.get('enableRtl') ? KeyCode.RIGHT : KeyCode.LEFT;

        if (key === left) {
            this.closeIfIsChild();
        } else {
            this.openChild();
        }
    }

    private closeIfIsChild(e?: KeyboardEvent): boolean {
        const parentItem = this.getParentComponent() as BeanStub;

        if (parentItem && parentItem instanceof AgMenuItemComponent) {
            if (e) {
                e.preventDefault();
            }

            parentItem.closeSubMenu();
            parentItem.getGui().focus();
            return true;
        }
        return false;
    }

    private openChild(): void {
        if (this.activeMenuItem) {
            this.activeMenuItem.openSubMenu(true);
        }
    }

    private findNextItem(up?: boolean): AgMenuItemComponent | undefined {
        const items = this.menuItems.filter((item) => !item.isDisabled());

        if (!items.length) {
            return;
        }

        if (!this.activeMenuItem) {
            return up ? _last(items) : items[0];
        }

        if (up) {
            items.reverse();
        }

        let nextItem: AgMenuItemComponent | undefined;
        let foundCurrent = false;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (!foundCurrent) {
                if (item === this.activeMenuItem) {
                    foundCurrent = true;
                }
                continue;
            }

            nextItem = item;
            break;
        }

        if (foundCurrent && !nextItem) {
            // start again from the beginning (/end)
            return items[0];
        }

        return nextItem! || this.activeMenuItem;
    }

    public override destroy(): void {
        this.clearActiveItem();
        super.destroy();
    }
}
