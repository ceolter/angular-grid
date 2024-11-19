import type { FilterChangedEventSourceType } from '../../events';
import type { ContainerType, IAfterGuiAttachedParams } from '../../interfaces/iAfterGuiAttachedParams';
import type { IDoesFilterPassParams, IFilterComp } from '../../interfaces/iFilter';
import type { PopupEventParams } from '../../interfaces/iPopup';
import type { IRowNode } from '../../interfaces/iRowNode';
import { PositionableFeature } from '../../rendering/features/positionableFeature';
import { _clearElement, _loadTemplate, _removeFromParent, _setDisabled } from '../../utils/dom';
import { _debounce } from '../../utils/function';
import { _jsonEquals } from '../../utils/generic';
import type { AgPromise } from '../../utils/promise';
import { _warn } from '../../validation/logging';
import type { ComponentSelector } from '../../widgets/component';
import { Component, RefPlaceholder } from '../../widgets/component';
import { ManagedFocusFeature } from '../../widgets/managedFocusFeature';
import { FILTER_LOCALE_TEXT } from '../filterLocaleText';
import { getDebounceMs, isUseApplyButton } from '../floating/provided/providedFilterUtils';
import type { IProvidedFilter, ProvidedFilterParams } from './iProvidedFilter';

/**
 * Contains common logic to all provided filters (apply button, clear button, etc).
 * All the filters that come with AG Grid extend this class. User filters do not
 * extend this class.
 *
 * @param M type of filter-model managed by the concrete sub-class that extends this type
 * @param V type of value managed by the concrete sub-class that extends this type
 */
export abstract class ProvidedFilter<M, V> extends Component implements IProvidedFilter, IFilterComp {
    // each level in the hierarchy will save params with the appropriate type for that level.
    private params: ProvidedFilterParams;

    protected applyActive = false;
    private hidePopup: ((params: PopupEventParams) => void) | null | undefined = null;
    // a debounce of the onBtApply method
    private onBtApplyDebounce: () => void;
    private debouncePending = false;

    // after the user hits 'apply' the model gets copied to here. this is then the model that we use for
    // all filtering. so if user changes UI but doesn't hit apply, then the UI will be out of sync with this model.
    // this is what we want, as the UI should only become the 'active' filter once it's applied. when apply is
    // inactive, this model will be in sync (following the debounce ms). if the UI is not a valid filter
    // (eg the value is missing so nothing to filter on, or for set filter all checkboxes are checked so filter
    // not active) then this appliedModel will be null/undefined.
    private appliedModel: M | null = null;

    private positionableFeature: PositionableFeature | undefined;

    protected readonly eFilterBody: HTMLElement = RefPlaceholder;

    private eButtonsPanel: HTMLElement;
    private buttonListeners: (() => null)[] = [];

    constructor(private readonly filterNameKey: keyof typeof FILTER_LOCALE_TEXT) {
        super();
    }

    public abstract doesFilterPass(params: IDoesFilterPassParams): boolean;

    protected abstract updateUiVisibility(): void;

    protected abstract createBodyTemplate(): string;
    protected abstract getAgComponents(): ComponentSelector[];
    protected abstract getCssIdentifier(): string;
    protected abstract resetUiToDefaults(silent?: boolean): AgPromise<void>;

    protected abstract setModelIntoUi(model: M): AgPromise<void>;
    protected abstract areModelsEqual(a: M, b: M): boolean;

    /** Used to get the filter type for filter models. */
    protected abstract filterType: string;

    public postConstruct(): void {
        this.resetTemplate(); // do this first to create the DOM
        this.createManagedBean(
            new ManagedFocusFeature(this.getFocusableElement(), {
                handleKeyDown: this.handleKeyDown.bind(this),
            })
        );

        this.positionableFeature = new PositionableFeature(this.getPositionableElement(), {
            forcePopupParentAsOffsetParent: true,
        });

        this.createBean(this.positionableFeature);
    }

    // override
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected handleKeyDown(e: KeyboardEvent): void {}

    public abstract getModelFromUi(): M | null;

    public getFilterTitle(): string {
        return this.translate(this.filterNameKey);
    }

    public isFilterActive(): boolean {
        // filter is active if we have a valid applied model
        return !!this.appliedModel;
    }

    protected resetTemplate(paramsMap?: any) {
        let eGui = this.getGui();

        if (eGui) {
            eGui.removeEventListener('submit', this.onFormSubmit);
        }
        const templateString = /* html */ `
            <form class="ag-filter-wrapper">
                <div class="ag-filter-body-wrapper ag-${this.getCssIdentifier()}-body-wrapper" data-ref="eFilterBody">
                    ${this.createBodyTemplate()}
                </div>
            </form>`;

        this.setTemplate(templateString, this.getAgComponents(), paramsMap);

        eGui = this.getGui();
        eGui?.addEventListener('submit', this.onFormSubmit);
    }

    protected isReadOnly(): boolean {
        return !!this.params.readOnly;
    }

    public init(params: ProvidedFilterParams): void {
        this.setParams(params);

        this.resetUiToDefaults(true).then(() => {
            this.updateUiVisibility();
            this.setupOnBtApplyDebounce();
        });
    }

