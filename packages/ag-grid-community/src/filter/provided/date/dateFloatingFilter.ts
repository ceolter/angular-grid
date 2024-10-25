import type { UserComponentFactory } from '../../../components/framework/userComponentFactory';
import type { BeanCollection, Context } from '../../../context/context';
import type { FilterChangedEvent } from '../../../events';
import type { IDateParams } from '../../../interfaces/dateComponent';
import type { WithoutGridCommon } from '../../../interfaces/iCommon';
import { _parseDateTimeFromString, _serialiseDate } from '../../../utils/date';
import { _setDisplayed } from '../../../utils/dom';
import { _debounce } from '../../../utils/function';
import type { AgInputTextField } from '../../../widgets/agInputTextField';
import { AgInputTextFieldSelector } from '../../../widgets/agInputTextField';
import { RefPlaceholder } from '../../../widgets/component';
import type { IFloatingFilterParams } from '../../floating/floatingFilter';
import { getDebounceMs } from '../../floating/provided/providedFilterUtils';
import { SimpleFloatingFilter } from '../../floating/provided/simpleFloatingFilter';
import type { ISimpleFilterModel } from '../iSimpleFilter';
import type { SimpleFilterModelFormatter } from '../simpleFilterModelFormatter';
import { DateCompWrapper } from './dateCompWrapper';
import type { DateFilter } from './dateFilter';
import { DEFAULT_DATE_FILTER_OPTIONS } from './dateFilterConstants';
import { DateFilterModelFormatter } from './dateFilterModelFormatter';
import type { DateFilterModel, DateFilterParams } from './iDateFilter';

export class DateFloatingFilter extends SimpleFloatingFilter {
    private userCompFactory: UserComponentFactory;
    private context: Context;

    public override wireBeans(beans: BeanCollection): void {
        super.wireBeans(beans);
        this.context = beans.context;
        this.userCompFactory = beans.userCompFactory;
    }

    private readonly eReadOnlyText: AgInputTextField = RefPlaceholder;
    private readonly eDateWrapper: HTMLInputElement = RefPlaceholder;

    private dateComp: DateCompWrapper;
    private params: IFloatingFilterParams<DateFilter>;
    private filterParams: DateFilterParams;
    private filterModelFormatter: DateFilterModelFormatter;

    constructor() {
        super(
            /* html */ `
            <div class="ag-floating-filter-input" role="presentation">
                <ag-input-text-field data-ref="eReadOnlyText"></ag-input-text-field>
                <div data-ref="eDateWrapper" style="display: flex;"></div>
            </div>`,
            [AgInputTextFieldSelector]
        );
    }

    protected getDefaultFilterOptions(): string[] {
        return DEFAULT_DATE_FILTER_OPTIONS;
    }

    public override init(params: IFloatingFilterParams<DateFilter>): void {
        super.init(params);
        this.params = params;
        this.filterParams = params.filterParams;

        this.createDateComponent();
        this.filterModelFormatter = new DateFilterModelFormatter(
            this.filterParams,
            this.getLocaleTextFunc.bind(this),
            this.optionsFactory
        );
        const translate = this.getLocaleTextFunc();
        this.eReadOnlyText.setDisabled(true).setInputAriaLabel(translate('ariaDateFilterInput', 'Date Filter Input'));
    }

    public override refresh(params: IFloatingFilterParams<DateFilter>): void {
        super.refresh(params);
        this.params = params;
        this.filterParams = params.filterParams;

        this.updateDateComponent();
        this.filterModelFormatter.updateParams({
            optionsFactory: this.optionsFactory,
            dateFilterParams: this.filterParams,
        });
        this.updateCompOnModelChange(params.currentParentModel());
    }

    private updateCompOnModelChange(model: any): void {
        // Update the read-only text field
        const allowEditing = !this.isReadOnly() && this.canWeEditAfterModelFromParentFilter(model);
        this.setEditable(allowEditing);

        if (allowEditing) {
            if (model) {
                const dateModel = model as DateFilterModel;
                this.dateComp.setDate(_parseDateTimeFromString(dateModel.dateFrom));
            } else {
                this.dateComp.setDate(null);
            }

            this.eReadOnlyText.setValue('');
        } else {
            this.eReadOnlyText.setValue(this.filterModelFormatter.getModelAsString(model));
            this.dateComp.setDate(null);
        }
    }

    protected setEditable(editable: boolean): void {
        _setDisplayed(this.eDateWrapper, editable);
        _setDisplayed(this.eReadOnlyText.getGui(), !editable);
    }

    public onParentModelChanged(model: ISimpleFilterModel, event: FilterChangedEvent): void {
        // We don't want to update the floating filter if the floating filter caused the change,
        // because the UI is already in sync. if we didn't do this, the UI would behave strangely
        // as it would be updating as the user is typing.
        // This is similar for data changes, which don't affect provided date floating filters
        if (this.isEventFromFloatingFilter(event) || this.isEventFromDataChange(event)) {
            return;
        }

        super.setLastTypeFromModel(model);
        this.updateCompOnModelChange(model);
    }

    private onDateChanged(): void {
        const filterValueDate = this.dateComp.getDate();
        const filterValueText = _serialiseDate(filterValueDate);

        this.params.parentFilterInstance((filterInstance) => {
            if (filterInstance) {
                const date = _parseDateTimeFromString(filterValueText);
                filterInstance.onFloatingFilterChanged(this.getLastType() || null, date);
            }
        });
    }

    private getDateComponentParams(): WithoutGridCommon<IDateParams> {
        const debounceMs = getDebounceMs(this.params.filterParams, this.getDefaultDebounceMs());
        return {
            onDateChanged: _debounce(this, this.onDateChanged.bind(this), debounceMs),
            filterParams: this.params.column.getColDef().filterParams,
            location: 'floatingFilter',
        };
    }

    private createDateComponent(): void {
        this.dateComp = new DateCompWrapper(
            this.context,
            this.userCompFactory,
            this.getDateComponentParams(),
            this.eDateWrapper,
            (dateComp) => {
                dateComp.setInputAriaLabel(this.getAriaLabel(this.params));
            }
        );

        this.addDestroyFunc(() => this.dateComp.destroy());
    }

    private updateDateComponent(): void {
        const params = this.gos.addGridCommonParams(this.getDateComponentParams());
        this.dateComp.updateParams(params);
    }

    protected getFilterModelFormatter(): SimpleFilterModelFormatter {
        return this.filterModelFormatter;
    }
}
