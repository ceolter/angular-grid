import {
    Component,
    KeyCode,
    _clearElement,
    _findFocusableElements,
    _findNextFocusableElement,
    _getActiveDomElement,
    _getDocument,
    _setAriaPosInSet,
    _setAriaSetSize,
} from 'ag-grid-community';

import { AgPill } from './agPill';

export interface PillRendererParams<TValue> {
    eWrapper?: HTMLElement;
    announceItemFocus?: () => void;
    onPillMouseDown?: (e: MouseEvent) => void;
    getValue: () => TValue[] | null;
    setValue: (value: TValue[] | null) => void;
}

export class AgPillContainer<TValue> extends Component {
    private params: PillRendererParams<TValue>;
    private pills: AgPill[] = [];

    constructor() {
        super(/* html */ `
            <div class="ag-pill-container" role="listbox"></div>
            `);
    }

    public init(params: PillRendererParams<TValue>) {
        this.params = params;
        this.refresh();
    }

    public refresh(): void {
        this.clearPills();

        const { params, onPillKeyDown } = this;

        const values = params.getValue();

        if (!Array.isArray(values)) {
            return;
        }

        const len = values.length;

        for (let i = 0; i < len; i++) {
            const value = values[i];
            const pill: AgPill = this.createBean(
                new AgPill({
                    onButtonClick: () => this.onPillButtonClick(pill),
                    onKeyDown: onPillKeyDown.bind(this),
                })
            );

            const pillGui = pill.getGui();

            _setAriaPosInSet(pillGui, i + 1);
            _setAriaSetSize(pillGui, len);

            if (params.onPillMouseDown) {
                pill.addGuiEventListener('mousedown', params.onPillMouseDown);
            }

            if (params.announceItemFocus) {
                pill.addGuiEventListener('focus', params.announceItemFocus);
            }

            pill.setText(value as string);
            pill.toggleCloseButtonClass('ag-icon-cancel', true);
            this.appendChild(pillGui);
            this.pills.push(pill);
        }
    }

    public onNavigationKeyDown(e: KeyboardEvent): void {
        const { key } = e;

        if (!this.pills.length || (key !== KeyCode.LEFT && key !== KeyCode.RIGHT)) {
            return;
        }

        e.preventDefault();

        const { params, beans } = this;
        const activeEl = _getActiveDomElement(beans);
        const eGui = this.getGui();

        if (eGui.contains(activeEl)) {
            const nextFocusableEl = _findNextFocusableElement(beans, eGui, false, key === KeyCode.LEFT);

            if (nextFocusableEl) {
                nextFocusableEl.focus();
            } else if (params.eWrapper) {
                params.eWrapper.focus();
            }
        } else {
            const focusableElements = _findFocusableElements(eGui);
            if (focusableElements.length > 0) {
                focusableElements[key === KeyCode.RIGHT ? 0 : focusableElements.length - 1].focus();
            }
        }
    }

    private clearPills(): void {
        const eGui = this.getGui();

        if (eGui.contains(_getActiveDomElement(this.beans)) && this.params.eWrapper) {
            this.params.eWrapper.focus();
        }

        _clearElement(eGui);
        this.destroyBeans(this.pills);
        this.pills = [];
    }

    private onPillButtonClick(pill: AgPill): void {
        this.deletePill(pill);
    }

    private onPillKeyDown(e: KeyboardEvent): void {
        const key = e.key;

        if (key !== KeyCode.DELETE && key !== KeyCode.BACKSPACE) {
            return;
        }

        e.preventDefault();

        const eDoc = _getDocument(this.beans);
        const pillIndex = this.pills.findIndex((pill) => pill.getGui().contains(eDoc.activeElement));

        if (pillIndex === -1) {
            return;
        }

        const pill = this.pills[pillIndex];

        if (pill) {
            this.deletePill(pill, pillIndex);
        }
    }

    private deletePill(pill: AgPill, restoreFocusToIndex?: number): void {
        const value = pill.getText();
        const values = (this.params.getValue() || []).filter((val) => val !== value);
        this.params.setValue(values);

        if (!values.length && this.params.eWrapper) {
            this.params.eWrapper.focus();
        } else if (restoreFocusToIndex != null) {
            const pill = this.pills[Math.min(restoreFocusToIndex, this.pills.length - 1)];
            if (pill) {
                pill.getFocusableElement().focus();
            }
        }
    }

    public override destroy(): void {
        this.clearPills();
        super.destroy();
    }
}
