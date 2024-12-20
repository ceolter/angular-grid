import { _getDocument } from '../../../gridOptionsUtils';
import type { IAfterGuiAttachedParams } from '../../../interfaces/iAfterGuiAttachedParams';
import { _parseDateTimeFromString, _serialiseDate } from '../../../utils/date';
import { _warn } from '../../../validation/logging';
import type { FILTER_LOCALE_TEXT } from '../../filterLocaleText';
import type { ISimpleFilterModel, Tuple } from '../iSimpleFilter';
import { SimpleFilter } from '../simpleFilter';
import { removeItems } from '../simpleFilterUtils';
import { DateCompWrapper } from './dateCompWrapper';
import { DateFilterHelper } from './dateFilterHelper';
import { DateFilterModelFormatter } from './dateFilterModelFormatter';
import type { DateFilterModel, DateFilterParams } from './iDateFilter';

const DEFAULT_MIN_YEAR = 1000;
const DEFAULT_MAX_YEAR = Infinity;

export class DateFilter extends SimpleFilter<DateFilterModel, Date, DateFilterParams, DateCompWrapper> {
    private readonly eConditionPanelsFrom: HTMLElement[] = [];
    private readonly eConditionPanelsTo: HTMLElement[] = [];

    private readonly dateConditionFromComps: DateCompWrapper[] = [];
    private readonly dateConditionToComps: DateCompWrapper[] = [];

    private minValidYear: number = DEFAULT_MIN_YEAR;
    private maxValidYear: number = DEFAULT_MAX_YEAR;
    private minValidDate: Date | null = null;
    private maxValidDate: Date | null = null;
    private filterModelFormatter: DateFilterModelFormatter;

    protected filterType = 'date' as const;

    constructor() {
        super('dateFilter', new DateFilterHelper());
    }

    public override afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        super.afterGuiAttached(params);

        this.dateConditionFromComps[0].afterGuiAttached(params);
    }

    protected override setParams(params: DateFilterParams): void {
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

        this.minValidDate = params.minValidDate
            ? params.minValidDate instanceof Date
                ? params.minValidDate
                : _parseDateTimeFromString(params.minValidDate)
            : null;

        this.maxValidDate = params.maxValidDate
            ? params.maxValidDate instanceof Date
                ? params.maxValidDate
                : _parseDateTimeFromString(params.maxValidDate)
            : null;

        if (this.minValidDate && this.maxValidDate && this.minValidDate > this.maxValidDate) {
            _warn(84);
        }

        this.filterModelFormatter = new DateFilterModelFormatter(
            this.params,
            this.getLocaleTextFunc.bind(this),
            this.optionsFactory
        );
    }

    createDateCompWrapper(element: HTMLElement): DateCompWrapper {
        const { userCompFactory, context } = this.beans;
        const dateCompWrapper = new DateCompWrapper(
            context,
            userCompFactory,
            {
                onDateChanged: () => this.onUiChanged(),
                filterParams: this.params,
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

    protected createValueElement(): HTMLElement {
        const eDocument = _getDocument(this.beans);
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
        const eDocument = _getDocument(this.beans);
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
        removeItems(this.eConditionPanelsFrom, startPosition, deleteCount);
        removeItems(this.eConditionPanelsTo, startPosition, deleteCount);
    }

    protected removeDateComps(components: DateCompWrapper[], startPosition: number, deleteCount?: number): void {
        const removedComponents = removeItems(components, startPosition, deleteCount);
        removedComponents.forEach((comp) => comp.destroy());
    }

    private isValidDateValue(value: Date | null): boolean {
        if (value === null) {
            return false;
        }

        const { minValidDate, maxValidDate, minValidYear, maxValidYear } = this;

        if (minValidDate) {
            if (value < minValidDate) {
                return false;
            }
        } else {
            if (value.getUTCFullYear() < minValidYear) {
                return false;
            }
        }

        if (maxValidDate) {
            if (value > maxValidDate) {
                return false;
            }
        } else {
            if (value.getUTCFullYear() > maxValidYear) {
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
            filterType: this.filterType,
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
        const { dateConditionFromComps, dateConditionToComps } = this;
        if (position >= dateConditionFromComps.length) {
            return [null, null];
        }
        return [dateConditionFromComps[position], dateConditionToComps[position]];
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
