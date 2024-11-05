import type { IMenuItemComp, IMenuItemParams } from 'ag-grid-community';
import {
    Component,
    _createIconNoSpan,
    _isNodeOrElement,
    _loadTemplate,
    _setAriaExpanded,
    _warn,
} from 'ag-grid-community';

interface AgMenuItemRendererParams {
    cssClassPrefix?: string;
    isCompact?: boolean;
}

export class AgMenuItemRenderer extends Component implements IMenuItemComp {
    private params: IMenuItemParams & AgMenuItemRendererParams;
    private cssClassPrefix: string;

    constructor() {
        super();

        this.setTemplate(/* html */ `<div></div>`);
    }

    public init(params: IMenuItemParams & AgMenuItemRendererParams): void {
        this.params = params;
        this.cssClassPrefix = this.params.cssClassPrefix ?? 'ag-menu-option';

        this.addIcon();
        this.addName();
        this.addShortcut();
        this.addSubMenu();
    }

    public configureDefaults(): boolean {
        return true;
    }

    private addIcon(): void {
        if (this.params.isCompact) {
            return;
        }
        const iconWrapper = _loadTemplate(
            /* html */
            `<span data-ref="eIcon" class="${this.getClassName('part')} ${this.getClassName('icon')}" role="presentation"></span>`
        );

        const { checked, icon } = this.params;

        if (checked) {
            iconWrapper.appendChild(_createIconNoSpan('check', this.beans)!);
        } else if (icon) {
            if (_isNodeOrElement(icon)) {
                iconWrapper.appendChild(icon);
            } else if (typeof icon === 'string') {
                iconWrapper.innerHTML = icon;
            } else {
                _warn(227);
            }
        }

        this.getGui().appendChild(iconWrapper);
    }

    private addName(): void {
        const name = _loadTemplate(
            /* html */
            `<span data-ref="eName" class="${this.getClassName('part')} ${this.getClassName('text')}">${this.params.name || ''}</span>`
        );

        this.getGui().appendChild(name);
    }

    private addShortcut(): void {
        if (this.params.isCompact) {
            return;
        }
        const shortcut = _loadTemplate(
            /* html */
            `<span data-ref="eShortcut" class="${this.getClassName('part')} ${this.getClassName('shortcut')}">${this.params.shortcut || ''}</span>`
        );

        this.getGui().appendChild(shortcut);
    }

    private addSubMenu(): void {
        const pointer = _loadTemplate(
            /* html */
            `<span data-ref="ePopupPointer" class="${this.getClassName('part')} ${this.getClassName('popup-pointer')}"></span>`
        );

        const eGui = this.getGui();

        if (this.params.subMenu) {
            const iconName = this.gos.get('enableRtl') ? 'subMenuOpenRtl' : 'subMenuOpen';
            _setAriaExpanded(eGui, false);

            pointer.appendChild(_createIconNoSpan(iconName, this.beans)!);
        }

        eGui.appendChild(pointer);
    }

    private getClassName(suffix: string) {
        return `${this.cssClassPrefix}-${suffix}`;
    }

    public override destroy(): void {
        super.destroy();
    }
}
