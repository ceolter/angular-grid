import type {
    AgCheckboxParams,
    AgFieldParams,
    AgInputNumberFieldParams,
    AgSelectParams,
    BeanCollection,
    ListOption,
} from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

import type { AgColorPickerParams } from '../../widgets/agColorPicker';
import type { AgSliderParams } from '../../widgets/agSlider';
import type { ChartOptionsProxy } from '../services/chartOptionsService';
import type { ChartTranslationKey, ChartTranslationService } from '../services/chartTranslationService';
import type { FontPanelParams } from './format/fontPanel';

export class ChartMenuParamsFactory extends BeanStub {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }

    constructor(private readonly chartOptionsProxy: ChartOptionsProxy) {
        super();
    }

    public getDefaultColorPickerParams(
        expression: string,
        labelKey?: ChartTranslationKey,
        options?: {
            parseInputValue: (value: any) => any;
            formatInputValue: (value: any) => any;
        }
    ): AgColorPickerParams {
        return this.addValueParams(
            expression,
            {
                label: this.chartTranslation.translate(labelKey ?? 'color'),
                labelWidth: 'flex',
                inputWidth: 'flex',
                labelAlignment: 'top',
                pickerGap: 6,
            },
            options
        );
    }

    public getDefaultNumberInputParams(
        expression: string,
        labelKey: ChartTranslationKey,
        options?: {
            precision?: number;
            step?: number;
            min?: number;
            max?: number;
        }
    ): AgInputNumberFieldParams {
        return this.addValueParams<AgInputNumberFieldParams>(
            expression,
            {
                label: this.chartTranslation.translate(labelKey),
                labelAlignment: 'top',
                labelWidth: 'flex',
                inputWidth: 'flex',
                precision: options?.precision,
                step: options?.step,
                min: options?.min,
                max: options?.max,
            },
            {
                parseInputValue: (value) => {
                    const numberValue = Number(value);
                    return isNaN(numberValue) ? undefined : numberValue;
                },
                formatInputValue: (value) => {
                    return value == null ? '' : `${value}`;
                },
            }
        );
    }

    public getDefaultSliderParams(
        expression: string,
        labelKey: ChartTranslationKey,
        defaultMaxValue: number,
        isArray?: boolean
    ): AgSliderParams {
        let value = this.chartOptionsProxy.getValue<number>(expression) ?? 0;
        if (isArray && Array.isArray(value)) {
            value = value[0];
        }
        const params = this.getDefaultSliderParamsWithoutValueParams(value, labelKey, defaultMaxValue);
        params.onValueChange = (value) => this.chartOptionsProxy.setValue(expression, isArray ? [value] : value);
        return params;
    }

    public getDefaultSliderParamsWithoutValueParams(
        value: number,
        labelKey: ChartTranslationKey,
        defaultMaxValue: number
    ): AgSliderParams {
        return {
            label: this.chartTranslation.translate(labelKey),
            minValue: 0,
            maxValue: Math.max(value, defaultMaxValue),
            textFieldWidth: 45,
            value: `${value}`,
        };
    }

    public getDefaultCheckboxParams(
        expression: string,
        labelKey: ChartTranslationKey,
        options?: {
            readOnly?: boolean;
            passive?: boolean;
        }
    ): AgCheckboxParams {
        const value = this.chartOptionsProxy.getValue<boolean>(expression);
        const params: AgCheckboxParams = {
            label: this.chartTranslation.translate(labelKey),
            value,
            readOnly: options?.readOnly,
            passive: options?.passive,
        };
        params.onValueChange = (value) => {
            this.chartOptionsProxy.setValue(expression, typeof value === 'boolean' ? value : undefined);
        };
        return params;
    }

    public getDefaultSelectParams(
        expression: string,
        labelKey: ChartTranslationKey,
        dropdownOptions: Array<ListOption>
    ): AgSelectParams {
        return this.getDefaultSelectParamsWithoutValueParams(
            labelKey,
            dropdownOptions,
            this.chartOptionsProxy.getValue(expression),
            (value) => {
                this.chartOptionsProxy.setValue(expression, value);
            }
        );
    }

    public getDefaultSelectParamsWithoutValueParams(
        labelKey: ChartTranslationKey,
        options: Array<ListOption>,
        value: any,
        onValueChange: (value: any) => void
    ): AgSelectParams {
        return {
            label: this.chartTranslation.translate(labelKey),
            labelAlignment: 'top',
            options,
            pickerGap: 6,
            value,
            onValueChange,
        };
    }

    public getDefaultFontPanelParams(expression: string, labelKey: ChartTranslationKey): FontPanelParams {
        const keyMapper = (key: string) => `${expression}.${key}`;
        return this.addEnableParams<FontPanelParams>(keyMapper('enabled'), {
            name: this.chartTranslation.translate(labelKey),
            suppressEnabledCheckbox: false,
            chartMenuParamsFactory: this,
            keyMapper,
        } as any);
    }

    public addValueParams<P extends AgFieldParams>(
        expression: string,
        params: P,
        options?: {
            parseInputValue: (value: any) => any;
            formatInputValue: (value: any) => any;
        }
    ): P {
        const optionsValue = this.chartOptionsProxy.getValue(expression);
        params.value = options?.formatInputValue ? options.formatInputValue(optionsValue) : optionsValue;
        params.onValueChange = (value) => {
            const optionsValue = options?.parseInputValue ? options.parseInputValue(value) : value;
            this.chartOptionsProxy.setValue(expression, optionsValue);
        };
        return params;
    }

    public addEnableParams<
        P extends {
            enabled?: boolean;
            onEnableChange?: (value: boolean) => void;
        },
    >(expression: string, params: P): P {
        params.enabled = this.chartOptionsProxy.getValue(expression) ?? false;
        params.onEnableChange = (value) => this.chartOptionsProxy.setValue(expression, value);
        return params;
    }

    public getChartOptions(): ChartOptionsProxy {
        return this.chartOptionsProxy;
    }
}
