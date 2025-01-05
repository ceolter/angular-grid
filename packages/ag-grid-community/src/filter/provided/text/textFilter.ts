import type { IDoesFilterPassParams } from '../../../interfaces/iFilter';
import { _setAriaRole } from '../../../utils/aria';
import { _makeNull } from '../../../utils/generic';
import { AgInputTextField } from '../../../widgets/agInputTextField';
import type { ISimpleFilterModel, ISimpleFilterModelType, Tuple } from '../iSimpleFilter';
import { SimpleFilter } from '../simpleFilter';
import { isBlank } from '../simpleFilterUtils';
import type { TextFilterModel, TextFilterParams, TextFormatter, TextMatcher } from './iTextFilter';
import { DEFAULT_TEXT_FILTER_OPTIONS } from './textFilterConstants';
import { TextFilterModelFormatter } from './textFilterModelFormatter';
import { trimInputForFilter } from './textFilterUtils';

export class TextFilter extends SimpleFilter<TextFilterModel, string> {
    public readonly filterType = 'text' as const;

    private readonly defaultFormatter: TextFormatter = (from: string) => from;

    private readonly defaultLowercaseFormatter: TextFormatter = (from: string) =>
        from == null ? null : from.toString().toLowerCase();

    private readonly defaultMatcher: TextMatcher = ({ filterOption, value, filterText }) => {
        if (filterText == null) {
            return false;
        }

        switch (filterOption) {
            case 'contains':
                return value.indexOf(filterText) >= 0;
            case 'notContains':
                return value.indexOf(filterText) < 0;
            case 'equals':
                return value === filterText;
            case 'notEqual':
                return value != filterText;
            case 'startsWith':
                return value.indexOf(filterText) === 0;
            case 'endsWith': {
                const index = value.lastIndexOf(filterText);
                return index >= 0 && index === value.length - filterText.length;
            }
            default:
                return false;
        }
    };

    private readonly eValuesFrom: AgInputTextField[] = [];
    private readonly eValuesTo: AgInputTextField[] = [];

    private matcher: TextMatcher;
    private formatter: TextFormatter;

    private textFilterParams: TextFilterParams;
    private filterModelFormatter: TextFilterModelFormatter;

    constructor() {
        super('textFilter');
    }

    protected override defaultDebounceMs: number = 500;

    protected override setParams(params: TextFilterParams): void {
        this.textFilterParams = params;

        super.setParams(params);

        this.matcher = params.textMatcher || this.defaultMatcher;
        this.formatter =
            params.textFormatter || (params.caseSensitive ? this.defaultFormatter : this.defaultLowercaseFormatter);
        this.filterModelFormatter = new TextFilterModelFormatter(
            this.getLocaleTextFunc.bind(this),
            this.optionsFactory
        );
    }

    protected createCondition(position: number): TextFilterModel {
        const type = this.getConditionType(position);

        const model: TextFilterModel = {
            filterType: this.filterType,
            type,
        };

        const values = this.getValuesWithSideEffects(position, true);
        if (values.length > 0) {
            model.filter = values[0];
        }
        if (values.length > 1) {
            model.filterTo = values[1];
        }

        return model;
    }

    protected areSimpleModelsEqual(aSimple: TextFilterModel, bSimple: TextFilterModel): boolean {
        return (
            aSimple.filter === bSimple.filter && aSimple.filterTo === bSimple.filterTo && aSimple.type === bSimple.type
        );
    }

    protected getInputs(position: number): Tuple<AgInputTextField> {
        const { eValuesFrom, eValuesTo } = this;
        if (position >= eValuesFrom.length) {
            return [null, null];
        }
        return [eValuesFrom[position], eValuesTo[position]];
    }

    protected getValues(position: number): Tuple<string> {
        return this.getValuesWithSideEffects(position, false);
    }

    private getValuesWithSideEffects(position: number, applySideEffects: boolean): Tuple<string> {
        const result: Tuple<string> = [];
        this.forEachPositionInput(position, (element, index, _elPosition, numberOfInputs) => {
            if (index < numberOfInputs) {
                let value = _makeNull(element.getValue());
                if (applySideEffects && this.textFilterParams.trimInput) {
                    value = trimInputForFilter(value) ?? null;
                    element.setValue(value, true); // ensure clean value is visible
                }
                result.push(value);
            }
        });

        return result;
    }

    protected getDefaultFilterOptions(): string[] {
        return DEFAULT_TEXT_FILTER_OPTIONS;
    }

    protected createValueElement(): HTMLElement {
        const eCondition = document.createElement('div');
        eCondition.classList.add('ag-filter-body');
        _setAriaRole(eCondition, 'presentation');

        this.createFromToElement(eCondition, this.eValuesFrom, 'from');
        this.createFromToElement(eCondition, this.eValuesTo, 'to');

        return eCondition;
    }

    private createFromToElement(eCondition: HTMLElement, eValues: AgInputTextField[], fromTo: string): void {
        const eValue = this.createManagedBean(new AgInputTextField());
        eValue.addCssClass(`ag-filter-${fromTo}`);
        eValue.addCssClass('ag-filter-filter');
        eValues.push(eValue);
        eCondition.appendChild(eValue.getGui());
    }

    protected removeValueElements(startPosition: number, deleteCount?: number): void {
        const removeComps = (eGui: AgInputTextField[]) => this.removeComponents(eGui, startPosition, deleteCount);
        removeComps(this.eValuesFrom);
        removeComps(this.eValuesTo);
    }

    protected mapValuesFromModel(filterModel: TextFilterModel | null): Tuple<string> {
        const { filter, filterTo, type } = filterModel || {};
        return [filter || null, filterTo || null].slice(0, this.getNumberOfInputs(type));
    }

    protected evaluateNullValue(filterType: ISimpleFilterModelType | null) {
        const filterTypesAllowNulls: ISimpleFilterModelType[] = ['notEqual', 'notContains', 'blank'];

        return filterType ? filterTypesAllowNulls.indexOf(filterType) >= 0 : false;
    }

    protected evaluateNonNullValue(
        values: Tuple<string>,
        cellValue: string,
        filterModel: TextFilterModel,
        params: IDoesFilterPassParams
    ): boolean {
        const formattedValues = values.map((v) => this.formatter(v)) || [];
        const cellValueFormatted = this.formatter(cellValue);
        const { api, colDef, column, context, textFormatter } = this.textFilterParams;

        if (filterModel.type === 'blank') {
            return isBlank(cellValue);
        } else if (filterModel.type === 'notBlank') {
            return !isBlank(cellValue);
        }

        const matcherParams = {
            api,
            colDef,
            column,
            context,
            node: params.node,
            data: params.data,
            filterOption: filterModel.type,
            value: cellValueFormatted,
            textFormatter,
        };

        return formattedValues.some((v) => this.matcher({ ...matcherParams, filterText: v }));
    }

    public getModelAsString(model: ISimpleFilterModel): string {
        return this.filterModelFormatter.getModelAsString(model) ?? '';
    }
}