    protected setParams(params: ProvidedFilterParams): void {
        this.params = params;
        this.applyActive = isUseApplyButton(params);

        this.resetButtonsPanel(params);
    }

    protected updateParams(params: ProvidedFilterParams): void {
        this.params = params;
        this.applyActive = isUseApplyButton(params);

        this.resetUiToActiveModel(this.getModel(), () => {
            this.updateUiVisibility();
            this.setupOnBtApplyDebounce();
        });
    }

    private resetButtonsPanel(newParams: ProvidedFilterParams, oldParams?: ProvidedFilterParams): void {
        const { buttons: oldButtons, readOnly: oldReadOnly } = oldParams ?? {};
        const { buttons, readOnly } = newParams;
        if (oldReadOnly === readOnly && _jsonEquals(oldButtons, buttons)) {
            return;
        }

        const hasButtons = buttons && buttons.length > 0 && !this.isReadOnly();

        if (!this.eButtonsPanel) {
            // Only create the buttons panel if we need to
            if (hasButtons) {
                this.eButtonsPanel = document.createElement('div');
                this.eButtonsPanel.classList.add('ag-filter-apply-panel');
            }
        } else {
            // Always empty the buttons panel before adding new buttons
            _clearElement(this.eButtonsPanel);
            this.buttonListeners.forEach((destroyFunc) => destroyFunc());
            this.buttonListeners = [];
        }

        if (!hasButtons) {
            // The case when we need to hide the buttons panel because there are no buttons
            if (this.eButtonsPanel) {
                _removeFromParent(this.eButtonsPanel);
            }

            return;
        }

        // At this point we know we have a buttons and a buttons panel has been created.

        // Instead of appending each button to the DOM individually, we create a fragment and append that
        // to the DOM once. This is much faster than appending each button individually.
        const fragment = document.createDocumentFragment();

        const addButton = (type: 'apply' | 'clear' | 'reset' | 'cancel'): void => {
            let clickListener: (e?: Event) => void;
            const text = type ? this.translate(`${type}Filter`) : undefined;
            switch (type) {
                case 'apply':
                    clickListener = (e) => this.onBtApply(false, false, e);
                    break;
                case 'clear':
                    clickListener = () => this.onBtClear();
                    break;
                case 'reset':
                    clickListener = () => this.onBtReset();
                    break;
                case 'cancel':
                    clickListener = (e) => {
                        this.onBtCancel(e!);
                    };
                    break;
                default:
                    _warn(75);
                    return;
            }

            const buttonType = type === 'apply' ? 'submit' : 'button';
            const button = _loadTemplate(
                /* html */
                `<button
                    type="${buttonType}"
                    data-ref="${type}FilterButton"
                    class="ag-button ag-standard-button ag-filter-apply-panel-button"
                >${text}
                </button>`
            );

            this.buttonListeners.push(...this.addManagedElementListeners(button, { click: clickListener }));
            fragment.append(button);
        };

        buttons.forEach((type) => addButton(type));

        this.eButtonsPanel.append(fragment);
        this.getGui().appendChild(this.eButtonsPanel);
    }

    // subclasses can override this to provide alternative debounce defaults
    protected defaultDebounceMs: number = 0;

    private setupOnBtApplyDebounce(): void {
        const debounceMs = getDebounceMs(this.params, this.defaultDebounceMs);
        const debounceFunc = _debounce(this, this.checkApplyDebounce.bind(this), debounceMs);
        this.onBtApplyDebounce = () => {
            this.debouncePending = true;
            debounceFunc();
        };
    }

    private checkApplyDebounce(): void {
        if (this.debouncePending) {
            // May already have been applied, so don't apply again (e.g. closing filter before debounce timeout)
            this.debouncePending = false;
            this.onBtApply();
        }
    }

    public getModel(): M | null {
        return this.appliedModel ?? null;
    }

    public setModel(model: M | null): AgPromise<void> {
        const promise = model != null ? this.setModelIntoUi(model) : this.resetUiToDefaults();

        return promise.then(() => {
            this.updateUiVisibility();

            // we set the model from the GUI, rather than the provided model,
            // so the model is consistent, e.g. handling of null/undefined will be the same,
            // or if model is case-insensitive, then casing is removed.
            this.applyModel('api');
        });
    }

    private onBtCancel(e: Event): void {
        this.resetUiToActiveModel(this.getModel(), () => {
            this.handleCancelEnd(e);
        });
    }

    protected handleCancelEnd(e: Event): void {
        if (this.params.closeOnApply) {
            this.close(e);
        }
    }

    protected resetUiToActiveModel(currentModel: M | null, afterUiUpdatedFunc?: () => void): void {
        const afterAppliedFunc = () => {
            this.onUiChanged(false, 'prevent');

            afterUiUpdatedFunc?.();
        };

        if (currentModel != null) {
            this.setModelIntoUi(currentModel).then(afterAppliedFunc);
        } else {
            this.resetUiToDefaults().then(afterAppliedFunc);
        }
    }

