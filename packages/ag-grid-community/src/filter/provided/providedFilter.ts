import type { AgColumn } from '../../entities/agColumn';
import type { ContainerType, IAfterGuiAttachedParams } from '../../interfaces/iAfterGuiAttachedParams';
import type { IDoesFilterPassParams, IFilterComp, ProvidedFilterModel } from '../../interfaces/iFilter';
import type { PopupEventParams } from '../../interfaces/iPopup';
import { PositionableFeature } from '../../rendering/features/positionableFeature';
import { _clearElement, _loadTemplate, _removeFromParent, _setDisabled } from '../../utils/dom';
import { _debounce } from '../../utils/function';
import { _jsonEquals } from '../../utils/generic';
import { AgPromise } from '../../utils/promise';
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export abstract class ProvidedFilter<M extends ProvidedFilterModel, V, P extends ProvidedFilterParams<any, M>>
    extends Component
    implements IProvidedFilter, IFilterComp
{
    protected params: P;

    protected applyActive = false;
    private hidePopup: ((params: PopupEventParams) => void) | null | undefined = null;
    // a debounce of the onBtApply method
    private onBtApplyDebounce: () => void;
    private debouncePending = false;

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
    protected abstract setModelIntoUi(model: M | null, silent?: boolean): AgPromise<void>;
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

    public init(params: P): void {
        this.setParams(params);

        this.doSetModel(params.model, true).then(() => {
            this.setupOnBtApplyDebounce();
        });
    }

    public refresh(newParams: P): boolean {
        const oldParams = this.params;

        this.params = newParams;

        const source = newParams.source;

        if (source === 'ui') {
            // don't need to do anything
            return true;
        }

        const updateModel = () =>
            this.resetUiToActiveModel(newParams.model, () => {
                this.updateUiVisibility();
                this.setupOnBtApplyDebounce();
            });

        if (source === 'validation' || source === 'apiModel') {
            // just the model has changed
            updateModel();
            return true;
        }

        this.updateParams(newParams, oldParams).then(updateModel);

        return true;
    }

    protected setParams(params: P): void {
        this.params = params;
        this.commonUpdateParams(params);
    }

    protected updateParams(newParams: P, oldParams: P): AgPromise<void> {
        this.commonUpdateParams(newParams, oldParams);
        return AgPromise.resolve();
    }

    private commonUpdateParams(newParams: P, oldParams?: P): void {
        this.applyActive = isUseApplyButton(newParams);

        this.resetButtonsPanel(newParams, oldParams);
    }

    public getFilterTitle(): string {
        return this.translate(this.filterNameKey);
    }

    public isFilterActive(): boolean {
        return this.params.model != null;
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

    private resetButtonsPanel(newParams: P, oldParams?: P): void {
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
        return this.params.model;
    }

    public setModel(model: M | null): AgPromise<void> {
        const { beans, params } = this;
        return beans.colFilter!.setModelForColumnLegacy(params.column as AgColumn, model);
    }

    protected doSetModel(model: M | null, silent?: boolean): AgPromise<void> {
        const promise = this.setModelIntoUi(model ?? null, silent);

        return promise.then(() => {
            this.updateUiVisibility();

            // we set the model from the GUI, rather than the provided model,
            // so the model is consistent, e.g. handling of null/undefined will be the same,
            // or if model is case-insensitive, then casing is removed.
            this.doApplyModel('api');
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

        this.setModelIntoUi(currentModel ?? null).then(afterAppliedFunc);
    }

    private onBtClear(): void {
        this.setModelIntoUi(null).then(() => this.onUiChanged());
    }

    private onBtReset(): void {
        this.onBtClear();
        this.onBtApply();
    }

    /**
     * Applies changes made in the UI to the filter, and returns true if the model has changed.
     */
    public applyModel(source: 'api' | 'ui' | 'rowDataUpdated' = 'api'): boolean {
        return this.doApplyModel(source).changed;
    }

    protected doApplyModel(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        source: 'api' | 'ui' | 'rowDataUpdated' = 'api'
    ): { changed: boolean; model: M | null } {
        const newModel = this.getModelFromUi();

        if (!this.canApply(newModel!)) {
            return { changed: false, model: null };
        }

        const previousModel = this.params.model;

        // models can be same if user pasted same content into text field, or maybe just changed the case
        // and it's a case insensitive filter
        return { changed: !this.areModelsEqual(previousModel!, newModel!), model: newModel };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected canApply(model: M): boolean {
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
        const { changed, model } = this.doApplyModel(afterDataChange ? 'rowDataUpdated' : 'ui');

        if (changed) {
            // the floating filter uses 'afterFloatingFilter' info, so it doesn't refresh after filter changed if change
            // came from floating filter
            this.params.onModelChange(model, { afterFloatingFilter, afterDataChange });
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
            const isValid = this.canApply(this.getModelFromUi()!);
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

    public override destroy(): void {
        const eGui = this.getGui();

        if (eGui) {
            eGui.removeEventListener('submit', this.onFormSubmit);
        }
        this.hidePopup = null;

        if (this.positionableFeature) {
            this.positionableFeature = this.destroyBean(this.positionableFeature);
        }

        super.destroy();
    }

    protected translate(key: keyof typeof FILTER_LOCALE_TEXT): string {
        return this.getLocaleTextFunc()(key, FILTER_LOCALE_TEXT[key]);
    }

    // override to control positionable feature
    protected getPositionableElement(): HTMLElement {
        return this.eFilterBody;
    }
}
