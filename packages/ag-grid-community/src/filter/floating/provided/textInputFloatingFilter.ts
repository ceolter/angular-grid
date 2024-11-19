import { KeyCode } from '../../../constants/keyCode';
import type { FilterChangedEvent } from '../../../events';
import { _clearElement } from '../../../utils/dom';
import { _debounce } from '../../../utils/function';
import { RefPlaceholder } from '../../../widgets/component';
import type { NumberFilterModel } from '../../provided/number/iNumberFilter';
import type {
    ITextInputFloatingFilterParams,
    TextFilterModel,
    TextFilterParams,
} from '../../provided/text/iTextFilter';
import { trimInputForFilter } from '../../provided/text/textFilterUtils';
import type { FloatingFilterInputService } from './iFloatingFilterInputService';
import { getDebounceMs, isUseApplyButton } from './providedFilterUtils';
import { SimpleFloatingFilter } from './simpleFloatingFilter';

type ModelUnion = TextFilterModel | NumberFilterModel;
export abstract class TextInputFloatingFilter<M extends ModelUnion> extends SimpleFloatingFilter {
    private readonly eFloatingFilterInputContainer: HTMLElement = RefPlaceholder;
    private inputSvc: FloatingFilterInputService;

    protected params: ITextInputFloatingFilterParams;

    private applyActive: boolean;

    protected abstract createFloatingFilterInputService(
        params: ITextInputFloatingFilterParams
    ): FloatingFilterInputService;

    public postConstruct(): void {
        this.setTemplate(/* html */ `
            <div class="ag-floating-filter-input" role="presentation" data-ref="eFloatingFilterInputContainer"></div>
        `);
    }
    protected override defaultDebounceMs: number = 500;

    public onParentModelChanged(model: M, event: FilterChangedEvent): void {
        if (event?.afterFloatingFilter || event?.afterDataChange) {
            // if the floating filter triggered the change, it is already in sync.
            // Data changes also do not affect provided text floating filters
            return;
        }

        this.setLastTypeFromModel(model);
        this.setEditable(this.canWeEditAfterModelFromParentFilter(model));
        this.inputSvc.setValue(this.filterModelFormatter.getModelAsString(model));
    }

    public override init(params: ITextInputFloatingFilterParams): void {
        this.setupFloatingFilterInputService(params);
        super.init(params);
        this.setTextInputParams(params);
    }

    private setupFloatingFilterInputService(params: ITextInputFloatingFilterParams): void {
        this.inputSvc = this.createFloatingFilterInputService(params);
        this.inputSvc.setupGui(this.eFloatingFilterInputContainer);
    }

    private setTextInputParams(params: ITextInputFloatingFilterParams): void {
        this.params = params;

        const autoComplete = params.browserAutoComplete ?? false;
        const { inputSvc, defaultDebounceMs, readOnly } = this;

        inputSvc.setParams({
            ariaLabel: this.getAriaLabel(params),
            autoComplete,
        });

        this.applyActive = isUseApplyButton(params.filterParams);

        if (!readOnly) {
            const debounceMs = getDebounceMs(params.filterParams, defaultDebounceMs);
            const toDebounce: (e: KeyboardEvent) => void = _debounce(
                this,
                this.syncUpWithParentFilter.bind(this),
                debounceMs
            );

            inputSvc.setValueChangedListener(toDebounce);
        }
    }

    public override refresh(params: ITextInputFloatingFilterParams): void {
        super.refresh(params);
        this.setTextInputParams(params);
    }

    protected recreateFloatingFilterInputService(params: ITextInputFloatingFilterParams): void {
        const { inputSvc } = this;
        const value = inputSvc.getValue();
        _clearElement(this.eFloatingFilterInputContainer);
        this.destroyBean(inputSvc);
        this.setupFloatingFilterInputService(params);
        inputSvc.setValue(value, true);
    }

    private syncUpWithParentFilter(e: KeyboardEvent): void {
        const isEnterKey = e.key === KeyCode.ENTER;

        if (this.applyActive && !isEnterKey) {
            return;
        }

        const { inputSvc, params } = this;
        let value = inputSvc.getValue();

        if ((params.filterParams as TextFilterParams).trimInput) {
            value = trimInputForFilter(value);
            inputSvc.setValue(value, true); // ensure visible value is trimmed
        }

        params.parentFilterInstance((filterInstance) => {
            // NumberFilter is typed as number, but actually receives string values
            filterInstance?.onFloatingFilterChanged(this.lastType || null, (value as never) || null);
        });
    }

    protected setEditable(editable: boolean): void {
        this.inputSvc.setEditable(editable);
    }
}