    private onBtClear(): void {
        this.resetUiToDefaults().then(() => this.onUiChanged());
    }

    private onBtReset(): void {
        this.onBtClear();
        this.onBtApply();
    }

    /**
     * Applies changes made in the UI to the filter, and returns true if the model has changed.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public applyModel(source: 'api' | 'ui' | 'rowDataUpdated' = 'api'): boolean {
        const newModel = this.getModelFromUi();

        if (!this.isModelValid(newModel!)) {
            return false;
        }

        const previousModel = this.appliedModel;

        this.appliedModel = newModel;

        // models can be same if user pasted same content into text field, or maybe just changed the case
        // and it's a case insensitive filter
        return !this.areModelsEqual(previousModel!, newModel!);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected isModelValid(model: M): boolean {
        return true;
    }

    private onFormSubmit(e: Event): void {
        e.preventDefault();
    }

    protected onBtApply(afterFloatingFilter = false, afterDataChange = false, e?: Event): void {
        // Prevent form submission
        if (e) {
            e.preventDefault();
        }
        if (this.applyModel(afterDataChange ? 'rowDataUpdated' : 'ui')) {
            // the floating filter uses 'afterFloatingFilter' info, so it doesn't refresh after filter changed if change
            // came from floating filter
            const source: FilterChangedEventSourceType = 'columnFilter';
            this.params.filterChangedCallback({ afterFloatingFilter, afterDataChange, source });
        }

        const { closeOnApply } = this.params;

        // only close if an apply button is visible, otherwise we'd be closing every time a change was made!
        if (closeOnApply && this.applyActive && !afterFloatingFilter && !afterDataChange) {
            this.close(e);
        }
    }

    public onNewRowsLoaded(): void {}

    public close(e?: Event): void {
        if (!this.hidePopup) {
            return;
        }

        const keyboardEvent = e as KeyboardEvent;
        const key = keyboardEvent && keyboardEvent.key;
        let params: PopupEventParams;

        if (key === 'Enter' || key === 'Space') {
            params = { keyboardEvent };
        }

        this.hidePopup(params!);
        this.hidePopup = null;
    }

    /**
     * By default, if the change came from a floating filter it will be applied immediately, otherwise if there is no
     * apply button it will be applied after a debounce, otherwise it will not be applied at all. This behaviour can
     * be adjusted by using the apply parameter.
     */
    protected onUiChanged(fromFloatingFilter = false, apply?: 'immediately' | 'debounce' | 'prevent'): void {
        this.updateUiVisibility();
        this.params.filterModifiedCallback();

        if (this.applyActive && !this.isReadOnly()) {
            const isValid = this.isModelValid(this.getModelFromUi()!);
            const applyFilterButton = this.queryForHtmlElement(`[data-ref="applyFilterButton"]`);
            if (applyFilterButton) {
                _setDisabled(applyFilterButton, !isValid);
            }
        }

        if ((fromFloatingFilter && !apply) || apply === 'immediately') {
            this.onBtApply(fromFloatingFilter);
        } else if ((!this.applyActive && !apply) || apply === 'debounce') {
            this.onBtApplyDebounce();
        }
    }

    public afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        if (params) {
            this.hidePopup = params.hidePopup;
        }

        this.refreshFilterResizer(params?.container);
    }

    private refreshFilterResizer(containerType?: ContainerType): void {
        // tool panel is scrollable, so don't need to size
        const { positionableFeature, gos } = this;
        if (!positionableFeature || containerType === 'toolPanel') {
            return;
        }

        const isResizable = containerType === 'floatingFilter' || containerType === 'columnFilter';

        if (isResizable) {
            positionableFeature.restoreLastSize();
            positionableFeature.setResizable(
                gos.get('enableRtl')
                    ? { bottom: true, bottomLeft: true, left: true }
                    : { bottom: true, bottomRight: true, right: true }
            );
        } else {
            positionableFeature.removeSizeFromEl();
            positionableFeature.setResizable(false);
        }
        positionableFeature.constrainSizeToAvailableHeight(true);
    }

    public afterGuiDetached(): void {
        this.checkApplyDebounce();

        this.positionableFeature?.constrainSizeToAvailableHeight(false);
    }

    public refresh(newParams: ProvidedFilterParams): boolean {
        const oldParams = this.params;
        this.params = newParams;

        this.resetButtonsPanel(newParams, oldParams);

        return true;
    }

    public override destroy(): void {
        const eGui = this.getGui();

        if (eGui) {
            eGui.removeEventListener('submit', this.onFormSubmit);
        }
        this.hidePopup = null;

        if (this.positionableFeature) {
            this.positionableFeature = this.destroyBean(this.positionableFeature);
        }

        this.appliedModel = null;

        super.destroy();
    }

    protected translate(key: keyof typeof FILTER_LOCALE_TEXT): string {
        return this.getLocaleTextFunc()(key, FILTER_LOCALE_TEXT[key]);
    }

    protected getCellValue(rowNode: IRowNode): V | null | undefined {
        return this.params.getValue(rowNode);
    }

    // override to control positionable feature
    protected getPositionableElement(): HTMLElement {
        return this.eFilterBody;
    }
}
