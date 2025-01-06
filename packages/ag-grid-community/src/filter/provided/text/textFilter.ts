import { _setAriaRole } from '../../../utils/aria';
import { _makeNull } from '../../../utils/generic';
import { AgInputTextField } from '../../../widgets/agInputTextField';
import type { ISimpleFilterModel, Tuple } from '../iSimpleFilter';
import { SimpleFilter } from '../simpleFilter';
import type { TextFilterModel, TextFilterParams } from './iTextFilter';
import { TextFilterHelper } from './textFilterHelper';
import { TextFilterModelFormatter } from './textFilterModelFormatter';
import { trimInputForFilter } from './textFilterUtils';

export class TextFilter extends SimpleFilter<TextFilterModel, string, TextFilterParams> {
    protected filterType = 'text' as const;

    private readonly eValuesFrom: AgInputTextField[] = [];
    private readonly eValuesTo: AgInputTextField[] = [];

    private filterModelFormatter: TextFilterModelFormatter;

    constructor() {
        super('textFilter', new TextFilterHelper());
    }

    protected override defaultDebounceMs: number = 500;

    protected override commonUpdateSimpleParams(params: TextFilterParams): void {
        super.commonUpdateSimpleParams(params);

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
                if (applySideEffects && this.params.trimInput) {
                    value = trimInputForFilter(value) ?? null;
                    element.setValue(value, true); // ensure clean value is visible
                }
                result.push(value);
            }
        });

        return result;
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

    public getModelAsString(model: ISimpleFilterModel): string {
        return this.filterModelFormatter.getModelAsString(model) ?? '';
    }
}
