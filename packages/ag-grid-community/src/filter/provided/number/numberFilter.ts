import { _setAriaRole } from '../../../utils/aria';
import { _makeNull } from '../../../utils/generic';
import { AgInputNumberField } from '../../../widgets/agInputNumberField';
import { AgInputTextField } from '../../../widgets/agInputTextField';
import type { Comparator } from '../iScalarFilter';
import type { ISimpleFilterModel, Tuple } from '../iSimpleFilter';
import { ScalarFilter } from '../scalarFilter';
import type { SimpleFilterModelFormatter } from '../simpleFilterModelFormatter';
import type { NumberFilterModel, NumberFilterParams } from './iNumberFilter';
import { DEFAULT_NUMBER_FILTER_OPTIONS } from './numberFilterConstants';
import { NumberFilterModelFormatter } from './numberFilterModelFormatter';
import { getAllowedCharPattern } from './numberFilterUtils';

export class NumberFilter extends ScalarFilter<NumberFilterModel, number> {
    private readonly eValuesFrom: (AgInputTextField | AgInputNumberField)[] = [];
    private readonly eValuesTo: (AgInputTextField | AgInputNumberField)[] = [];

    private numberFilterParams: NumberFilterParams;
    private filterModelFormatter: SimpleFilterModelFormatter;

    public readonly filterType = 'number' as const;

    constructor() {
        super('numberFilter');
    }

    override refresh(params: NumberFilterParams): boolean {
        if (this.numberFilterParams.allowedCharPattern !== params.allowedCharPattern) {
            return false;
        }

        return super.refresh(params);
    }

    protected mapValuesFromModel(filterModel: NumberFilterModel | null): Tuple<number> {
        const { filter, filterTo, type } = filterModel || {};
        return [this.processValue(filter), this.processValue(filterTo)].slice(0, this.getNumberOfInputs(type));
    }

    protected override defaultDebounceMs: number = 500;

    protected comparator(): Comparator<number> {
        return (left: number, right: number): number => {
            if (left === right) {
                return 0;
            }

            return left < right ? 1 : -1;
        };
    }

    protected override isValid(value: number): boolean {
        return !isNaN(value);
    }

    protected override setParams(params: NumberFilterParams): void {
        this.numberFilterParams = params;

        super.setParams(params);
        this.filterModelFormatter = new NumberFilterModelFormatter(
            this.getLocaleTextFunc.bind(this),
            this.optionsFactory,
            this.numberFilterParams.numberFormatter
        );
    }

    protected getDefaultFilterOptions(): string[] {
        return DEFAULT_NUMBER_FILTER_OPTIONS;
    }

    protected override setElementValue(
        element: AgInputTextField | AgInputNumberField,
        value: number | null,
        fromFloatingFilter?: boolean
    ): void {
        // values from floating filter are directly from the input, not from the model
        const { numberFormatter } = this.numberFilterParams;
        const valueToSet = !fromFloatingFilter && numberFormatter ? numberFormatter(value ?? null) : value;
        super.setElementValue(element, valueToSet as any);
    }

    protected createValueElement(): HTMLElement {
        const allowedCharPattern = getAllowedCharPattern(this.numberFilterParams);

        const eCondition = document.createElement('div');
        eCondition.classList.add('ag-filter-body');
        _setAriaRole(eCondition, 'presentation');

        this.createFromToElement(eCondition, this.eValuesFrom, 'from', allowedCharPattern);
        this.createFromToElement(eCondition, this.eValuesTo, 'to', allowedCharPattern);

        return eCondition;
    }

    private createFromToElement(
        eCondition: HTMLElement,
        eValues: (AgInputTextField | AgInputNumberField)[],
        fromTo: string,
        allowedCharPattern: string | null
    ): void {
        const eValue = this.createManagedBean(
            allowedCharPattern ? new AgInputTextField({ allowedCharPattern }) : new AgInputNumberField()
        );
        eValue.addCssClass(`ag-filter-${fromTo}`);
        eValue.addCssClass('ag-filter-filter');
        eValues.push(eValue);
        eCondition.appendChild(eValue.getGui());
    }

    protected removeValueElements(startPosition: number, deleteCount?: number): void {
        const removeComps = (eGui: (AgInputTextField | AgInputNumberField)[]) =>
            this.removeComponents(eGui, startPosition, deleteCount);

        removeComps(this.eValuesFrom);
        removeComps(this.eValuesTo);
    }

    protected getValues(position: number): Tuple<number> {
        const result: Tuple<number> = [];
        this.forEachPositionInput(position, (element, index, _elPosition, numberOfInputs) => {
            if (index < numberOfInputs) {
                result.push(this.processValue(this.stringToFloat(element.getValue())));
            }
        });

        return result;
    }

    protected areSimpleModelsEqual(aSimple: NumberFilterModel, bSimple: NumberFilterModel): boolean {
        return (
            aSimple.filter === bSimple.filter && aSimple.filterTo === bSimple.filterTo && aSimple.type === bSimple.type
        );
    }

    private processValue(value?: number | null): number | null {
        if (value == null) {
            return null;
        }
        return isNaN(value) ? null : value;
    }

    private stringToFloat(value?: string | number | null): number | null {
        if (typeof value === 'number') {
            return value;
        }

        let filterText = _makeNull(value);

        if (filterText != null && filterText.trim() === '') {
            filterText = null;
        }

        const numberParser = this.numberFilterParams.numberParser;
        if (numberParser) {
            return numberParser(filterText);
        }

        return filterText == null || filterText.trim() === '-' ? null : parseFloat(filterText);
    }

    protected createCondition(position: number): NumberFilterModel {
        const type = this.getConditionType(position);
        const model: NumberFilterModel = {
            filterType: this.filterType,
            type,
        };

        const values = this.getValues(position);
        if (values.length > 0) {
            model.filter = values[0];
        }
        if (values.length > 1) {
            model.filterTo = values[1];
        }

        return model;
    }

    protected getInputs(position: number): Tuple<AgInputTextField | AgInputNumberField> {
        const { eValuesFrom, eValuesTo } = this;
        if (position >= eValuesFrom.length) {
            return [null, null];
        }
        return [eValuesFrom[position], eValuesTo[position]];
    }

    public getModelAsString(model: ISimpleFilterModel): string {
        return this.filterModelFormatter.getModelAsString(model) ?? '';
    }

    protected override hasInvalidInputs(): boolean {
        let invalidInputs = false;
        this.forEachInput((element) => {
            if (!element.getInputElement().validity.valid) {
                invalidInputs = true;
                return;
            }
        });
        return invalidInputs;
    }
}
