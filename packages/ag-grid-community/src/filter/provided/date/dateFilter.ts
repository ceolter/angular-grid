import type { UserComponentFactory } from '../../../components/framework/userComponentFactory';
import type { BeanCollection, Context } from '../../../context/context';
import { _getDocument } from '../../../gridOptionsUtils';
import type { IAfterGuiAttachedParams } from '../../../interfaces/iAfterGuiAttachedParams';
import { _parseDateTimeFromString, _serialiseDate } from '../../../utils/date';
import { _warn } from '../../../validation/logging';
import type { FILTER_LOCALE_TEXT } from '../../filterLocaleText';
import type { Comparator } from '../iScalarFilter';
import type { ISimpleFilterModel, Tuple } from '../iSimpleFilter';
import { ScalarFilter } from '../scalarFilter';
import { DateCompWrapper } from './dateCompWrapper';
import { DEFAULT_DATE_FILTER_OPTIONS } from './dateFilterConstants';
import { DateFilterModelFormatter } from './dateFilterModelFormatter';
import type { DateFilterModel, DateFilterParams } from './iDateFilter';

const DEFAULT_MIN_YEAR = 1000;
const DEFAULT_MAX_YEAR = Infinity;

export class DateFilter extends ScalarFilter<DateFilterModel, Date, DateCompWrapper> {
    private userCompFactory: UserComponentFactory;
    private context: Context;

    public override wireBeans(beans: BeanCollection): void {
        super.wireBeans(beans);
        this.context = beans.context;
        this.userCompFactory = beans.userCompFactory;
    }

    private readonly eConditionPanelsFrom: HTMLElement[] = [];
    private readonly eConditionPanelsTo: HTMLElement[] = [];

    private readonly dateConditionFromComps: DateCompWrapper[] = [];
    private readonly dateConditionToComps: DateCompWrapper[] = [];

    private dateFilterParams: DateFilterParams;
    private minValidYear: number = DEFAULT_MIN_YEAR;
    private maxValidYear: number = DEFAULT_MAX_YEAR;
    private minValidDate: Date | null = null;
    private maxValidDate: Date | null = null;
    private filterModelFormatter: DateFilterModelFormatter;

    constructor() {
        super('dateFilter');
    }

    public override afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        super.afterGuiAttached(params);

