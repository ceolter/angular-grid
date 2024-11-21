import { KeyCode } from '../constants/keyCode';
import { _isNothingFocused } from '../gridOptionsUtils';
import type { AgPickerFieldParams } from '../interfaces/agFieldParams';
import { _setAriaExpanded, _setAriaRole } from '../utils/aria';
import { _formatSize, _getAbsoluteWidth, _getInnerHeight, _setElementWidth } from '../utils/dom';
import type { IconName } from '../utils/icon';
import { _createIconNoSpan } from '../utils/icon';
import type { AgAbstractFieldEvent } from './agAbstractField';
import { AgAbstractField } from './agAbstractField';
import { agPickerFieldCSS } from './agPickerField.css-GENERATED';
import type { Component } from './component';
import { RefPlaceholder } from './component';
import type { AddPopupParams } from './popupService';

export type AgPickerFieldEvent = AgAbstractFieldEvent;
export abstract class AgPickerField<
    TValue,
    TConfig extends AgPickerFieldParams = AgPickerFieldParams,
    TEventType extends string = AgPickerFieldEvent,
    TComponent extends Component<TEventType | AgPickerFieldEvent> = Component<TEventType | AgPickerFieldEvent>,
> extends AgAbstractField<TValue, TConfig, TEventType | AgPickerFieldEvent> {
    protected abstract createPickerComponent(): TComponent;

    protected pickerComponent: TComponent | undefined;
    protected isPickerDisplayed: boolean = false;

    protected maxPickerHeight: string | undefined;
    protected variableWidth: boolean;
    protected minPickerWidth: string | undefined;
    protected maxPickerWidth: string | undefined;
    protected override value: TValue;

    private skipClick: boolean = false;
    private pickerGap: number = 4;

    private hideCurrentPicker: (() => void) | null = null;
    private destroyMouseWheelFunc: (() => null) | undefined;
    private ariaRole?: string;

    protected readonly eLabel: HTMLElement = RefPlaceholder;
    protected readonly eWrapper: HTMLElement = RefPlaceholder;
    protected readonly eDisplayField: HTMLElement = RefPlaceholder;
    private readonly eIcon: HTMLButtonElement = RefPlaceholder;

    constructor(config?: TConfig) {
        super(
            config,
            config?.template ||
                /* html */ `
            <div class="ag-picker-field" role="presentation">
                <div data-ref="eLabel"></div>
                <div data-ref="eWrapper" class="ag-wrapper ag-picker-field-wrapper ag-picker-collapsed">
                    <div data-ref="eDisplayField" class="ag-picker-field-display"></div>
                    <div data-ref="eIcon" class="ag-picker-field-icon" aria-hidden="true"></div>
                </div>
            </div>`,
            config?.agComponents || [],
            config?.className
        );
        this.registerCSS(agPickerFieldCSS);

        this.ariaRole = config?.ariaRole;
        this.onPickerFocusIn = this.onPickerFocusIn.bind(this);
        this.onPickerFocusOut = this.onPickerFocusOut.bind(this);

        if (!config) {
            return;
        }

        const { pickerGap, maxPickerHeight, variableWidth, minPickerWidth, maxPickerWidth } = config;

        if (pickerGap != null) {
            this.pickerGap = pickerGap;
        }

        this.variableWidth = !!variableWidth;

        if (maxPickerHeight != null) {
            this.setPickerMaxHeight(maxPickerHeight);
        }

        if (minPickerWidth != null) {
            this.setPickerMinWidth(minPickerWidth);
        }

        if (maxPickerWidth != null) {
            this.setPickerMaxWidth(maxPickerWidth);
        }
    }

    public override postConstruct() {
        super.postConstruct();

        this.setupAria();

        const displayId = `ag-${this.getCompId()}-display`;
        this.eDisplayField.setAttribute('id', displayId);

        const ariaEl = this.getAriaElement();
        this.addManagedElementListeners(ariaEl, { keydown: this.onKeyDown.bind(this) });

        this.addManagedElementListeners(this.eLabel, { mousedown: this.onLabelOrWrapperMouseDown.bind(this) });
        this.addManagedElementListeners(this.eWrapper, { mousedown: this.onLabelOrWrapperMouseDown.bind(this) });

        const { pickerIcon, inputWidth } = this.config;

        if (pickerIcon) {
            const icon = _createIconNoSpan(pickerIcon as IconName, this.beans);
            if (icon) {
                this.eIcon.appendChild(icon);
            }
        }

        if (inputWidth != null) {
            this.setInputWidth(inputWidth);
        }
    }

    protected setupAria(): void {
        const ariaEl = this.getAriaElement();

        ariaEl.setAttribute('tabindex', this.gos.get('tabIndex').toString());

        _setAriaExpanded(ariaEl, false);

        if (this.ariaRole) {
            _setAriaRole(ariaEl, this.ariaRole);
        }
    }

    private onLabelOrWrapperMouseDown(e?: MouseEvent): void {
        if (e) {
            const focusableEl = this.getFocusableElement();
            // if the focusableEl is not the wrapper and the mousedown
            // targets the focusableEl, we should not expand/collapse the picker.
            // Note: this will happen when AgRichSelect is set with `allowTyping=true`
            if (focusableEl !== this.eWrapper && e?.target === focusableEl) {
                return;
            }

            // this prevents a BUG where MouseDown causes the element to be focused
            // after the picker is shown and focus ends up being lost.
            e.preventDefault();
            this.getFocusableElement().focus();
        }

        if (this.skipClick) {
            this.skipClick = false;
            return;
        }

        if (this.isDisabled()) {
            return;
        }

        if (this.isPickerDisplayed) {
            this.hidePicker();
        } else {
            this.showPicker();
        }
    }

    protected onKeyDown(e: KeyboardEvent): void {
        switch (e.key) {
            case KeyCode.UP:
            case KeyCode.DOWN:
            case KeyCode.ENTER:
            case KeyCode.SPACE:
                e.preventDefault();
                this.onLabelOrWrapperMouseDown();
                break;
            case KeyCode.ESCAPE:
                if (this.isPickerDisplayed) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.hideCurrentPicker) {
                        this.hideCurrentPicker();
                    }
                }
                break;
        }
    }

    public showPicker() {
        this.isPickerDisplayed = true;

        if (!this.pickerComponent) {
            this.pickerComponent = this.createPickerComponent();
        }

        const pickerGui = this.pickerComponent.getGui();
        pickerGui.addEventListener('focusin', this.onPickerFocusIn);
        pickerGui.addEventListener('focusout', this.onPickerFocusOut);

        this.hideCurrentPicker = this.renderAndPositionPicker();

        this.toggleExpandedStyles(true);
    }

    protected renderAndPositionPicker(): () => void {
        const ePicker = this.pickerComponent!.getGui();

        if (!this.gos.get('suppressScrollWhenPopupsAreOpen')) {
            [this.destroyMouseWheelFunc] = this.addManagedEventListeners({
                bodyScroll: () => {
                    this.hidePicker();
                },
            });
        }

        const translate = this.getLocaleTextFunc();

        const {
            config: { pickerAriaLabelKey, pickerAriaLabelValue, modalPicker = true },
            maxPickerHeight,
            minPickerWidth,
            maxPickerWidth,
            variableWidth,
            beans,
            eWrapper,
        } = this;

        const popupParams: AddPopupParams = {
            modal: modalPicker,
            eChild: ePicker,
            closeOnEsc: true,
            closedCallback: () => {
                const shouldRestoreFocus = _isNothingFocused(beans);
                this.beforeHidePicker();

                if (shouldRestoreFocus && this.isAlive()) {
                    this.getFocusableElement().focus();
                }
            },
            ariaLabel: translate(pickerAriaLabelKey, pickerAriaLabelValue),
            anchorToElement: eWrapper,
        };

        // need to set position before adding to the dom
        ePicker.style.position = 'absolute';
        const popupSvc = beans.popupSvc!;
        const addPopupRes = popupSvc.addPopup(popupParams);

        if (variableWidth) {
            if (minPickerWidth) {
                ePicker.style.minWidth = minPickerWidth;
            }
            ePicker.style.width = _formatSize(_getAbsoluteWidth(eWrapper));
            if (maxPickerWidth) {
                ePicker.style.maxWidth = maxPickerWidth;
            }
        } else {
            _setElementWidth(ePicker, maxPickerWidth ?? _getAbsoluteWidth(eWrapper));
        }

        const maxHeight = maxPickerHeight ?? `${_getInnerHeight(popupSvc.getPopupParent())}px`;

        ePicker.style.setProperty('max-height', maxHeight);

        this.alignPickerToComponent();

        return addPopupRes.hideFunc;
    }

    protected alignPickerToComponent(): void {
        if (!this.pickerComponent) {
            return;
        }

        const {
            pickerGap,
            config: { pickerType },
            beans: { popupSvc, gos },
            eWrapper,
            pickerComponent,
        } = this;

        const alignSide = gos.get('enableRtl') ? 'right' : 'left';

        popupSvc!.positionPopupByComponent({
            type: pickerType,
            eventSource: eWrapper,
            ePopup: pickerComponent.getGui(),
            position: 'under',
            alignSide,
            keepWithinBounds: true,
            nudgeY: pickerGap,
        });
    }

    protected beforeHidePicker(): void {
        if (this.destroyMouseWheelFunc) {
            this.destroyMouseWheelFunc();
            this.destroyMouseWheelFunc = undefined;
        }

        this.toggleExpandedStyles(false);

        const pickerGui = this.pickerComponent!.getGui();

        pickerGui.removeEventListener('focusin', this.onPickerFocusIn);
        pickerGui.removeEventListener('focusout', this.onPickerFocusOut);

        this.isPickerDisplayed = false;
        this.pickerComponent = undefined;
        this.hideCurrentPicker = null;
    }

    protected toggleExpandedStyles(expanded: boolean): void {
        if (!this.isAlive()) {
            return;
        }

        const ariaEl = this.getAriaElement();

        _setAriaExpanded(ariaEl, expanded);

        const classList = this.eWrapper.classList;
        classList.toggle('ag-picker-expanded', expanded);
        classList.toggle('ag-picker-collapsed', !expanded);
    }

    private onPickerFocusIn(): void {
        this.togglePickerHasFocus(true);
    }

    private onPickerFocusOut(e: FocusEvent): void {
        if (!this.pickerComponent?.getGui().contains(e.relatedTarget as Element)) {
            this.togglePickerHasFocus(false);
        }
    }

    private togglePickerHasFocus(focused: boolean): void {
        if (!this.pickerComponent) {
            return;
        }

        this.eWrapper.classList.toggle('ag-picker-has-focus', focused);
    }

    public hidePicker(): void {
        this.hideCurrentPicker?.();
    }

    public setInputWidth(width: number | 'flex'): this {
        _setElementWidth(this.eWrapper, width);
        return this;
    }

    public override getFocusableElement(): HTMLElement {
        return this.eWrapper;
    }

    public setPickerGap(gap: number): this {
        this.pickerGap = gap;

        return this;
    }

    public setPickerMinWidth(width?: number | string): this {
        if (typeof width === 'number') {
            width = `${width}px`;
        }
        this.minPickerWidth = width == null ? undefined : width;
        return this;
    }

    public setPickerMaxWidth(width?: number | string): this {
        if (typeof width === 'number') {
            width = `${width}px`;
        }
        this.maxPickerWidth = width == null ? undefined : width;
        return this;
    }

    public setPickerMaxHeight(height?: number | string): this {
        if (typeof height === 'number') {
            height = `${height}px`;
        }

        this.maxPickerHeight = height == null ? undefined : height;
        return this;
    }

    public override destroy(): void {
        this.hidePicker();
        super.destroy();
    }
}
