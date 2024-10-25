import type { DataTypeService } from '../../columns/dataTypeService';
import type { BeanCollection } from '../../context/context';
import type { AgColumn } from '../../entities/agColumn';
import { _parseDateTimeFromString, _serialiseDate } from '../../utils/date';
import { _exists } from '../../utils/generic';
import type { AgInputDateField } from '../../widgets/agInputDateField';
import { AgInputDateFieldSelector } from '../../widgets/agInputDateField';
import type { CellEditorInput } from './iCellEditorInput';
import type { IDateStringCellEditorParams } from './iDateStringCellEditor';
import { SimpleCellEditor } from './simpleCellEditor';

class DateStringCellEditorInput implements CellEditorInput<string, IDateStringCellEditorParams, AgInputDateField> {
    private eInput: AgInputDateField;
    private params: IDateStringCellEditorParams;

    constructor(private getDataTypeService: () => DataTypeService | undefined) {}

    public getTemplate() {
        return /* html */ `<ag-input-date-field class="ag-cell-editor" data-ref="eInput"></ag-input-date-field>`;
    }
    public getAgComponents() {
        return [AgInputDateFieldSelector];
    }

    public init(eInput: AgInputDateField, params: IDateStringCellEditorParams): void {
        this.eInput = eInput;
        this.params = params;
        if (params.min != null) {
            eInput.setMin(params.min);
        }
        if (params.max != null) {
            eInput.setMax(params.max);
        }
        if (params.step != null) {
            eInput.setStep(params.step);
        }
    }

    public getValue(): string | null | undefined {
        const value = this.formatDate(this.eInput.getDate());
        if (!_exists(value) && !_exists(this.params.value)) {
            return this.params.value;
        }
        return this.params.parseValue(value ?? '');
    }

    public getStartValue(): string | null | undefined {
        return _serialiseDate(this.parseDate(this.params.value ?? undefined) ?? null, false);
    }

    private parseDate(value: string | undefined): Date | undefined {
        const dataTypeSvc = this.getDataTypeService();
        return dataTypeSvc
            ? dataTypeSvc.getDateParserFunction(this.params.column as AgColumn)(value)
            : _parseDateTimeFromString(value) ?? undefined;
    }

    private formatDate(value: Date | undefined): string | undefined {
        const dataTypeSvc = this.getDataTypeService();
        return dataTypeSvc
            ? dataTypeSvc.getDateFormatterFunction(this.params.column as AgColumn)(value)
            : _serialiseDate(value ?? null, false) ?? undefined;
    }
}

export class DateStringCellEditor extends SimpleCellEditor<string, IDateStringCellEditorParams, AgInputDateField> {
    private dataTypeSvc?: DataTypeService;

    public wireBeans(beans: BeanCollection): void {
        this.dataTypeSvc = beans.dataTypeSvc;
    }

    constructor() {
        super(new DateStringCellEditorInput(() => this.dataTypeSvc));
    }
}