        this.dateConditionFromComps[0].afterGuiAttached(params);
    }

    protected mapValuesFromModel(filterModel: DateFilterModel | null): Tuple<Date> {
        // unlike the other filters, we do two things here:
        // 1) allow for different attribute names (same as done for other filters) (eg the 'from' and 'to'
        //    are in different locations in Date and Number filter models)
        // 2) convert the type (because Date filter uses Dates, however model is 'string')
        //
        // NOTE: The conversion of string to date also removes the timezone - i.e. when user picks
        //       a date from the UI, it will have timezone info in it. This is lost when creating
        //       the model. When we recreate the date again here, it's without a timezone.
        const { dateFrom, dateTo, type } = filterModel || {};
        return [
            (dateFrom && _parseDateTimeFromString(dateFrom)) || null,
            (dateTo && _parseDateTimeFromString(dateTo)) || null,
        ].slice(0, this.getNumberOfInputs(type));
    }

    protected comparator(): Comparator<Date> {
        return this.dateFilterParams.comparator ? this.dateFilterParams.comparator : this.defaultComparator.bind(this);
    }

    private defaultComparator(filterDate: Date, cellValue: any): number {
        // The default comparator assumes that the cellValue is a date
        const cellAsDate = cellValue as Date;

        if (cellValue == null || cellAsDate < filterDate) {
            return -1;
        }
        if (cellAsDate > filterDate) {
            return 1;
        }

        return 0;
    }

    protected override setParams(params: DateFilterParams): void {
        this.dateFilterParams = params;

        super.setParams(params);

        const yearParser = (param: keyof DateFilterParams, fallback: number) => {
            if (params[param] != null) {
                if (!isNaN(params[param])) {
                    return params[param] == null ? fallback : Number(params[param]);
                } else {
                    _warn(82, { param });
                }
            }

            return fallback;
        };

        this.minValidYear = yearParser('minValidYear', DEFAULT_MIN_YEAR);
        this.maxValidYear = yearParser('maxValidYear', DEFAULT_MAX_YEAR);

        if (this.minValidYear > this.maxValidYear) {
            _warn(83);
        }

        if (params.minValidDate) {
            this.minValidDate =
                params.minValidDate instanceof Date
                    ? params.minValidDate
                    : _parseDateTimeFromString(params.minValidDate);
        } else {
            this.minValidDate = null;
        }

        if (params.maxValidDate) {
            this.maxValidDate =
                params.maxValidDate instanceof Date
                    ? params.maxValidDate
                    : _parseDateTimeFromString(params.maxValidDate);
        } else {
            this.maxValidDate = null;
        }

        if (this.minValidDate && this.maxValidDate && this.minValidDate > this.maxValidDate) {
            _warn(84);
        }

        this.filterModelFormatter = new DateFilterModelFormatter(
            this.dateFilterParams,
            this.getLocaleTextFunc.bind(this),
            this.optionsFactory
        );
    }

    createDateCompWrapper(element: HTMLElement): DateCompWrapper {
        const dateCompWrapper = new DateCompWrapper(
            this.context,
            this.userCompFactory,
            {
                onDateChanged: () => this.onUiChanged(),
                filterParams: this.dateFilterParams,
                location: 'filter',
            },
            element
        );
        this.addDestroyFunc(() => dateCompWrapper.destroy());
        return dateCompWrapper;
    }

    protected override setElementValue(element: DateCompWrapper, value: Date | null): void {
        element.setDate(value);
    }

    protected override setElementDisplayed(element: DateCompWrapper, displayed: boolean): void {
        element.setDisplayed(displayed);
    }

    protected override setElementDisabled(element: DateCompWrapper, disabled: boolean): void {
        element.setDisabled(disabled);
    }

    protected getDefaultFilterOptions(): string[] {
        return DEFAULT_DATE_FILTER_OPTIONS;
    }

    protected createValueElement(): HTMLElement {
        const eDocument = _getDocument(this.gos);
        const eCondition = eDocument.createElement('div');
        eCondition.classList.add('ag-filter-body');

        this.createFromToElement(eCondition, this.eConditionPanelsFrom, this.dateConditionFromComps, 'from');
        this.createFromToElement(eCondition, this.eConditionPanelsTo, this.dateConditionToComps, 'to');

        return eCondition;
    }

    private createFromToElement(
        eCondition: HTMLElement,
        eConditionPanels: HTMLElement[],
        dateConditionComps: DateCompWrapper[],
        fromTo: string
    ): void {
        const eDocument = _getDocument(this.gos);
        const eConditionPanel = eDocument.createElement('div');
        eConditionPanel.classList.add(`ag-filter-${fromTo}`);
        eConditionPanel.classList.add(`ag-filter-date-${fromTo}`);
        eConditionPanels.push(eConditionPanel);
        eCondition.appendChild(eConditionPanel);
        dateConditionComps.push(this.createDateCompWrapper(eConditionPanel));
    }

    protected removeValueElements(startPosition: number, deleteCount?: number): void {
        this.removeDateComps(this.dateConditionFromComps, startPosition, deleteCount);
        this.removeDateComps(this.dateConditionToComps, startPosition, deleteCount);
        this.removeItems(this.eConditionPanelsFrom, startPosition, deleteCount);
        this.removeItems(this.eConditionPanelsTo, startPosition, deleteCount);
    }

    protected removeDateComps(components: DateCompWrapper[], startPosition: number, deleteCount?: number): void {
        const removedComponents = this.removeItems(components, startPosition, deleteCount);
        removedComponents.forEach((comp) => comp.destroy());
    }

    private isValidDateValue(value: Date | null): boolean {
        if (value === null) {
            return false;
        }

        if (this.minValidDate) {
            if (value < this.minValidDate) {
                return false;
            }
        } else {
            if (value.getUTCFullYear() < this.minValidYear) {
                return false;
            }
        }

        if (this.maxValidDate) {
            if (value > this.maxValidDate) {
                return false;
            }
        } else {
            if (value.getUTCFullYear() > this.maxValidYear) {
                return false;
            }
        }

        return true;
    }

    protected override isConditionUiComplete(position: number): boolean {
        if (!super.isConditionUiComplete(position)) {
            return false;
        }

        let valid = true;
        this.forEachInput((element, index, elPosition, numberOfInputs) => {
            if (elPosition !== position || !valid || index >= numberOfInputs) {
                return;
            }
            valid = valid && this.isValidDateValue(element.getDate());
        });

        return valid;
    }

    protected areSimpleModelsEqual(aSimple: DateFilterModel, bSimple: DateFilterModel): boolean {
        return (
            aSimple.dateFrom === bSimple.dateFrom && aSimple.dateTo === bSimple.dateTo && aSimple.type === bSimple.type
        );
    }

    protected getFilterType(): 'date' {
        return 'date';
    }

    protected createCondition(position: number): DateFilterModel {
        const type = this.getConditionType(position);
        const model: Partial<DateFilterModel> = {};

        const values = this.getValues(position);
        if (values.length > 0) {
            model.dateFrom = _serialiseDate(values[0]);
        }
        if (values.length > 1) {
            model.dateTo = _serialiseDate(values[1]);
        }

        return {
            dateFrom: null,
            dateTo: null,
            filterType: this.getFilterType(),
            type,
            ...model,
        };
    }

    protected override resetPlaceholder(): void {
        const globalTranslate = this.getLocaleTextFunc();
        const placeholder = this.translate('dateFormatOoo');
        const ariaLabel = globalTranslate('ariaFilterValue', 'Filter Value');

        this.forEachInput((element) => {
            element.setInputPlaceholder(placeholder);
            element.setInputAriaLabel(ariaLabel);
        });
    }

    protected getInputs(position: number): Tuple<DateCompWrapper> {
        if (position >= this.dateConditionFromComps.length) {
            return [null, null];
        }
        return [this.dateConditionFromComps[position], this.dateConditionToComps[position]];
    }

    protected getValues(position: number): Tuple<Date> {
        const result: Tuple<Date> = [];
        this.forEachPositionInput(position, (element, index, _elPosition, numberOfInputs) => {
            if (index < numberOfInputs) {
                result.push(element.getDate());
            }
        });

        return result;
    }

    protected override translate(key: keyof typeof FILTER_LOCALE_TEXT): string {
        if (key === 'lessThan') {
            return super.translate('before');
        }
        if (key === 'greaterThan') {
            return super.translate('after');
        }
        return super.translate(key);
    }

    public getModelAsString(model: ISimpleFilterModel): string {
        return this.filterModelFormatter.getModelAsString(model) ?? '';
    }
}
